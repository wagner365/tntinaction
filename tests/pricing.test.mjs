import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { quote, compareSuppliers, fundraiser, nextPriceBreak, roundUp } from '../assets/js/pricing.js';

const real = JSON.parse(readFileSync(new URL('../data/pricing.json', import.meta.url)));

// Fixed numbers so tests don't break every time real costs are edited.
const config = {
  activeSupplier: 'pod',
  targetMargin: 0.4,
  roundTo: 0.5,
  maxColorsPerLocation: 6,
  garments: [
    { id: 'tee', name: 'Tee' },
    { id: 'hoodie', name: 'Hoodie' },
  ],
  suppliers: {
    pod: {
      name: 'POD', method: 'digital', turnaroundBusinessDays: 8,
      garmentCost: { tee: 10, hoodie: 20 }, extraLocation: 5, shippingPerPiece: 1,
      qtyDiscounts: [{ minQty: 1, pct: 0 }, { minQty: 25, pct: 0.2 }],
    },
    screen: {
      name: 'Screen', method: 'screen', turnaroundBusinessDays: 7, fallbackSupplier: 'pod',
      blankCost: { tee: 4 }, minQty: 24, setupPerScreen: 20, shippingPerPiece: 0,
      tiers: [{ minQty: 24, firstColor: 2, extraColor: 0.5 }, { minQty: 48, firstColor: 1.5, extraColor: 0.5 }],
    },
  },
};

test('roundUp rounds up to the step and tolerates float noise', () => {
  assert.equal(roundUp(12.01, 0.5), 12.5);
  assert.equal(roundUp(12.0000000001, 0.5), 12);
  assert.equal(roundUp(12.37, 0), 12.37);
});

test('digital: base + shipping, margin applied, colors ignored', () => {
  const q = quote(config, { garmentId: 'tee', qty: 10, frontColors: 5, backColors: 0 });
  // (10 + 1) / 0.6 = 18.33 -> 18.50
  assert.equal(q.method, 'digital');
  assert.equal(q.unitCost, 11);
  assert.equal(q.unitPrice, 18.5);
  assert.equal(q.total, 185);
  assert.equal(q.turnaroundBusinessDays, 8);
});

test('digital: bulk discount and extra print location', () => {
  const q = quote(config, { garmentId: 'tee', qty: 25, frontColors: 1, backColors: 1 });
  // 10*0.8 + 5 + 1 = 14
  assert.equal(q.unitCost, 14);
});

test('screen: blank + per-color print + setup spread over qty', () => {
  const q = quote(config, { garmentId: 'tee', qty: 48, frontColors: 2, backColors: 0, supplier: 'screen' });
  // 4 + (1.5 + 0.5) + 2 screens * 20 / 48
  assert.equal(q.method, 'screen');
  assert.equal(q.unitCost, Math.round((6 + 40 / 48) * 100) / 100);
});

test('screen falls back to its backup supplier under the minimum', () => {
  const q = quote(config, { garmentId: 'tee', qty: 10, frontColors: 1, backColors: 0, supplier: 'screen' });
  assert.equal(q.method, 'digital');
  assert.equal(q.supplier, 'POD');
});

test('compareSuppliers reports errors per supplier instead of throwing', () => {
  const rows = compareSuppliers(config, { garmentId: 'hoodie', qty: 30, frontColors: 1, backColors: 0 });
  assert.equal(rows.find((r) => r.id === 'pod').unitCost, 17);
  assert.match(rows.find((r) => r.id === 'screen').error, /doesn't offer/);
});

test('rejects bad input', () => {
  assert.throws(() => quote(config, { garmentId: 'nope', qty: 10, frontColors: 1 }), /Unknown garment/);
  assert.throws(() => quote(config, { garmentId: 'tee', qty: 0, frontColors: 1 }), /at least 1/);
  assert.throws(() => quote(config, { garmentId: 'tee', qty: 10, frontColors: 0, backColors: 0 }), /print location/);
  assert.throws(() => quote(config, { garmentId: 'tee', qty: 10, frontColors: 9 }), /between 0 and/);
  assert.throws(() => quote(config, { garmentId: 'tee', qty: 10, frontColors: 1, supplier: 'x' }), /Unknown supplier/);
});

test('fundraiser math', () => {
  assert.deepEqual(fundraiser(11.5, 20, 48), { perItem: 8.5, total: 408 });
});

test('nextPriceBreak follows the supplier and its fallback', () => {
  assert.equal(nextPriceBreak(config, 6), 25);
  assert.equal(nextPriceBreak(config, 30), null);
  assert.equal(nextPriceBreak(config, 10, 'screen'), 24);
  assert.equal(nextPriceBreak(config, 30, 'screen'), 48);
});

// Sanity checks on the real pricing file, so a typo never reaches the site.
test('real pricing file: every supplier prices every garment it lists, and bulk never costs more', () => {
  assert.ok(real.suppliers[real.activeSupplier], 'activeSupplier must exist');
  for (const id of Object.keys(real.suppliers)) {
    for (const g of real.garments) {
      let last = Infinity;
      for (const qty of [1, 12, 24, 48, 72, 144, 300]) {
        const q = quote(real, { garmentId: g.id, qty, frontColors: 1, backColors: 0, supplier: id });
        assert.ok(q.unitPrice > q.unitCost, `${id}/${g.id}: price must exceed cost`);
        assert.ok(q.unitPrice <= last, `${id}/${g.id}: price went up at qty ${qty}`);
        last = q.unitPrice;
      }
    }
  }
});
