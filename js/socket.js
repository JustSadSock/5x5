let socket;
let isConnected = false;
const WS_SERVER_URL = 'wss://boom-poised-sawfish.glitch.me';

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
  socket.addEventListener('open', () => {
    isConnected = true;
    log('✅ Соединение установлено');
    if (onReady) onReady();
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
      onStartRound(data.moves);
    }
    if (data.type === 'state_ok') log('✔ Ходы совпадают');
    if (data.type === 'state_mismatch') log('❌ Несовпадение состояний');
    if (data.type === 'opponent_left') log('⚠ Оппонент покинул игру');
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
  if (socket && socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ type: 'submit_moves', moves }));
}

function sendState(state) {
  if (socket && socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ type: 'state', state }));
}

function log(text) {
  const el = document.getElementById('log');
  if (el) el.innerHTML += text + '<br>';
}

// Handlers that main.js should define
function onStartRound() {}
