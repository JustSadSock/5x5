const assert = require('assert');
const http = require('http');
const WebSocket = require('ws');
const { test } = require('node:test');
const { attachWebSocketServer } = require('./server');

function waitMessage(ws, filter) {
  return new Promise(resolve => {
    function onMessage(raw) {
      const data = JSON.parse(raw);
      if (!filter || filter(data)) {
        ws.off('message', onMessage);
        resolve(data);
      }
    }
    ws.on('message', onMessage);
  });
}

test('round flow', async t => {
  const server = http.createServer();
  attachWebSocketServer(server);
  await new Promise(res => server.listen(0, res));
  const { port } = server.address();
  const url = `ws://localhost:${port}`;

  const a = new WebSocket(url);
  const b = new WebSocket(url);

  await Promise.all([
    new Promise(res => a.once('open', res)),
    new Promise(res => b.once('open', res))
  ]);

  a.send(JSON.stringify({ type: 'create' }));
  const created = await waitMessage(a, d => d.type === 'room_created');
  const roomId = created.roomId;

  b.send(JSON.stringify({ type: 'join', roomId }));

  const movesA = ['up', 'down', 'left', 'right', 'shield'];
  const movesB = ['down', 'down', 'up', 'left', 'shield'];

  const confirmsA = [];
  const confirmsB = [];
  const startA = waitMessage(a, d => d.type === 'start_round');
  const startB = waitMessage(b, d => d.type === 'start_round');

  a.on('message', msg => {
    const d = JSON.parse(msg);
    if (d.type === 'player_confirmed') confirmsA.push(d.playerIndex);
  });
  b.on('message', msg => {
    const d = JSON.parse(msg);
    if (d.type === 'player_confirmed') confirmsB.push(d.playerIndex);
  });

  a.send(JSON.stringify({ type: 'submit_moves', moves: movesA }));
  b.send(JSON.stringify({ type: 'submit_moves', moves: movesB }));

  const roundA = await startA;
  const roundB = await startB;

  assert.deepEqual(confirmsA.sort(), [0, 1]);
  assert.deepEqual(confirmsB.sort(), [0, 1]);
  assert.deepEqual(roundA.moves[0], movesA);
  assert.deepEqual(roundA.moves[1], movesB);
  assert.deepEqual(roundB.moves[0], movesA);
  assert.deepEqual(roundB.moves[1], movesB);

  const okWaitA = waitMessage(
    a,
    d => d.type === 'state_ok' || d.type === 'state_mismatch'
  );
  const okWaitB = waitMessage(
    b,
    d => d.type === 'state_ok' || d.type === 'state_mismatch'
  );
  a.send(JSON.stringify({ type: 'state', state: 'SAME' }));
  b.send(JSON.stringify({ type: 'state', state: 'SAME' }));
  const okA = await okWaitA;
  const okB = await okWaitB;
  assert.equal(okA.type, 'state_ok');
  assert.equal(okB.type, 'state_ok');

  const mmWaitA = waitMessage(
    a,
    d => d.type === 'state_ok' || d.type === 'state_mismatch'
  );
  const mmWaitB = waitMessage(
    b,
    d => d.type === 'state_ok' || d.type === 'state_mismatch'
  );
  a.send(JSON.stringify({ type: 'state', state: 'A' }));
  b.send(JSON.stringify({ type: 'state', state: 'B' }));
  const mmA = await mmWaitA;
  const mmB = await mmWaitB;
  assert.equal(mmA.type, 'state_mismatch');
  assert.equal(mmB.type, 'state_mismatch');

  a.close();
  b.close();
  server.close();
});
