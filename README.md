# 5x5 Arena

A turn-based 5×5 PvP arena with a bundled Node.js server, WebSocket matchmaking and optional peer-to-peer signalling.

## Features

- **Unified server** – `server.js` serves the static client, hosts the primary WebSocket backend and exposes a lightweight WebRTC signalling endpoint on the same port.
- **Configurable connectivity** – override WebSocket or signalling endpoints through query parameters or globals such as `window.WS_SERVER_URL` and `window.SIGNAL_SERVER_URL`.
- **Manual status checks** – the online lobby shows the current connection state and provides a dedicated **Check connection** button so you can refresh the status on demand without background polling.
- **Replay tools** – every finished round can be replayed inside the browser and exported as a WebM video for sharing.
- **Automated tests** – Playwright-driven integration tests exercise the lobby, server and replay flows via the Node.js test runner.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the bundled HTTP/WebSocket server:

   ```bash
   npm start
   # or
   node server.js
   ```

   The game client becomes available at [http://localhost:3000](http://localhost:3000). The WebSocket endpoint defaults to `ws://localhost:3000` unless overridden.

### Runtime configuration

You can point the client at a different backend without rebuilding:

- Define `window.WS_SERVER_URL` before loading `js/socket.js` or pass a `?ws=` query parameter to change the primary WebSocket URL.
- Define `window.SIGNAL_SERVER_URL` or pass a `?signal=` query parameter to override the WebRTC signalling server used for peer-to-peer duels.
- Provide `window.__CROSSLINE_RUNTIME__` with `wsUrl` / `signalUrl` / `apiOrigin` fields for full runtime control (used by the bundled server when an ngrok tunnel is active).

### Server configuration

Environment variables control the local server:

- `PORT` – HTTP and WebSocket listening port (defaults to `3000`).
- `NGROK_DOMAIN` – if set, the server will attempt to start an ngrok tunnel for external access using this reserved domain.
- `NGROK_COMMAND` / `NGROK_EXE` – optional explicit path to the ngrok executable.
- `CROSSLINE_CORS_ORIGIN` – comma-separated list of allowed origins for HTTP requests.
- `CROSSLINE_API_URL` / `CROSSLINE_WS_URL` – override the URLs announced to the client when the server runs behind a reverse proxy or tunnel.

## Online lobby experience

- The connection banner now stays idle until you click **Check connection** – no periodic pings are sent in the background.
- When the WebSocket connects or disconnects the banner updates automatically, and you can always trigger a manual refresh if the status looks stale.
- Copy/paste helpers around the room code streamline inviting friends to a duel.

## Running tests

After installing dependencies the `postinstall` script fetches Playwright browsers. Run the full test suite with:

```bash
npm test
```

## Troubleshooting

- After pressing **Подтвердить**, the client waits for a `start_round` message. If it never arrives you will see `сервер не начал раунд, перепроверьте соединение` and can resend your plan.
- Leaving the online menu resets the multiplayer state: `exitOnlineMode()` switches the UI back to offline mode, clears `isOnline`, `playerIndex` and room data.
- When an opponent disconnects a modal appears with quick actions to return to the menu or instantly create a new room.

## Replays and video export

Finishing a match reveals a **Replay** button on the scoreboard. The full-screen player lets you scrub through every action, adjust playback speed from 1× to 5× and export the session to WebM via the **Save** button.

## Peer-to-peer mode

A built-in signalling server relays WebRTC offers, answers and ICE candidates. Clients join with `{ type: 'join', room: '<id>' }` and exchange `{ type: 'signal', payload: ... }` messages until the peer connection is established. Call `disconnectPeer()` to close both the WebRTC channel and its fallback WebSocket. For message samples refer to `p2p-server-info.txt`.
