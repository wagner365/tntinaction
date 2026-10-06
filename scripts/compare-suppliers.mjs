#!/usr/bin/env node
// Prices common orders with every supplier in data/pricing.json.
//   npm run compare
//   npm run compare -- hoodie 36 1 1     (garment, qty, front colors, back colors)

import { readFileSync } from 'node:fs';
import { compareSuppliers } from '../assets/js/pricing.js';

const config = JSON.parse(readFileSync(new URL('../data/pricing.json', import.meta.url)));
const [garmentId, qty, front, back] = process.argv.slice(2);

const scenarios = garmentId
  ? [{ garmentId, qty: Number(qty) || 48, frontColors: Number(front ?? 1), backColors: Number(back ?? 0) }]
  : [
      { garmentId: 'tee', qty: 12, frontColors: 1, backColors: 0 },
      { garmentId: 'tee', qty: 48, frontColors: 1, backColors: 0 },
      { garmentId: 'tee', qty: 48, frontColors: 2, backColors: 1 },
      { garmentId: 'hoodie', qty: 24, frontColors: 1, backColors: 0 },
      { garmentId: 'crewneck', qty: 36, frontColors: 1, backColors: 0 },
    ];

for (const s of scenarios) {
  console.log(`\n${s.qty} × ${s.garmentId}, front ${s.frontColors} color(s), back ${s.backColors}`);
  console.table(
    compareSuppliers(config, s).map((r) =>
      r.error
        ? { supplier: r.id, note: r.error }
        : {
            supplier: r.id + (r.id === config.activeSupplier ? ' (active)' : ''),
            'your cost': r.unitCost,
            'customer price': r.unitPrice,
            'profit/order': r.profit,
            'days': r.turnaroundBusinessDays,
            method: r.method,
          }
    )
  );
}
