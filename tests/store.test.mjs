import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { storeStatus, formatLeft } from '../assets/js/store-status.js';

test('open before close time, closed after, closed when open=false', () => {
  const store = { closes: '2027-03-07T23:59:00-05:00' };
  assert.equal(storeStatus(store, new Date('2027-03-01T12:00:00-05:00')).isOpen, true);
  assert.equal(storeStatus(store, new Date('2027-03-08T00:00:00-05:00')).isOpen, false);
  assert.equal(storeStatus({ ...store, open: false }, new Date('2027-03-01')).isOpen, false);
  assert.throws(() => storeStatus({ closes: 'soon' }), /Bad "closes"/);
  assert.match(storeStatus(store).closesLabel, /Sun, Mar 7, 11:59 PM EST/);
});

test('formatLeft', () => {
  assert.equal(formatLeft(3 * 86_400_000), '3 days');
  assert.equal(formatLeft(30 * 3_600_000), '30 hours');
  assert.equal(formatLeft(3_600_000), '1 hour');
  assert.equal(formatLeft(90_000), '2 min');
});

// Catches typos in store files before an org sees a broken page.
test('every store file is valid', () => {
  const dir = new URL('../stores/', import.meta.url);
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    assert.match(file, /^[a-z0-9-]+\.json$/, `${file}: use lowercase letters, numbers and dashes only`);
    const store = JSON.parse(readFileSync(new URL(file, dir)));
    for (const key of ['org', 'title', 'closes', 'products']) assert.ok(store[key], `${file}: missing "${key}"`);
    assert.ok(!Number.isNaN(new Date(store.closes).getTime()), `${file}: bad closes date`);
    if (store.claimLink) assert.match(store.claimLink, /^https:\/\//, `${file}: claimLink must be an https link`);
    for (const p of store.products) {
      const priceOk = typeof p.price === 'number' && (store.free ? p.price >= 0 : p.price > 0);
      assert.ok(p.name && priceOk, `${file}: product needs a name and a price${store.free ? '' : ' above 0'}`);
      for (const key of ['payLink', 'claimLink']) {
        if (p[key]) assert.match(p[key], /^https:\/\//, `${file}: ${key} must be an https link`);
      }
    }
  }
});
