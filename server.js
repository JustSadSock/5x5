const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const ngrok = require('@ngrok/ngrok');

const publicDir = __dirname;
const jsDir = path.join(__dirname, 'js');
const scriptsDir = path.join(__dirname, 'scripts');
const indexFile = path.join(__dirname, 'index.html');

const NGROK_DOMAIN = process.env.NGROK_DOMAIN || 'visually-definite-frog.ngrok-free.app';
const NGROK_RESERVED_DOMAIN_ID = process.env.NGROK_RESERVED_DOMAIN_ID || 'rd_316tC8xtchhzP72B8Hxm02e93Xe';

let activeNgrokListener = null;

async function startNgrokTunnel(port) {
  if (activeNgrokListener) {
    return activeNgrokListener;
  }

  if (!NGROK_DOMAIN) {
    console.warn('[ngrok] No domain configured, skipping tunnel start.');
    return null;
  }

  if (!process.env.NGROK_AUTHTOKEN && !process.env.NGROK_AUTHTOKEN_FILE && !process.env.NGROK_CONFIG) {
    console.warn('[ngrok] NGROK_AUTHTOKEN (or NGROK_CONFIG) not provided. Tunnel will not start.');
    return null;
  }

  try {
    const listener = await ngrok.connect({
      authtoken_from_env: true,
      addr: port,
      domain: NGROK_DOMAIN,
      metadata: NGROK_RESERVED_DOMAIN_ID ? `reserved_domain_id=${NGROK_RESERVED_DOMAIN_ID}` : undefined
    });

    activeNgrokListener = listener;
    const url = listener.url();
    console.log(`[ngrok] Tunnel established at ${url}`);
    console.log(`[ngrok] Reserved domain: https://${NGROK_DOMAIN}`);
    process.env.CROSSLINE_API_URL = `https://${NGROK_DOMAIN}`;
    process.env.CROSSLINE_WS_URL = `wss://${NGROK_DOMAIN}`;
    return listener;
  } catch (error) {
    console.error('[ngrok] Failed to start tunnel:', error.message || error);
    return null;
  }
}

async function stopNgrokTunnel() {
  if (!activeNgrokListener) return;
  try {
    await activeNgrokListener.close();
  } catch (error) {
    console.error('[ngrok] Failed to close tunnel:', error.message || error);
  } finally {
    activeNgrokListener = null;
  }
}

const ALLOWED_ORIGINS = (process.env.CROSSLINE_CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function resolveCorsOrigin(req) {
  if (ALLOWED_ORIGINS.length === 0) {
    return '*';
  }
  const origin = req.headers.origin;
  if (!origin) {
    return null;
  }
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

function requestHandler(req, res) {
  let rawPath;
  try {
    rawPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (rawPath.includes('..')) {
    res.writeHead(400);
    return res.end('Bad request');
  }
  const corsOrigin = resolveCorsOrigin(req);
  if (req.method === 'OPTIONS') {
    if (ALLOWED_ORIGINS.length && !corsOrigin) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Forbidden');
    }
    res.writeHead(204, {
      'Access-Control-Allow-Origin': corsOrigin || '*',
      'Access-Control-Allow-Methods': 'GET,HEAD,OPTIONS',
      'Access-Control-Allow-Headers': req.headers['access-control-request-headers'] || 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }
  if (ALLOWED_ORIGINS.length && !corsOrigin && req.headers.origin) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }
  const urlPath = new URL(rawPath, `http://${req.headers.host}`).pathname;
  let filePath;
  if (urlPath === '/' || urlPath === '/index.html') {
    filePath = indexFile;
  } else if (urlPath.startsWith('/js/')) {
    filePath = path.join(jsDir, urlPath.slice(4));
  } else if (urlPath.startsWith('/scripts/')) {
    filePath = path.join(scriptsDir, urlPath.slice(9));
  } else {
    filePath = path.resolve(publicDir, '.' + urlPath);
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': corsOrigin || '*'
      });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const types = {
      '.js': 'text/javascript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
      '.json': 'application/json'
    };
    res.writeHead(200, {
      'Content-Type': types[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': corsOrigin || '*'
    });
    res.end(data);
  });
}

const rooms = {};
const ROOM_TIMEOUT_MS = 300000; // 5 minutes

const primaryServers = new WeakMap();
const signalServers = new WeakMap();
const upgradeHandlers = new WeakMap();

function ensureUpgradeHandler(server) {
  if (upgradeHandlers.has(server)) return;
  const handler = (req, socket, head) => {
    let pathname = '/';
    try {
      pathname = new URL(req.url, 'http://localhost').pathname;
    } catch (err) {}

    if (pathname === '/p2p' && signalServers.has(server)) {
      const target = signalServers.get(server);
      target.handleUpgrade(req, socket, head, ws => {
        target.emit('connection', ws, req);
      });
      return;
    }

    if (primaryServers.has(server)) {
      const target = primaryServers.get(server);
      target.handleUpgrade(req, socket, head, ws => {
        target.emit('connection', ws, req);
      });
      return;
    }

    socket.destroy();
  };
  server.on('upgrade', handler);
  upgradeHandlers.set(server, handler);
}

function removeFromRoom(ws) {
  const roomId = ws.roomId;
  if (!roomId) return;
  const room = rooms[roomId];
  if (!room) {
    ws.roomId = undefined;
    ws.playerIndex = undefined;
    return;
  }
  room.players = room.players.filter(p => p !== ws);
  room.players.forEach(p => p.send(JSON.stringify({ type: 'opponent_left' })));
  if (room.players.length === 0) {
    if (room.expireTimer) clearTimeout(room.expireTimer);
    delete rooms[roomId];
  } else {
    room.pendingMoves = { 0: null, 1: null };
    room.confirmed = { 0: false, 1: false };
    if (room.expireTimer) clearTimeout(room.expireTimer);
    room.expireTimer = setTimeout(() => {
      const r = rooms[roomId];
      if (r && r.players.length === 1) {
        const p = r.players[0];
        if (p.readyState === WebSocket.OPEN) {
          p.send(JSON.stringify({ type: 'room_expired' }));
        }
        delete rooms[roomId];
      }
    }, ROOM_TIMEOUT_MS);
  }
  ws.roomId = undefined;
  ws.playerIndex = undefined;
}

const VALID_DIRS = ['up', 'down', 'left', 'right'];
function isValidMove(move) {
  if (typeof move === 'string') {
    return VALID_DIRS.includes(move) || move === 'shield';
  }
  if (
    move &&
    typeof move === 'object' &&
    move.type === 'attack' &&
    Array.isArray(move.dirs)
  ) {
    return move.dirs.every(d => VALID_DIRS.includes(d));
  }
  return false;
}

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const PING_INTERVAL_MS = 10000;
const PING_TIMEOUT_MS = 30000;

function attachWebSocketServer(server) {
  if (primaryServers.has(server)) {
    return primaryServers.get(server);
  }

  ensureUpgradeHandler(server);

  const wss = new WebSocket.Server({ noServer: true, perMessageDeflate: false });
  wss.rooms = rooms;

  primaryServers.set(server, wss);

  wss.pingInterval = setInterval(() => {
    wss.clients.forEach(client => {
      if (client.readyState !== WebSocket.OPEN) return;
      if (Date.now() - client.lastPong > PING_TIMEOUT_MS) {
        removeFromRoom(client);
        return client.terminate();
      }
      try { client.ping(); } catch (e) {}
    });
  }, PING_INTERVAL_MS);

  wss.on('connection', ws => {
    ws.lastPong = Date.now();
    ws.on('pong', () => {
      ws.lastPong = Date.now();
    });

    ws.on('message', msg => {
      let data;
      try { data = JSON.parse(msg); } catch (e) { return; }
      if (data.type === 'create') {
        removeFromRoom(ws);
        let code;
        do { code = genCode(); } while (rooms[code]);
        rooms[code] = {
          players: [ws],
          states: [null, null],
          pendingMoves: { 0: null, 1: null },
          confirmed: { 0: false, 1: false },
          expireTimer: null
        };
        ws.roomId = code;
        ws.playerIndex = 0;
        ws.send(JSON.stringify({ type: 'room_created', roomId: code }));
      } else if (data.type === 'join') {
        removeFromRoom(ws);
        const room = rooms[data.roomId];
        if (!room || room.players.length >= 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Room unavailable' }));
          return;
        }
        room.players.push(ws);
        if (room.expireTimer) { clearTimeout(room.expireTimer); room.expireTimer = null; }
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
      } else if (data.type === 'submit_moves') {
        const room = rooms[ws.roomId];
        if (!room) return;
        if (room.players.length < 2) {
          ws.send(JSON.stringify({ type: 'error', message: 'Waiting for opponent' }));
          return;
        }
        if (room.confirmed[ws.playerIndex]) {
          ws.send(JSON.stringify({ type: 'error', message: 'Moves already confirmed' }));
          return;
        }
        if (!Array.isArray(data.moves) || data.moves.length !== 5) {
          ws.send(JSON.stringify({ type: 'error', message: 'Must send exactly 5 moves' }));
          console.log(`Player ${ws.playerIndex} sent invalid moves in room ${ws.roomId}`);
          return;
        }
        if (!data.moves.every(isValidMove)) {
          ws.send(JSON.stringify({ type: 'error' }));
          console.log(`Player ${ws.playerIndex} sent malformed moves in room ${ws.roomId}`);
          return;
        }
        console.log(
          `Received moves from player ${ws.playerIndex} in room ${ws.roomId}:`,
          data.moves
        );
        room.pendingMoves[ws.playerIndex] = data.moves.slice(0, 5);
        room.confirmed[ws.playerIndex] = true;
        room.players.forEach(p =>
          p.send(JSON.stringify({ type: 'player_confirmed', playerIndex: ws.playerIndex }))
        );
        if (
          Array.isArray(room.pendingMoves[0]) && room.pendingMoves[0].length === 5 &&
          Array.isArray(room.pendingMoves[1]) && room.pendingMoves[1].length === 5
        ) {
          console.log(
            `Starting round in room ${ws.roomId}. Player 0 moves: ${JSON.stringify(
              room.pendingMoves[0]
            )}, Player 1 moves: ${JSON.stringify(room.pendingMoves[1])}`
          );
          const payload = [
            room.pendingMoves[0].slice(0, 5),
            room.pendingMoves[1].slice(0, 5)
          ];
          room.players.forEach(p => {
            if (p.readyState === WebSocket.OPEN) {
              p.send(JSON.stringify({ type: 'start_round', moves: payload }));
            }
          });
          room.pendingMoves = { 0: null, 1: null };
          room.confirmed = { 0: false, 1: false };
        } else {
          console.log(
            `Room ${ws.roomId} waiting for moves: P0 ${Array.isArray(room.pendingMoves[0]) ? room.pendingMoves[0].length : 'none'}, P1 ${Array.isArray(room.pendingMoves[1]) ? room.pendingMoves[1].length : 'none'}`
          );
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
      removeFromRoom(ws);
    });
  });

  return wss;
}

// Simple WebRTC signaling server used for P2P mode
const signalRooms = {};
function attachSignalServer(server) {
  if (signalServers.has(server)) {
    return signalServers.get(server);
  }

  ensureUpgradeHandler(server);

  const wss = new WebSocket.Server({ noServer: true, perMessageDeflate: false });
  signalServers.set(server, wss);

  wss.on('connection', ws => {
    ws.on('message', msg => {
      let data;
      try { data = JSON.parse(msg); } catch (e) { return; }
      if (data.type === 'join') {
        ws.room = data.room;
        if (!signalRooms[ws.room]) signalRooms[ws.room] = [];
        if (!signalRooms[ws.room].includes(ws)) signalRooms[ws.room].push(ws);
      } else if (data.type === 'signal') {
        const peers = signalRooms[data.room] || [];
        peers.forEach(p => {
          if (p !== ws && p.readyState === WebSocket.OPEN) {
            p.send(JSON.stringify({ type: 'signal', payload: data.payload }));
          }
        });
      }
    });
    ws.on('close', () => {
      const room = ws.room;
      if (room && signalRooms[room]) {
        signalRooms[room] = signalRooms[room].filter(p => p !== ws);
        if (signalRooms[room].length === 0) delete signalRooms[room];
      }
    });
  });

  return wss;
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const server = http.createServer(requestHandler);
  attachWebSocketServer(server);
  attachSignalServer(server);
  server.on('close', () => {
    stopNgrokTunnel();
  });

  const handleShutdown = async signal => {
    console.log(`\nReceived ${signal}, shutting down...`);
    await stopNgrokTunnel();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000);
  };

  process.once('SIGINT', () => handleShutdown('SIGINT'));
  process.once('SIGTERM', () => handleShutdown('SIGTERM'));

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    startNgrokTunnel(port).catch(err => {
      console.error('[ngrok] Unexpected error while starting tunnel:', err);
    });
  });
}

module.exports = {
  isValidMove,
  attachWebSocketServer,
  attachSignalServer,
  requestHandler
};
