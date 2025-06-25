let socket;
let isConnected = false;
let startRoundTimer = null;
// Connect to the dedicated WebSocket server
const WS_SERVER_URL = 'wss://boom-poised-sawfish.glitch.me';

function updateConnectionStatus(text, color) {
  const el = document.getElementById('connectionStatus');
  if (el) {
    el.textContent = text;
    if (color) el.style.color = color;
  }
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
    updateConnectionStatus('Онлайн', 'lime');
    if (onReady) onReady();
  });
  socket.addEventListener('close', () => {
    isConnected = false;
    log('⚠ Соединение прервано');
    updateConnectionStatus('Оффлайн. Переподключение...', 'orange');
    setTimeout(() => initSocket(), 2000);
  });
  socket.addEventListener('message', (event) => {
    const data = JSON.parse(event.data);
    log('📨 Получено: ' + JSON.stringify(data));
    if (data.type === 'room_created') {
      const el = document.getElementById('roomCode');
      if (el) el.innerText = `Комната: ${data.roomId}`;
    }
    if (data.type === 'start_game') {
      startOnlineGame(data.playerIndex);
    }
    if (data.type === 'opponent_move') {
      handleOpponentMove(data.move);
    }
    if (data.type === 'start_round') {
      if (startRoundTimer) {
        clearTimeout(startRoundTimer);
        startRoundTimer = null;
      }
      onStartRound(data.moves);
    }
    if (data.type === 'state_ok') log('✔ Ходы совпадают');
    if (data.type === 'state_mismatch') log('❌ Несовпадение состояний');
    if (data.type === 'opponent_left') log('⚠ Оппонент покинул игру');
    if (data.type === 'room_expired') log('⌛ Комната закрыта из-за неактивности');
  });
}

function createRoom() {
  initSocket(() => {
    socket.send(JSON.stringify({ type: 'create' }));
  });
}

function joinRoom(roomId) {
  initSocket(() => {
    socket.send(JSON.stringify({ type: 'join', roomId }));
  });
}

function sendMove(move) {
  if (!isConnected) {
    log('⛔ WebSocket ещё не подключён');
    return;
  }
  if (socket && socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ type: 'move', move }));
}

function submitMoves(moves) {
  if (!isConnected) {
    log('⛔ WebSocket ещё не подключён');
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

document.addEventListener('DOMContentLoaded', () => {
  updateConnectionStatus('Оффлайн', 'orange');
});

// Placeholder removed to allow main game script to define handlers
