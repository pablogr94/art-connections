const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const model = require('../core.js');

test('dropping one tile on another swaps only those positions without mutating the original', () => {
  assert.equal(typeof model.swap, 'function', 'swap behavior is not implemented');
  const source = ['a', 'b', 'c', 'd'];
  assert.deepEqual(model.swap(source, 0, 3), ['d', 'b', 'c', 'a']);
  assert.deepEqual(source, ['a', 'b', 'c', 'd']);
  assert.deepEqual(model.swap(source, 1, 1), source);
  assert.deepEqual(model.swap(source, -1, 2), source);
});

test('checking accepts any row position and any order inside each candidate group', () => {
  assert.equal(typeof model.checkRows, 'function', 'row checking is not implemented');
  const works = Array.from({length: 16}, (_, i) => ({id: String(i), group: Math.floor(i / 4)}));
  const order = ['7','6','5','4','0','1','2','3','15','14','13','12','8','9','10','11'];
  assert.deepEqual(model.checkRows(order, works), [1,0,3,2]);
  assert.deepEqual(model.checkRows(model.swap(order,0,4), works), [null,null,3,2]);
});

test('persisted orders must contain every artwork exactly once', () => {
  assert.equal(typeof model.validOrder, 'function', 'saved-order validation is not implemented');
  const ids = ['a','b','c','d'];
  assert.equal(model.validOrder(['d','c','b','a'], ids), true);
  assert.equal(model.validOrder(['a','a','c','d'], ids), false);
  assert.equal(model.validOrder(['a','b','c','x'], ids), false);
  assert.equal(model.validOrder(null, ids), false);
});

test('requesting a hint reveals exactly the next clue and stops at the total', () => {
  assert.equal(typeof model.nextHintCount, 'function', 'progressive clues are not implemented');
  let count = 0;
  assert.equal(count, 0);
  for (const expected of [1, 2, 3, 4, 4, 4]) {
    count = model.nextHintCount(count, 4);
    assert.equal(count, expected);
  }
  assert.equal(model.nextHintCount(-10, 4), 1);
  assert.equal(model.nextHintCount('bad', 4), 1);
});
