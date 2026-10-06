import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, normalizeSize, buildReport, reportToCsv } from '../scripts/size-report.mjs';

test('parseCsv handles quotes, escaped quotes, commas and CRLF', () => {
  const rows = parseCsv('a,b\r\n"x, y","say ""hi"""\n\n');
  assert.deepEqual(rows, [['a', 'b'], ['x, y', 'say "hi"']]);
});

test('normalizeSize maps common spellings', () => {
  assert.equal(normalizeSize(' medium '), 'M');
  assert.equal(normalizeSize('xxl'), '2XL');
  assert.equal(normalizeSize('X Large'), 'XL');
  assert.equal(normalizeSize('One Size'), 'OS');
});

test('buildReport groups by product and size, skips unpaid rows', () => {
  const csv = [
    'id,Description,Status,Size,Quantity',
    '1,Club Hoodie,Paid,M,1',
    '2,Club Hoodie,Paid,medium,2',
    '3,Club Hoodie,Refunded,L,1',
    '4,Club Tee,succeeded,XXL,1',
    '5,Club Tee,Paid,S,1',
    '6,Club Tee,Paid,,1',
  ].join('\n');
  const r = buildReport(csv);
  assert.deepEqual(r.sizes, ['S', 'M', '2XL']);
  assert.deepEqual(r.products, [
    { name: 'Club Hoodie', perSize: [0, 3, 0], total: 3 },
    { name: 'Club Tee', perSize: [1, 0, 1], total: 2 },
  ]);
  assert.equal(r.grandTotal, 5);
  assert.equal(r.skipped, 2);
  assert.equal(
    reportToCsv(r),
    'Product,S,M,2XL,Total\nClub Hoodie,0,3,0,3\nClub Tee,1,0,1,2\nTOTAL,1,3,1,5\n'
  );
});

test('Square Item Detail export: sizes from Price Point Name, refund rows subtract', () => {
  const csv = [
    'Date,Category,Item,Qty,Price Point Name,SKU,Gross Sales,Event Type,Customer Name',
    '2027-03-01,Merch,Team Hoodie,1,M,,$40.00,Payment,A',
    '2027-03-01,Merch,Team Hoodie,2,Large,,$80.00,Payment,B',
    '2027-03-02,Merch,Team Hoodie,-1,Large,,-$40.00,Refund,B',
    '2027-03-02,Merch,Practice Tee,1,S,,$20.00,Payment,C',
    '2027-03-03,Merch,Practice Tee,1,S,,-$20.00,Refund,C',
  ].join('\n');
  const r = buildReport(csv);
  assert.deepEqual(r.products, [{ name: 'Team Hoodie', perSize: [1, 1], total: 2 }]);
  assert.deepEqual(r.sizes, ['M', 'L']);
});

test('explicit column names and a clear error when missing', () => {
  const csv = 'Pick your fit,What,Count\nL,Tee,2\n';
  assert.equal(buildReport(csv, { sizeCol: 'Pick your fit', productCol: 'What', qtyCol: 'Count' }).grandTotal, 2);
  assert.throws(() => buildReport('a,b\n1,2\n'), /No size column/);
  assert.throws(() => buildReport(csv, { sizeCol: 'Nope' }), /not found/);
});
