let socket;
let isConnected = false;

function initSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) return;
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(proto + '//' + location.host);
  socket.onopen = () => {
    isConnected = true;
    log('✅ Соединение установлено');
  };
  socket.onmessage = (event) => {
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
  };
}

function createRoom() {
  if (!isConnected) {
    log('⛔ WebSocket ещё не подключён');
    return;
  }
  if (!socket) initSocket();
  socket.send(JSON.stringify({ type: 'create' }));
}

function joinRoom(roomId) {
  if (!isConnected) {
    log('⛔ WebSocket ещё не подключён');
    return;
  }
  if (!socket) initSocket();
  socket.send(JSON.stringify({ type: 'join', roomId }));
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
