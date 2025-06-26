# 5x5 Arena

A simple WebSocket-based 5×5 PvP game.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the server (choose either command):

   ```bash
   npm start
   # or
   node server.js
   ```

   The game will be served on [https://boom-poised-sawfish.glitch.me](https://boom-poised-sawfish.glitch.me).

### Running tests

After installing dependencies with `npm install`, the test suite can be run using:

```bash
npm test
```

## Troubleshooting

After you press the **Подтвердить** button your moves are sent to the server. The client waits for the `start_round` message to continue. If this message does not arrive within about 10 seconds you will see the error:

```
сервер не начал раунд, перепроверьте соединение
```

The confirm button becomes active again so you can resend the moves. This usually means that the connection to the server was interrupted.

If the page manages to reconnect, you will see **«Переподключено, повторный вход…»** and the client will automatically recreate or rejoin the last room.

When your opponent leaves the room you will now see a popup with options to return to the online menu or immediately create a new room. Leaving the online menu (including via the **В меню** button) calls `exitOnlineMode()` which sets the game back to offline mode, resets the room state with `resetRoomState()` and shows the main screen.
