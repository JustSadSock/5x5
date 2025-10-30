param(
  [int]$Port = 3000
)

Write-Host "[monitor] Watching server on port $Port. Press Ctrl+C to stop." -ForegroundColor Cyan

while ($true) {
  $time = Get-Date -Format 'HH:mm:ss'
  $httpStatus = 'down'
  try {
    $request = [System.Net.WebRequest]::Create("http://127.0.0.1:$Port/server-info.txt")
    $request.Method = 'GET'
    $request.Timeout = 2000
    $response = $request.GetResponse()
    $response.Close()
    $httpStatus = 'ok'
  } catch {
    $httpStatus = 'down'
  }

  $tunnel = ''
  try {
    $tunnels = Invoke-RestMethod -UseBasicParsing -Uri 'http://127.0.0.1:4040/api/tunnels'
    $tunnel = ($tunnels.tunnels | Where-Object { $_.proto -eq 'https' } | Select-Object -First 1).public_url
  } catch {
    $tunnel = ''
  }

  $socketStatus = 'closed'
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $async = $client.BeginConnect('127.0.0.1', $Port, $null, $null)
    if ($async.AsyncWaitHandle.WaitOne(1000) -and $client.Connected) {
      $socketStatus = 'listening'
    }
    $client.Close()
  } catch {
    $socketStatus = 'closed'
  }

  $summary = "[$time] http=$httpStatus socket=$socketStatus tunnel=$([string]::IsNullOrWhiteSpace($tunnel) ? 'n/a' : $tunnel)"
  Write-Host $summary
  Start-Sleep -Seconds 5
}
