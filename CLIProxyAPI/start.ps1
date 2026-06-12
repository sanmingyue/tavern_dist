$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$exe = Join-Path $root 'cli-proxy-api.exe'
$config = Join-Path $root 'config.yaml'

if (-not (Test-Path -LiteralPath $exe)) {
  throw "Missing executable: $exe"
}

if (-not (Test-Path -LiteralPath $config)) {
  throw "Missing config: $config"
}

$listenerPid = $null
netstat -ano | Select-String '127\.0\.0\.1:8317\s+.*LISTENING' | Select-Object -First 1 | ForEach-Object {
  if ($_.Line -match '\s+(\d+)\s*$') {
    $listenerPid = [int]$Matches[1]
  }
}

if ($listenerPid) {
  Write-Host "CLIProxyAPI already appears to be listening on 127.0.0.1:8317 (PID: $listenerPid)."
  exit 0
}

New-Item -ItemType Directory -Force -Path (Join-Path $root 'auths'), (Join-Path $root 'logs') | Out-Null

try {
  $process = Start-Process -FilePath $exe -ArgumentList @('-config', $config) -WorkingDirectory $root -WindowStyle Hidden -PassThru
  $processId = $process.Id
} catch {
  $commandLine = '"' + $exe + '" -config "' + $config + '"'
  $startup = ([wmiclass]'Win32_ProcessStartup').CreateInstance()
  $startup.ShowWindow = 0
  $result = ([wmiclass]'Win32_Process').Create($commandLine, $root, $startup)

  if ($result.ReturnValue -ne 0) {
    throw "Failed to start CLIProxyAPI. WMI return value: $($result.ReturnValue)"
  }

  $processId = $result.ProcessId
}

Start-Sleep -Seconds 2
Write-Host "CLIProxyAPI started. PID: $processId"
Write-Host "API: http://127.0.0.1:8317"
Write-Host "Management UI: http://127.0.0.1:8317/management.html"
