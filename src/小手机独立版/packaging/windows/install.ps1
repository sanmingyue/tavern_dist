$ErrorActionPreference = "Stop"

$AppName = "小手机独立版"
$InstallDir = Join-Path $env:LOCALAPPDATA "XiaoshoujiStandalone"
$SourceDir = $PSScriptRoot
$Node = (Get-Command node -ErrorAction SilentlyContinue)
$Npm = (Get-Command npm -ErrorAction SilentlyContinue)

if (-not $Node) {
  Write-Host "未检测到 Node.js。请先安装 Node.js LTS: https://nodejs.org/" -ForegroundColor Red
  Read-Host "按回车退出"
  exit 1
}

if (-not $Npm) {
  Write-Host "未检测到 npm。请重新安装 Node.js LTS，并勾选 npm。" -ForegroundColor Red
  Read-Host "按回车退出"
  exit 1
}

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item -LiteralPath (Join-Path $SourceDir "server") -Destination $InstallDir -Recurse -Force
Copy-Item -LiteralPath (Join-Path $SourceDir "client") -Destination $InstallDir -Recurse -Force
Copy-Item -LiteralPath (Join-Path $SourceDir "README.txt") -Destination $InstallDir -Force

$PackageJson = Join-Path $InstallDir "package.json"
@"
{
  "name": "xiaoshouji-standalone-runtime",
  "private": true,
  "version": "0.0.1",
  "dependencies": {
    "socket.io": "4.8.3"
  }
}
"@ | Set-Content -LiteralPath $PackageJson -Encoding UTF8

if (-not (Test-Path -LiteralPath (Join-Path $InstallDir "node_modules\socket.io"))) {
  Write-Host "正在安装运行依赖 socket.io，请稍等..." -ForegroundColor Cyan
  Push-Location $InstallDir
  try {
    npm install --omit=dev --no-package-lock
  } finally {
    Pop-Location
  }
}

$StartScript = Join-Path $InstallDir "启动小手机.ps1"
@"
`$ErrorActionPreference = "Stop"
`$InstallDir = "$InstallDir"
`$Server = Join-Path `$InstallDir "server\main.cjs"
`$Port = if (`$env:XIAOSHOUJI_PORT) { `$env:XIAOSHOUJI_PORT } else { "39231" }
`$Node = (Get-Command node).Source

`$existing = Get-NetTCPConnection -LocalPort `$Port -State Listen -ErrorAction SilentlyContinue
if (-not `$existing) {
  `$psi = [System.Diagnostics.ProcessStartInfo]::new()
  `$psi.FileName = `$Node
  `$psi.Arguments = "`"`$Server`""
  `$psi.WorkingDirectory = `$InstallDir
  `$psi.UseShellExecute = `$false
  `$psi.CreateNoWindow = `$true
  [void][System.Diagnostics.Process]::Start(`$psi)
  Start-Sleep -Seconds 2
}

`$Url = "http://127.0.0.1:`$Port"
`$ChromeCandidates = @(
  "`$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "`${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "`$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe",
  "`$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "`${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
)
`$Browser = `$ChromeCandidates | Where-Object { Test-Path -LiteralPath `$_ } | Select-Object -First 1
if (`$Browser) {
  Start-Process -FilePath `$Browser -ArgumentList "--app=`$Url", "--user-data-dir=`$env:LOCALAPPDATA\XiaoshoujiStandaloneBrowser"
} else {
  Start-Process `$Url
}
"@ | Set-Content -LiteralPath $StartScript -Encoding UTF8

$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "小手机独立版.lnk"
$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$StartScript`""
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Save()

Write-Host ""
Write-Host "$AppName 安装完成。" -ForegroundColor Green
Write-Host "安装目录: $InstallDir"
Write-Host "桌面快捷方式: $ShortcutPath"
Write-Host ""
Write-Host "正在启动..."
powershell -ExecutionPolicy Bypass -File $StartScript
