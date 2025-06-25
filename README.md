# 5x5 Arena

A simple WebSocket-based 5×5 PvP game.

## Troubleshooting

After you press the **Подтвердить** button your moves are sent to the server. The client waits for the `start_round` message to continue. If this message does not arrive within about 10 seconds you will see the error:

```
сервер не начал раунд, перепроверьте соединение
```

The confirm button becomes active again so you can resend the moves. This usually means that the connection to the server was interrupted.
