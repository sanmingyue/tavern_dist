$ErrorActionPreference = 'Stop'

$listenerPids = @()
netstat -ano | Select-String '127\.0\.0\.1:8317\s+.*LISTENING' | ForEach-Object {
  if ($_.Line -match '\s+(\d+)\s*$') {
    $listenerPids += [int]$Matches[1]
  }
}

if (-not $listenerPids) {
  Write-Host 'CLIProxyAPI is not listening on port 8317.'
  exit 0
}

foreach ($listenerPid in ($listenerPids | Select-Object -Unique)) {
  $process = Get-Process -Id $listenerPid -ErrorAction SilentlyContinue
  if ($process -and $process.ProcessName -eq 'cli-proxy-api') {
    Stop-Process -Id $process.Id -Force
    Write-Host "Stopped CLIProxyAPI PID: $($process.Id)"
  } else {
    Write-Host "Port 8317 is used by another process; not stopping PID: $listenerPid"
  }
}
