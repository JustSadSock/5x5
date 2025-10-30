@echo off
setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0"

if not defined PORT set "PORT=3000"

echo Checking Node.js and npm...
where node >nul 2>nul || (echo Node.js was not found in PATH.& goto :fail)
where npm >nul 2>nul || (echo npm was not found in PATH.& goto :fail)

echo Ensuring dependencies are installed...
if not exist node_modules ( 
  echo Running npm ci...
  call npm ci || goto :fail
) else (
  echo node_modules directory detected, skipping npm ci.
)

set "NGROK_CMD=ngrok"
if defined NGROK_EXE set "NGROK_CMD=%NGROK_EXE%"
if defined NGROK_AUTHTOKEN (
  echo Applying ngrok auth token...
  "%NGROK_CMD%" config add-authtoken %NGROK_AUTHTOKEN% >nul 2>&1
)

echo Starting local server on port %PORT%...
start "5x5-local-server" cmd /k "cd /d %~dp0 && set PORT=%PORT% && npm run start"

set "NGROK_ARGS=http %PORT% --scheme=https"
echo Launching ngrok tunnel (%NGROK_CMD% %NGROK_ARGS%)...
start "5x5-ngrok" cmd /k "\"%NGROK_CMD%\" %NGROK_ARGS%"

echo Waiting for ngrok to initialise...
timeout /t 6 >nul

for /f "usebackq tokens=* delims=" %%I in (`powershell -NoLogo -NoProfile -Command "Try { $resp = Invoke-RestMethod -UseBasicParsing -Uri 'http://127.0.0.1:4040/api/tunnels'; ($resp.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1).public_url } Catch { '' }"`) do set "TUNNEL_URL=%%I"

if defined TUNNEL_URL (
  set "WS_URL=!TUNNEL_URL:https://=wss://!"
  if not exist scripts mkdir scripts >nul 2>&1
  >scripts\.crossline-tunnel.env echo CROSSLINE_API_URL=!TUNNEL_URL!
  >>scripts\.crossline-tunnel.env echo CROSSLINE_WS_URL=!WS_URL!
  echo.
  echo Tunnel available: !TUNNEL_URL!
  echo Saved variables to scripts\.crossline-tunnel.env
  echo Use these values for CROSSLINE_API_URL and CROSSLINE_WS_URL when deploying the client.
) else (
  echo Could not determine tunnel URL automatically. Check the ngrok window for details.
)

if exist monitor-server.ps1 (
  echo Launching monitor-server.ps1 ...
  start "5x5-monitor" powershell -NoLogo -ExecutionPolicy Bypass -File "monitor-server.ps1" %PORT%
)

echo.
echo All processes started. Press Ctrl+C to exit this launcher.
endlocal
popd
exit /b 0

:fail
echo.
echo Failed to start the tunnel. Resolve the issue above and rerun the script.
endlocal
popd
exit /b 1
