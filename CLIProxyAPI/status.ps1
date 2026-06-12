$ErrorActionPreference = 'Stop'

$listenerPids = @()
netstat -ano | Select-String '127\.0\.0\.1:8317\s+.*LISTENING' | ForEach-Object {
  if ($_.Line -match '\s+(\d+)\s*$') {
    $listenerPids += [int]$Matches[1]
  }
}

if ($listenerPids) {
  foreach ($listenerPid in ($listenerPids | Select-Object -Unique)) {
    $process = Get-Process -Id $listenerPid -ErrorAction SilentlyContinue
    if ($process) {
      Write-Host "Listening on 127.0.0.1:8317, PID: $($process.Id), Process: $($process.ProcessName)"
    } else {
      Write-Host "Listening on 127.0.0.1:8317, PID: $listenerPid"
    }
  }
} else {
  Write-Host 'Not listening on 127.0.0.1:8317.'
}

try {
  $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8317/v1/models' -Headers @{
    Authorization = 'Bearer e44918e4fc28e8a0464dbc4744185da492e7b66e0120baa119ec46e501bab469'
  } -UseBasicParsing -TimeoutSec 5
  Write-Host "GET /v1/models: $($response.StatusCode)"
  Write-Host $response.Content
} catch {
  Write-Host "GET /v1/models failed: $($_.Exception.Message)"
}
