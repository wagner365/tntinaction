import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { quote, fundraiser, nextPriceBreak, roundUp } from '../assets/js/pricing.js';

const config = JSON.parse(readFileSync(new URL('../data/pricing.json', import.meta.url)));

test('roundUp rounds up to the step and tolerates float noise', () => {
  assert.equal(roundUp(12.01, 0.5), 12.5);
  assert.equal(roundUp(12.0000000001, 0.5), 12);
  assert.equal(roundUp(12.37, 0), 12.37);
});

test('48 tees, 1-color front, uses screen print with setup folded in', () => {
  const q = quote(config, { garmentId: 'tee', qty: 48, frontColors: 1, backColors: 0 });
  // cost = 4.50 blank + 1.75 print + 20/48 setup = 6.6667 -> /0.6 = 11.11 -> 11.50
  assert.equal(q.method, 'screen');
  assert.equal(q.unitCost, 6.67);
  assert.equal(q.unitPrice, 11.5);
  assert.equal(q.total, 552);
});

test('extra colors and back print add cost and screens', () => {
  const one = quote(config, { garmentId: 'hoodie', qty: 24, frontColors: 1, backColors: 0 });
  const many = quote(config, { garmentId: 'hoodie', qty: 24, frontColors: 2, backColors: 3 });
  assert.ok(many.unitPrice > one.unitPrice);
  // 15 + (2.25+0.6) + (2.25+1.2) + 5 screens*20/24
  assert.equal(many.unitCost, cents(15 + 2.85 + 3.45 + 100 / 24));
});

test('small orders switch to digital print with no setup', () => {
  const q = quote(config, { garmentId: 'tee', qty: 6, frontColors: 4, backColors: 0 });
  assert.equal(q.method, 'digital');
  assert.equal(q.unitCost, 10.5);
  assert.equal(q.unitPrice, 17.5);
});

test('bigger orders never cost more per unit', () => {
  let last = Infinity;
  for (const qty of [12, 24, 48, 72, 144, 300]) {
    const { unitPrice } = quote(config, { garmentId: 'tee', qty, frontColors: 2, backColors: 1 });
    assert.ok(unitPrice <= last, `price went up at qty ${qty}`);
    last = unitPrice;
  }
});

test('rejects bad input', () => {
  assert.throws(() => quote(config, { garmentId: 'nope', qty: 10, frontColors: 1 }), /Unknown garment/);
  assert.throws(() => quote(config, { garmentId: 'tee', qty: 0, frontColors: 1 }), /at least 1/);
  assert.throws(() => quote(config, { garmentId: 'tee', qty: 10, frontColors: 0, backColors: 0 }), /print location/);
  assert.throws(() => quote(config, { garmentId: 'tee', qty: 10, frontColors: 9 }), /between 0 and/);
});

test('fundraiser math', () => {
  assert.deepEqual(fundraiser(11.5, 20, 48), { perItem: 8.5, total: 408 });
});

test('nextPriceBreak', () => {
  assert.equal(nextPriceBreak(config, 6), 12);
  assert.equal(nextPriceBreak(config, 30), 48);
  assert.equal(nextPriceBreak(config, 200), null);
});

function cents(n) {
  return Math.round(n * 100) / 100;
}
