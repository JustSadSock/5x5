let socket;

function initSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) return;
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(protocol + '//' + location.host);
  socket.onopen = () => log('✅ Соединение установлено');
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
    if (data.type === 'state_ok') log('✔ Ходы совпадают');
    if (data.type === 'state_mismatch') log('❌ Несовпадение состояний');
    if (data.type === 'opponent_left') log('⚠ Оппонент покинул игру');
  };
}

function createRoom() {
  if (!socket) initSocket();
  socket.send(JSON.stringify({ type: 'create' }));
}

function joinRoom(roomId) {
  if (!socket) initSocket();
  socket.send(JSON.stringify({ type: 'join', roomId }));
}

function sendMove(move) {
  if (socket && socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ type: 'move', move }));
}

function sendState(state) {
  if (socket && socket.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({ type: 'state', state }));
}

function log(text) {
  const el = document.getElementById('log');
  if (el) el.innerHTML += text + '<br>';
}
