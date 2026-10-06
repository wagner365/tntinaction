#!/usr/bin/env node
// Turns a payments export (Stripe, Google Forms, anything CSV) into the
// size breakdown a printer needs when a group order closes.
//
//   node scripts/size-report.mjs orders.csv
//   node scripts/size-report.mjs orders.csv --size-col "Size" --product-col "Item" --out printer.csv
//
// Columns are auto-detected by name (a column containing "size", and one
// containing "product", "item" or "description"). If a status column exists,
// only paid/succeeded/complete rows are counted. A "quantity" column is
// honored when present.

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'OS'];

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export function normalizeSize(raw) {
  const s = String(raw).trim().toUpperCase().replace(/\s+/g, '');
  const aliases = {
    XSMALL: 'XS', EXTRASMALL: 'XS', SMALL: 'S', MEDIUM: 'M', MED: 'M', LARGE: 'L',
    XLARGE: 'XL', EXTRALARGE: 'XL', XXL: '2XL', XXXL: '3XL', XXXXL: '4XL',
    ONESIZE: 'OS', ONESIZEFITSALL: 'OS',
  };
  return aliases[s] ?? s;
}

function findColumn(headers, explicit, patterns) {
  if (explicit) {
    const idx = headers.findIndex((h) => h.trim().toLowerCase() === explicit.toLowerCase());
    if (idx === -1) throw new Error(`Column "${explicit}" not found. Columns: ${headers.join(', ')}`);
    return idx;
  }
  for (const pattern of patterns) {
    const idx = headers.findIndex((h) => pattern.test(h));
    if (idx !== -1) return idx;
  }
  return -1;
}

const PAID = /^(paid|succeeded|complete|completed|payment)$/i;

export function buildReport(csvText, opts = {}) {
  const [headers, ...rows] = parseCsv(csvText);
  if (!headers) throw new Error('CSV is empty');

  // "Price Point Name" is the variation (size) column in Square's Item Detail export.
  const sizeIdx = findColumn(headers, opts.sizeCol, [/size/i, /^price point name$/i, /variation/i]);
  if (sizeIdx === -1) throw new Error(`No size column found. Columns: ${headers.join(', ')}. Use --size-col.`);
  const productIdx = findColumn(headers, opts.productCol, [/product/i, /^item$/i, /item/i, /description/i]);
  const qtyIdx = findColumn(headers, opts.qtyCol, [/^quantity$/i, /^qty$/i]);
  // Stripe uses "Status"; Square uses "Event Type" (Payment / Refund rows).
  const statusIdx = findColumn(headers, null, [/^status$/i, /^event type$/i]);

  const counts = new Map(); // product -> Map(size -> qty)
  let skipped = 0;
  for (const row of rows) {
    const status = statusIdx === -1 ? '' : row[statusIdx]?.trim() ?? '';
    const isRefundRow = /^refund$/i.test(status);
    if (statusIdx !== -1 && !PAID.test(status) && !isRefundRow) {
      skipped++;
      continue;
    }
    const size = normalizeSize(row[sizeIdx] ?? '');
    if (!size) {
      skipped++;
      continue;
    }
    const product = productIdx === -1 ? 'Item' : (row[productIdx] ?? '').trim() || 'Item';
    const rawQty = qtyIdx === -1 ? 1 : Math.abs(parseFloat(row[qtyIdx]) || 0);
    // A separate refund row takes pieces back out of the count.
    const qty = isRefundRow ? -rawQty : rawQty;
    if (!counts.has(product)) counts.set(product, new Map());
    const bySize = counts.get(product);
    bySize.set(size, (bySize.get(size) ?? 0) + qty);
  }
  for (const bySize of counts.values()) {
    for (const [size, n] of bySize) if (n <= 0) bySize.delete(size);
  }
  for (const [product, bySize] of counts) if (bySize.size === 0) counts.delete(product);

  const allSizes = new Set();
  for (const bySize of counts.values()) for (const s of bySize.keys()) allSizes.add(s);
  const sizes = [...allSizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });

  const products = [...counts.entries()].map(([name, bySize]) => {
    const perSize = sizes.map((s) => bySize.get(s) ?? 0);
    return { name, perSize, total: perSize.reduce((a, b) => a + b, 0) };
  });

  return { sizes, products, grandTotal: products.reduce((a, p) => a + p.total, 0), skipped };
}

export function reportToCsv(report) {
  const esc = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const lines = [['Product', ...report.sizes, 'Total']];
  for (const p of report.products) lines.push([p.name, ...p.perSize, p.total]);
  lines.push(['TOTAL', ...report.sizes.map((_, i) => report.products.reduce((a, p) => a + p.perSize[i], 0)), report.grandTotal]);
  return lines.map((l) => l.map(esc).join(',')).join('\n') + '\n';
}

function parseArgs(argv) {
  const opts = {};
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    const flag = { '--size-col': 'sizeCol', '--product-col': 'productCol', '--qty-col': 'qtyCol', '--out': 'out' }[argv[i]];
    if (flag) opts[flag] = argv[++i];
    else files.push(argv[i]);
  }
  return { opts, file: files[0] };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { opts, file } = parseArgs(process.argv.slice(2));
  if (!file) {
    console.error('Usage: node scripts/size-report.mjs <orders.csv> [--size-col NAME] [--product-col NAME] [--qty-col NAME] [--out FILE]');
    process.exit(1);
  }
  try {
    const report = buildReport(readFileSync(file, 'utf8'), opts);
    const table = report.products.map((p) => ({
      Product: p.name,
      ...Object.fromEntries(report.sizes.map((s, i) => [s, p.perSize[i]])),
      Total: p.total,
    }));
    console.table(table);
    console.log(`Grand total: ${report.grandTotal} pieces${report.skipped ? ` (${report.skipped} unpaid/blank rows skipped)` : ''}`);
    if (opts.out) {
      writeFileSync(opts.out, reportToCsv(report));
      console.log(`Printer sheet written to ${opts.out}`);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}
