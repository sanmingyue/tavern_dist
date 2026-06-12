$ErrorActionPreference = "Stop"
$root = Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")
$server = Join-Path $root "server\main.cjs"
$port = if ($env:XIAOSHOUJI_PORT) { $env:XIAOSHOUJI_PORT } else { "39231" }
$node = (Get-Command node).Source

$psi = [System.Diagnostics.ProcessStartInfo]::new()
$psi.FileName = $node
$psi.Arguments = "`"$server`""
$psi.WorkingDirectory = $root
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $true
[void][System.Diagnostics.Process]::Start($psi)
Start-Sleep -Seconds 2

$url = "http://127.0.0.1:$port"
$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)

$browser = $chromeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if ($browser) {
  Start-Process -FilePath $browser -ArgumentList "--app=$url", "--user-data-dir=$env:LOCALAPPDATA\xiaoshouji-standalone"
} else {
  Start-Process $url
}
