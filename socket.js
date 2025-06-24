const socket = new WebSocket("wss://boom-poised-sawfish.glitch.me");

socket.onopen = () => {
  log("✅ Соединение установлено");
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  log("📨 Получено: " + JSON.stringify(data));

  if (data.type === "room_created") {
    const el = document.getElementById("roomCode");
    if (el) el.innerText = `Комната: ${data.roomId}`;
  }

  if (data.type === "start_game") {
    playerIndex = data.playerIndex;
    log("🎮 Игра началась. Вы игрок " + playerIndex);
    yourTurn = playerIndex === 0;
  }

  if (data.type === "opponent_move") {
    handleOpponentMove(data.move);
  }
};

function createRoom() {
  socket.send(JSON.stringify({ type: "create" }));
}

function joinRoom(roomId) {
  socket.send(JSON.stringify({ type: "join", roomId }));
}

function sendMove(move) {
  socket.send(JSON.stringify({ type: "move", move }));
}

function log(text) {
  const el = document.getElementById("log");
  if (el) el.innerHTML += text + "<br>";
}
