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

test('old room no longer lists client after creating new one', async () => {
  const server = http.createServer();
  const wss = attachWebSocketServer(server);
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
  const created1 = await waitMessage(a, d => d.type === 'room_created');
  const room1 = created1.roomId;

  const startA = waitMessage(a, d => d.type === 'start_game');
  const startB = waitMessage(b, d => d.type === 'start_game');
  b.send(JSON.stringify({ type: 'join', roomId: room1 }));
  await Promise.all([startA, startB]);

  const leftP = waitMessage(b, d => d.type === 'opponent_left');
  a.send(JSON.stringify({ type: 'create' }));
  const created2 = await waitMessage(a, d => d.type === 'room_created' && d.roomId !== room1);
  const room2 = created2.roomId;

  await leftP;

  assert.equal(wss.rooms[room1].players.length, 1);
  assert.equal(wss.rooms[room2].players.length, 1);

  a.close();
  b.close();
  server.close();
});

