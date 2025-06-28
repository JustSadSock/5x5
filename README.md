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


   The game will be served on [https://zippy-scintillating-asp.glitch.me](https://zippy-scintillating-asp.glitch.me).

### Configuring the WebSocket server

The client connects to the hosted WebSocket server above by default. For local
development you can point the client at your own server in two ways:

1. Define `WS_SERVER_URL` before including `js/socket.js`:

   ```html
   <script>window.WS_SERVER_URL = 'ws://localhost:8080';</script>
   <script src="js/socket.js"></script>
   ```

2. Pass a `ws` query parameter when opening the page:

   `http://localhost:8080/?ws=ws://localhost:8080`

### Running tests

After running `npm install`, Playwright's browsers are automatically installed
via the `postinstall` script. Once dependencies are installed, the test suite
can be run using:

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

When your opponent leaves the room you will now see a popup with options to return to the online menu or immediately create a new room. Leaving the online menu (including via the **В меню** button) calls `exitOnlineMode()` which sets the game back to offline mode, resets the room state with `resetRoomState()` and shows the main screen. Exiting the online screen or reloading the page also clears `isOnline` and `playerIndex`.

## Replays and video export

After a match a **Replay** button appears on the scoreboard. Clicking it opens a
full-screen overlay where you can watch the recorded round. The pause button and
seek bar let you step through each action, while the numbered buttons adjust the
playback speed from 1× to 5×. To keep a copy of the match press **Save** and the
browser will export the replay as a WebM video. Use **Close** to return to the
game.
