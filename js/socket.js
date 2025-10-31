let socket;
let handleClose;
let handleMessage;
let isConnected = false;
let startRoundTimer = null;
let lastRoomId = null;
let wasCreator = false;
let intentionalClose = false;
let connectionWatchdog = null;
let pendingRoomActionTimer = null;
let pendingRoomAction = null;
let reconnectAttempts = 0;
let reconnectTimer = null;

const CONNECT_TIMEOUT_MS = 10000;
const ROOM_ACTION_TIMEOUT_MS = 8000;
const ROOM_CODE_PATTERN = /^[A-Z0-9]{4}$/;
const RECONNECT_BASE_DELAY_MS = 2000;
const RECONNECT_BACKOFF_FACTOR = 1.5;
const RECONNECT_MAX_DELAY_MS = 20000;
const TOAST_LIFETIME = 4200;
const CONNECTIVITY_INTERVAL_MS = 3000;
const CONNECTIVITY_TIMEOUT_MS = 2500;

const runtimeConfig = typeof window !== 'undefined' ? (window.__CROSSLINE_RUNTIME__ || {}) : {};
const API_ORIGIN = (() => {
  if (typeof window === 'undefined') return null;
  if (runtimeConfig.apiOrigin) return runtimeConfig.apiOrigin;
  if (window.CROSSLINE_API_URL) return window.CROSSLINE_API_URL;
  if (window.location && window.location.origin) return window.location.origin;
  return null;
})();

let connectivityTimer = null;
let connectivityHasInitialResult = false;

const roomDisplay = typeof document !== 'undefined' ? document.getElementById('roomDisplay') : null;
const copyRoomCodeBtn = typeof document !== 'undefined' ? document.getElementById('copyRoomCode') : null;
const onlineToasts = typeof document !== 'undefined' ? document.getElementById('onlineToasts') : null;
// Connect to the dedicated WebSocket server by default. The URL can be
// overridden by setting `window.WS_SERVER_URL` before this script runs or by
// providing a `ws` query parameter in the page URL.
const NGROK_SUFFIXES = ['.ngrok.app', '.ngrok-free.app'];

function addNgrokBypassParam(url) {
  if (!url) return url;
  try {
    const base = typeof window !== 'undefined' && window.location ? window.location.href : 'http://localhost';
    const parsed = new URL(url, base);
    if (NGROK_SUFFIXES.some(suffix => parsed.hostname.endsWith(suffix))) {
      parsed.searchParams.set('ngrok-skip-browser-warning', '1');
      return parsed.toString();
    }
  } catch (err) {
    console.warn('[socket] Failed to normalise WebSocket URL:', err);
  }
  return url;
}

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

WS_SERVER_URL = addNgrokBypassParam(WS_SERVER_URL);

function updateConnectionStatus(text, state) {
  const el = document.getElementById('connectionStatus');
  if (!el) return;
  const textSpan = el.querySelector('.status-text');
  if (textSpan) textSpan.textContent = text;
  if (state) {
    el.dataset.state = state;
  } else {
    delete el.dataset.state;
  }
}

function showOnlineToast(type, message) {
  if (!onlineToasts || !message) return;
  const toast = document.createElement('div');
  toast.className = `online-toast ${type || 'info'}`;
  toast.style.transition = 'opacity .25s ease, transform .25s ease';
  const iconSpan = document.createElement('span');
  iconSpan.className = 'toast-icon';
  iconSpan.textContent = ({ success: '✨', error: '⚠️', info: 'ℹ️' })[type] || 'ℹ️';
  const textSpan = document.createElement('span');
  textSpan.className = 'toast-text';
  textSpan.textContent = message;
  toast.append(iconSpan, textSpan);
  onlineToasts.append(toast);
  setTimeout(() => {
    toast.classList.add('dismiss');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, TOAST_LIFETIME);
  while (onlineToasts.childNodes.length > 4) {
    onlineToasts.removeChild(onlineToasts.firstChild);
  }
}

function scheduleConnectivityPoll() {
  connectivityHasInitialResult = false;
  if (connectivityTimer) clearTimeout(connectivityTimer);
  if (typeof fetch !== 'function' || !API_ORIGIN) return;
  const poll = async () => {
    const statusEl = document.getElementById('connectionStatus');
    const currentState = statusEl ? statusEl.dataset.state : null;
    if (
      !connectivityHasInitialResult &&
      statusEl &&
      (!socket || socket.readyState !== WebSocket.OPEN) &&
      currentState !== 'connecting' &&
      currentState !== 'reconnecting'
    ) {
      updateConnectionStatus(t('checkingConnection'), 'checking');
    }
    try {
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), CONNECTIVITY_TIMEOUT_MS) : null;
      await fetch(API_ORIGIN, { method: 'HEAD', cache: 'no-store', signal: controller ? controller.signal : undefined });
      if (timeoutId) clearTimeout(timeoutId);
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        updateConnectionStatus(t('onlineStatus'), 'online');
      }
      connectivityHasInitialResult = true;
    } catch (err) {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        updateConnectionStatus(t('serverUnavailable'), 'offline');
      }
      connectivityHasInitialResult = true;
    } finally {
      connectivityTimer = setTimeout(poll, CONNECTIVITY_INTERVAL_MS);
    }
  };
  poll();
}

function setRoomCodeDisplay(code) {
  const codeEl = document.getElementById('roomCode');
  if (codeEl) {
    codeEl.textContent = code ? code : '----';
  }
  if (roomDisplay) {
    roomDisplay.classList.toggle('empty', !code);
  }
  if (copyRoomCodeBtn) {
    copyRoomCodeBtn.disabled = !code;
  }
}

function resetRoomState() {
  lastRoomId = null;
  wasCreator = false;
}

function clearRoomUI() {
  setRoomCodeDisplay(null);
  const btn = document.getElementById('btn-next');
  if (btn) btn.disabled = true;
}

function clearPendingRoomAction(action) {
  if (pendingRoomAction && (!action || action === pendingRoomAction)) {
    clearTimeout(pendingRoomActionTimer);
    pendingRoomActionTimer = null;
    pendingRoomAction = null;
  }
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function resetReconnectBackoff() {
  reconnectAttempts = 0;
  clearReconnectTimer();
}

function startRoomActionWatch(action) {
  clearPendingRoomAction();
  pendingRoomAction = action;
  pendingRoomActionTimer = setTimeout(() => {
    pendingRoomActionTimer = null;
    const key = action === 'join' ? 'roomJoinTimeout' : 'roomCreateTimeout';
    log('⛔ ' + t(key));
  }, ROOM_ACTION_TIMEOUT_MS);
}

function cleanupRoom() {
  if (startRoundTimer) {
    clearTimeout(startRoundTimer);
    startRoundTimer = null;
  }
  clearPendingRoomAction();
  resetReconnectBackoff();
  if (socket) {
    socket.removeEventListener('close', handleClose);
    socket.removeEventListener('message', handleMessage);
    intentionalClose = true;
    socket.close();
    socket = null; // ensure old connection isn't reused
  }
  isConnected = false;
  if (connectionWatchdog) {
    clearTimeout(connectionWatchdog);
    connectionWatchdog = null;
  }
  updateConnectionStatus(t('offline'), 'offline');
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
  clearReconnectTimer();
  socket = new WebSocket(addNgrokBypassParam(WS_SERVER_URL));
  updateConnectionStatus(t('connecting'), 'connecting');
  if (connectionWatchdog) clearTimeout(connectionWatchdog);
  connectionWatchdog = setTimeout(() => {
    connectionWatchdog = null;
    if (!socket || socket.readyState === WebSocket.OPEN) return;
    log('⛔ ' + t('serverUnavailable'));
    updateConnectionStatus(t('serverUnavailable'), 'offline');
    showOnlineToast('error', t('serverUnavailable'));
    try {
      socket.close();
    } catch (err) {}
  }, CONNECT_TIMEOUT_MS);
  socket.addEventListener('open', () => {
    isConnected = true;
    resetReconnectBackoff();
    if (connectionWatchdog) {
      clearTimeout(connectionWatchdog);
      connectionWatchdog = null;
    }
    log('✅ ' + t('onlineStatus')); // connection established
    showOnlineToast('success', t('connectedToast'));
    if (typeof socket.pong === 'function') {
      socket.addEventListener('ping', () => {
        try { socket.pong(); } catch (e) {}
      });
    }
    if (!onReady && (wasCreator || lastRoomId)) {
      updateConnectionStatus(t('rejoin'), 'online');
      const msg = wasCreator ? { type: 'create' } : { type: 'join', roomId: lastRoomId };
      startRoomActionWatch(wasCreator ? 'create' : 'join');
      socket.send(JSON.stringify(msg));
    } else {
      updateConnectionStatus(t('onlineStatus'), 'online');
    }
    if (onReady) onReady();
  });
  socket.addEventListener('error', () => {
    if (connectionWatchdog) {
      clearTimeout(connectionWatchdog);
      connectionWatchdog = null;
    }
    if (!isConnected) {
      log('⛔ ' + t('serverUnavailable'));
      updateConnectionStatus(t('serverUnavailable'), 'offline');
      showOnlineToast('error', t('serverUnavailable'));
    }
  });
  handleClose = function handleClose(event) {
    if (event.target !== socket) return;  // ignore old sockets
    isConnected = false;
    log('⚠ ' + t('connection_lost'));
    showOnlineToast('error', t('connection_lost'));
    if (connectionWatchdog) {
      clearTimeout(connectionWatchdog);
      connectionWatchdog = null;
    }
    clearPendingRoomAction();
    if (intentionalClose) {
      intentionalClose = false;
      updateConnectionStatus(t('offline'), 'offline');
      return;
    }
    updateConnectionStatus(t('reconnecting'), 'reconnecting');
    clearReconnectTimer();
    const attempt = Math.min(reconnectAttempts + 1, 20);
    reconnectAttempts = attempt;
    const delay = Math.min(
      RECONNECT_BASE_DELAY_MS * Math.pow(RECONNECT_BACKOFF_FACTOR, attempt - 1),
      RECONNECT_MAX_DELAY_MS
    );
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        initSocket();
      }
    }, delay);
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
      setRoomCodeDisplay(data.roomId);
      lastRoomId = data.roomId;
      clearPendingRoomAction('create');
      showOnlineToast('success', t('roomCreatedToast', { code: data.roomId }));
    }
    if (data.type === 'start_game') {
      clearPendingRoomAction('join');
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
    if (data.type === 'error') {
      clearPendingRoomAction();
      let messageKey = null;
      if (data.message === 'Room unavailable') messageKey = 'roomNotFound';
      else if (data.message === 'Waiting for opponent') messageKey = 'waitingForOpponent';
      else if (data.message === 'Moves already confirmed') messageKey = 'movesAlreadyConfirmed';
      else if (data.message === 'Must send exactly 5 moves') messageKey = 'mustSendFiveMoves';
      const msg = messageKey ? t(messageKey) : data.message;
      log('⚠ ' + msg);
      showOnlineToast('error', msg);
    }
    if (data.type === 'state_ok') log('✔ ' + t('state_ok'));
    if (data.type === 'state_mismatch') log('❌ ' + t('state_mismatch'));
    if (data.type === 'opponent_left') {
      const msg = t('opponent_left_room');
      log('⚠ ' + msg);
      showOnlineToast('error', msg);
      cleanupRoom();
      showOpponentLeftModal();
    }
    if (data.type === 'room_expired') {
      const msg = t('room_closed_inactivity');
      log('⌛ ' + msg);
      showOnlineToast('error', msg);
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
    if (socket && socket.readyState === WebSocket.OPEN) {
      startRoomActionWatch('create');
      socket.send(JSON.stringify({ type: 'create' }));
    }
  });
}

function joinRoom(roomId) {
  const input = document.getElementById('roomInput');
  const normalized = (roomId || '').toUpperCase();
  if (!ROOM_CODE_PATTERN.test(normalized)) {
    log('⚠ ' + t('invalidRoomCode'));
    showOnlineToast('error', t('invalidRoomCode'));
    if (input) input.classList.add('input-error');
    return;
  }
  if (input) {
    input.value = normalized;
    input.classList.remove('input-error');
  }
  cleanupRoom();
  wasCreator = false;
  lastRoomId = normalized;
  initSocket(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      startRoomActionWatch('join');
      socket.send(JSON.stringify({ type: 'join', roomId: normalized }));
    }
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
  if (!text) return;
  try {
    console.log('[online]', text);
  } catch (err) {
    /* ignore console errors */
  }
}

function showConfirmMessage(text) {
  const root = document.documentElement;
  const scoreboard = document.getElementById('scoreboard');
  const messageEl = document.getElementById('scoreboardMessage');
  if (scoreboard && messageEl) {
    const shell = scoreboard.querySelector('.scoreboard-shell');
    const settingsBtn = document.getElementById('settingsBtn');
    if (typeof window.closeHudMenu === 'function') {
      try {
        window.closeHudMenu();
      } catch (err) {
        /* ignore close errors */
      }
    }
    messageEl.textContent = text;
    messageEl.setAttribute('aria-hidden', 'false');
    scoreboard.classList.add('showing-message');
    scoreboard.setAttribute('aria-busy', 'true');
    if (shell) shell.setAttribute('aria-hidden', 'true');
    if (settingsBtn) settingsBtn.setAttribute('aria-hidden', 'true');
    clearTimeout(messageEl._hideTimer);
    messageEl._hideTimer = setTimeout(() => {
      scoreboard.classList.remove('showing-message');
      scoreboard.removeAttribute('aria-busy');
      messageEl.setAttribute('aria-hidden', 'true');
      if (shell) shell.removeAttribute('aria-hidden');
      if (settingsBtn) settingsBtn.removeAttribute('aria-hidden');
      messageEl._hideTimer = null;
    }, 2400);
    if (root) root.style.setProperty('--toast-offset', '0px');
    return;
  }

  const el = document.getElementById('confirmToast');
  if (!el) return;
  el.textContent = text;
  el.classList.add('show');
  if (root) root.style.setProperty('--toast-offset', '0px');
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
  updateConnectionStatus(t('offline'), 'offline');
  resetRoomState();
  setRoomCodeDisplay(null);
  scheduleConnectivityPoll();
  if (copyRoomCodeBtn) {
    copyRoomCodeBtn.disabled = true;
    copyRoomCodeBtn.addEventListener('click', async () => {
      const code = (document.getElementById('roomCode')?.textContent || '').trim();
      if (!code || code === '----') {
        return;
      }
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(code);
        } else {
          const tmp = document.createElement('textarea');
          tmp.value = code;
          tmp.setAttribute('readonly', '');
          tmp.style.position = 'absolute';
          tmp.style.opacity = '0';
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          document.body.removeChild(tmp);
        }
        showOnlineToast('success', t('copySuccess'));
      } catch (err) {
        console.warn('Copy failed', err);
        showOnlineToast('error', t('copyFail'));
      }
    });
  }
});

window.resetRoomState = resetRoomState;
window.cleanupRoom = cleanupRoom;
// Placeholder removed to allow main game script to define handlers
