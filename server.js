const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

const rooms = {};

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

wss.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg); } catch (e) { return; }
    if (data.type === 'create') {
      let code;
      do { code = genCode(); } while (rooms[code]);
      rooms[code] = { players: [ws], states: [null, null] };
      ws.roomId = code;
      ws.playerIndex = 0;
      ws.send(JSON.stringify({ type: 'room_created', roomId: code }));
    } else if (data.type === 'join') {
      const room = rooms[data.roomId];
      if (!room || room.players.length >= 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Комната недоступна' }));
        return;
      }
      room.players.push(ws);
      ws.roomId = data.roomId;
      ws.playerIndex = 1;
      room.players.forEach((p, i) => {
        p.send(JSON.stringify({ type: 'start_game', playerIndex: i }));
      });
    } else if (data.type === 'move') {
      const room = rooms[ws.roomId];
      if (!room) return;
      const opp = room.players[ws.playerIndex ^ 1];
      if (opp && opp.readyState === WebSocket.OPEN) {
        opp.send(JSON.stringify({ type: 'opponent_move', move: data.move }));
      }
    } else if (data.type === 'state') {
      const room = rooms[ws.roomId];
      if (!room) return;
      room.states[ws.playerIndex] = data.state;
      if (room.states[0] && room.states[1]) {
        const ok = room.states[0] === room.states[1];
        room.players.forEach(p => p.send(JSON.stringify({ type: ok ? 'state_ok' : 'state_mismatch' })));
        room.states = [null, null];
      }
    }
  });
  ws.on('close', () => {
    const roomId = ws.roomId;
    if (!roomId) return;
    const room = rooms[roomId];
    if (!room) return;
    room.players = room.players.filter(p => p !== ws);
    room.players.forEach(p => p.send(JSON.stringify({ type: 'opponent_left' })));
    if (room.players.length === 0) delete rooms[roomId];
  });
});

console.log('WebSocket server running on ws://localhost:8080');
