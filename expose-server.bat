@echo off
setlocal EnableExtensions EnableDelayedExpansion
pushd "%~dp0"

if not defined PORT set "PORT=3000"
if not defined CLOUDFLARED_TUNNEL set "CLOUDFLARED_TUNNEL=irgri-tunnel"
if not defined PUBLIC_TUNNEL_URL set "PUBLIC_TUNNEL_URL=https://irgri.uk"

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

set "CLOUDFLARED_CMD=cloudflared"
if defined CLOUDFLARED_EXE (
  set "CLOUDFLARED_CMD=%CLOUDFLARED_EXE%"
  set "CLOUDFLARED_CMD=%CLOUDFLARED_CMD:\"=%"
  set "CLOUDFLARED_CMD=%CLOUDFLARED_CMD:'=%"
  if not exist "%CLOUDFLARED_CMD%" (
    for /f "delims=" %%I in ('where %CLOUDFLARED_CMD% 2^>nul') do (
      set "CLOUDFLARED_CMD=%%I"
      goto :cloudflared_ok
    )
    echo Provided CLOUDFLARED_EXE path was not found: %CLOUDFLARED_CMD%
    goto :fail
  )
  goto :cloudflared_ok
) else (
  for /f "delims=" %%I in ('where cloudflared 2^>nul') do (
    set "CLOUDFLARED_CMD=%%I"
    goto :cloudflared_ok
  )
  echo cloudflared was not found. Install it or set CLOUDFLARED_EXE to the full path.
  goto :fail
)

:cloudflared_ok

echo Starting local server on port %PORT%...
start "5x5-local-server" cmd /k "cd /d %~dp0 && set PORT=%PORT% && npm run start"

set "CLOUDFLARED_ARGS=tunnel run %CLOUDFLARED_TUNNEL%"
echo Launching Cloudflare Tunnel (%CLOUDFLARED_CMD% %CLOUDFLARED_ARGS%)...
start "5x5-cloudflared" cmd /k call "%CLOUDFLARED_CMD%" %CLOUDFLARED_ARGS%

set "TUNNEL_URL=%PUBLIC_TUNNEL_URL%"
set "WS_URL=%TUNNEL_URL:https://=wss://%"
if not exist scripts mkdir scripts >nul 2>&1
>scripts\.crossline-tunnel.env echo CROSSLINE_API_URL=%TUNNEL_URL%
>>scripts\.crossline-tunnel.env echo CROSSLINE_WS_URL=%WS_URL%
echo.
echo Tunnel available: %TUNNEL_URL%
echo Saved variables to scripts\.crossline-tunnel.env
echo Use these values for CROSSLINE_API_URL and CROSSLINE_WS_URL when deploying the client.

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
