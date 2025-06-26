const assert = require('assert');
const { test } = require('node:test');
const { isValidMove } = require('./server');

test('isValidMove recognises valid actions', () => {
  assert.ok(isValidMove('up'));
  assert.ok(isValidMove('shield'));
  assert.ok(isValidMove({ type: 'attack', dirs: [] }));
  assert.ok(isValidMove({ type: 'attack', dirs: ['left', 'right'] }));
});

test('isValidMove rejects invalid actions', () => {
  assert.equal(isValidMove('jump'), false);
  assert.equal(isValidMove({}), false);
  assert.equal(isValidMove({ type: 'attack', dirs: 'up' }), false);
  assert.equal(isValidMove({ type: 'attack', dirs: [123] }), false);
  assert.equal(isValidMove({ type: 'move', dirs: ['up'] }), false);
});
