let socket;
let handleClose;
let handleMessage;
let isConnected = false;
let startRoundTimer = null;
let lastRoomId = null;
let wasCreator = false;
let intentionalClose = false;
// Connect to the dedicated WebSocket server by default. The URL can be
// overridden by setting `window.WS_SERVER_URL` before this script runs or by
// providing a `ws` query parameter in the page URL.
let WS_SERVER_URL = 'ws://localhost:3000';
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const runtime = window.__CROSSLINE_RUNTIME__ || window.__CROSSLINE_CONFIG__;
  if (params.get('ws')) {
    WS_SERVER_URL = params.get('ws');
  } else if (runtime && runtime.wsUrl) {
    WS_SERVER_URL = runtime.wsUrl;
  } else if (window.WS_SERVER_URL) {
    WS_SERVER_URL = window.WS_SERVER_URL;
  } else if (runtime && runtime.apiOrigin) {
    const origin = runtime.apiOrigin.replace(/\/$/, '');
    WS_SERVER_URL = origin.replace(/^http/i, 'ws');
  } else if (window.location && window.location.origin) {
    const isSecure = window.location.protocol === 'https:';
    WS_SERVER_URL = `${isSecure ? 'wss' : 'ws'}://${window.location.host}`;
  }
}

function updateConnectionStatus(text, color) {
  const el = document.getElementById('connectionStatus');
  if (el) {
    el.textContent = text;
    if (color) el.style.color = color;
  }
}

function resetRoomState() {
  lastRoomId = null;
  wasCreator = false;
}

function clearRoomUI() {
  const codeEl = document.getElementById('roomCode');
  if (codeEl) codeEl.innerText = '';
  const logEl = document.getElementById('log');
  if (logEl) logEl.innerHTML = '';
  const btn = document.getElementById('btn-next');
  if (btn) btn.disabled = true;
}

function cleanupRoom() {
  if (startRoundTimer) {
    clearTimeout(startRoundTimer);
    startRoundTimer = null;
  }
  if (socket) {
    socket.removeEventListener('close', handleClose);
    socket.removeEventListener('message', handleMessage);
    intentionalClose = true;
    socket.close();
    socket = null; // ensure old connection isn't reused
  }
  isConnected = false;
  updateConnectionStatus(t('offline'), 'orange');
  resetRoomState();
  clearRoomUI();
  if (typeof window.onOnlineDisconnected === 'function') {
    window.onOnlineDisconnected();
  }
  if (typeof window.exitOnlineMode === 'function') window.exitOnlineMode();
}

function initSocket(onReady) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    if (onReady) onReady();
    return;
  }
  if (socket && socket.readyState === WebSocket.CONNECTING) {
    if (onReady) socket.addEventListener('open', onReady, { once: true });
    return;
  }
  socket = new WebSocket(WS_SERVER_URL);
  updateConnectionStatus(t('connecting'), 'yellow');
  socket.addEventListener('open', () => {
    isConnected = true;
    log('✅ ' + t('onlineStatus')); // connection established
    if (typeof socket.pong === 'function') {
      socket.addEventListener('ping', () => {
        try { socket.pong(); } catch (e) {}
      });
    }
    if (!onReady && (wasCreator || lastRoomId)) {
      updateConnectionStatus(t('rejoin'), 'lime');
      const msg = wasCreator ? { type: 'create' } : { type: 'join', roomId: lastRoomId };
      socket.send(JSON.stringify(msg));
    } else {
      updateConnectionStatus(t('onlineStatus'), 'lime');
    }
    if (onReady) onReady();
  });
  handleClose = function handleClose(event) {
    if (event.target !== socket) return;  // ignore old sockets
    isConnected = false;
    log('⚠ ' + t('connection_lost'));
    if (intentionalClose) {
      intentionalClose = false;
      updateConnectionStatus(t('offline'), 'orange');
      return;
    }
    updateConnectionStatus(t('reconnecting'), 'orange');
    setTimeout(() => initSocket(), 2000);
  };
  socket.addEventListener('close', handleClose);
  handleMessage = function handleMessage(event) {
    const data = JSON.parse(event.data);
    log('📨 ' + JSON.stringify(data));
    // Also output payloads to the browser console for easier debugging
    console.log('WebSocket payload:', data);
    if (data.type === 'ping') {
      if (typeof socket.pong === 'function') {
        try { socket.pong(); } catch (e) {}
      } else if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'pong' }));
      }
      return;
    }
    if (data.type === 'room_created') {
      const el = document.getElementById('roomCode');
      if (el) el.innerText = `${t('room')}: ${data.roomId}`;
      lastRoomId = data.roomId;
    }
    if (data.type === 'start_game') {
      startOnlineGame(data.playerIndex);
    }
    if (data.type === 'opponent_move') {
      handleOpponentMove(data.move);
    }
    if (data.type === 'player_confirmed') {
      const who = data.playerIndex === 0 ? t('playerA') : t('playerB');
      showConfirmMessage(who + ' ' + t('confirmed'));
      log(who + ' ' + t('confirmed'));
      if (typeof window.onPlayerConfirmed === 'function') {
        window.onPlayerConfirmed(data.playerIndex);
      }
    }
    if (data.type === 'start_round') {
      if (startRoundTimer) {
        clearTimeout(startRoundTimer);
        startRoundTimer = null;
      }
      log(t('both_confirmed'));
      log('▶ ' + t('round_start'));
      // Log moves object to verify contents
      console.log('start_round moves:', data.moves);
      onStartRound(data.moves);
    }
    if (data.type === 'error') log('⚠ ' + data.message);
    if (data.type === 'state_ok') log('✔ ' + t('state_ok'));
    if (data.type === 'state_mismatch') log('❌ ' + t('state_mismatch'));
    if (data.type === 'opponent_left') {
      log('⚠ ' + t('opponent_left_room'));
      cleanupRoom();
      showOpponentLeftModal();
    }
    if (data.type === 'room_expired') {
      log('⌛ ' + t('room_closed_inactivity'));
      cleanupRoom();
    }
  };
  socket.addEventListener('message', handleMessage);
}

function createRoom() {
  cleanupRoom();
  wasCreator = true;
  lastRoomId = null;
  initSocket(() => {
    socket.send(JSON.stringify({ type: 'create' }));
  });
}

function joinRoom(roomId) {
  cleanupRoom();
  wasCreator = false;
  lastRoomId = roomId;
  initSocket(() => {
    socket.send(JSON.stringify({ type: 'join', roomId }));
  });
}


function submitMoves(moves) {
  if (!isConnected) {
    log('⛔ ' + t('ws_not_connected'));
    return;
  }
  if (!Array.isArray(moves) || moves.length !== 5) {
    log('⚠ ' + t('need_five_moves'));
    return;
  }
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'submit_moves', moves }));
      if (typeof window.onMovesSubmitted === 'function') {
        window.onMovesSubmitted();
      }
      if (startRoundTimer) clearTimeout(startRoundTimer);
      startRoundTimer = setTimeout(() => {
        log(t('server_no_round'));
        const btn = document.getElementById('btn-next');
        if (btn) btn.disabled = false;
      }, 10000);
    }
}

function sendState(state) {
  if (socket && socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ type: 'state', state }));
}

function log(text) {
  const el = document.getElementById('log');
  if (el) el.innerHTML += text + '<br>';
}

function showConfirmMessage(text) {
  const el = document.getElementById('confirmToast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(() => {
    el.classList.remove('show');
  }, 2000);
}

function showOpponentLeftModal() {
  const ov = document.createElement('div');
  ov.id = 'leaveOverlay';
  ov.innerHTML =
    `<div>${t('opponent_left_room')}</div>` +
    '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center;">' +
    `<button id="leaveToMenu">${t('toMenu')}</button>` +
    `<button id="leaveCreate">${t('create_new')}</button>` +
    '</div>';
  document.body.append(ov);
  document.getElementById('leaveToMenu').onclick = () => {
    ov.remove();
    cleanupRoom();
    if (typeof window.exitOnlineMode === 'function') window.exitOnlineMode();
    const ms = document.getElementById('modeSelect');
    const onlineMenu = document.getElementById('onlineMenu');
    if (ms) ms.style.display = 'flex';
    if (onlineMenu) onlineMenu.style.display = 'none';
  };
  document.getElementById('leaveCreate').onclick = () => {
    ov.remove();
    cleanupRoom();
    if (typeof window.exitOnlineMode === 'function') window.exitOnlineMode();
    const ms = document.getElementById('modeSelect');
    const onlineMenu = document.getElementById('onlineMenu');
    if (ms) ms.style.display = 'none';
    if (onlineMenu) onlineMenu.style.display = 'flex';
    createRoom();
  };
}

document.addEventListener('DOMContentLoaded', () => {
  updateConnectionStatus(t('offline'), 'orange');
  resetRoomState();
});

window.resetRoomState = resetRoomState;
window.cleanupRoom = cleanupRoom;
// Placeholder removed to allow main game script to define handlers
