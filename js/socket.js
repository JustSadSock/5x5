let socket;
let isConnected = false;
let startRoundTimer = null;
let lastRoomId = null;
let wasCreator = false;
let intentionalClose = false;
// Connect to the dedicated WebSocket server
const WS_SERVER_URL = 'wss://boom-poised-sawfish.glitch.me';

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
  const btn = document.getElementById('confirmBtn');
  if (btn) btn.disabled = true;
}

function cleanupRoom() {
  if (startRoundTimer) {
    clearTimeout(startRoundTimer);
    startRoundTimer = null;
  }
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    intentionalClose = true;
    socket.close();
  }
  resetRoomState();
  clearRoomUI();
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
  updateConnectionStatus('Подключение...', 'yellow');
  socket.addEventListener('open', () => {
    isConnected = true;
    log('✅ Соединение установлено');
    if (!onReady && (wasCreator || lastRoomId)) {
      updateConnectionStatus('Переподключено, повторный вход...', 'lime');
      const msg = wasCreator ? { type: 'create' } : { type: 'join', roomId: lastRoomId };
      socket.send(JSON.stringify(msg));
    } else {
      updateConnectionStatus('Онлайн', 'lime');
    }
    if (onReady) onReady();
  });
  socket.addEventListener('close', () => {
    isConnected = false;
    log('⚠ Соединение прервано');
    if (intentionalClose) {
      intentionalClose = false;
      updateConnectionStatus('Оффлайн', 'orange');
      return;
    }
    updateConnectionStatus('Оффлайн. Переподключение...', 'orange');
    setTimeout(() => initSocket(), 2000);
  });
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    log('📨 Получено: ' + JSON.stringify(data));
    // Also output payloads to the browser console for easier debugging
    console.log('WebSocket payload:', data);
    if (data.type === 'room_created') {
      const el = document.getElementById('roomCode');
      if (el) el.innerText = `Комната: ${data.roomId}`;
      lastRoomId = data.roomId;
    }
    if (data.type === 'start_game') {
      startOnlineGame(data.playerIndex);
    }
    if (data.type === 'opponent_move') {
      handleOpponentMove(data.move);
    }
    if (data.type === 'player_confirmed') {
      const who = data.playerIndex === 0 ? 'Игрок A' : 'Игрок B';
      showConfirmMessage(who + ' подтвердил ходы');
      log(who + ' подтвердил ходы');
    }
    if (data.type === 'start_round') {
      if (startRoundTimer) {
        clearTimeout(startRoundTimer);
        startRoundTimer = null;
      }
      log('Оба игрока подтвердили ходы, начинается просмотр');
      log('▶ Начало раунда');
      // Log moves object to verify contents
      console.log('start_round moves:', data.moves);
      onStartRound(data.moves);
    }
    if (data.type === 'error') log('⚠ ' + data.message);
    if (data.type === 'state_ok') log('✔ Ходы совпадают');
    if (data.type === 'state_mismatch') log('❌ Несовпадение состояний');
    if (data.type === 'opponent_left') {
      log('⚠ Оппонент покинул игру');
      cleanupRoom();
      showOpponentLeftModal();
    }
    if (data.type === 'room_expired') {
      log('⌛ Комната закрыта из-за неактивности');
      cleanupRoom();
    }
  });
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
    log('⛔ WebSocket ещё не подключён');
    return;
  }
  if (!Array.isArray(moves) || moves.length !== 5) {
    log('⚠ Нужно выбрать ровно 5 ходов');
    return;
  }
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: 'submit_moves', moves }));
    if (startRoundTimer) clearTimeout(startRoundTimer);
    startRoundTimer = setTimeout(() => {
      log('сервер не начал раунд, перепроверьте соединение');
      const btn = document.getElementById('confirmBtn');
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
    '<div>Оппонент покинул комнату</div>' +
    '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center;">' +
    '<button id="leaveToMenu">В меню</button>' +
    '<button id="leaveCreate">Создать новую</button>' +
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
  updateConnectionStatus('Оффлайн', 'orange');
  resetRoomState();
});

window.resetRoomState = resetRoomState;
window.cleanupRoom = cleanupRoom;
// Placeholder removed to allow main game script to define handlers
