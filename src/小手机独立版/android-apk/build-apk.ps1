$ErrorActionPreference = "Stop"

$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Jdk = "C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
$Sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$Gradle = Join-Path $env:LOCALAPPDATA "Gradle\gradle-8.10.2\bin\gradle.bat"

if (-not (Test-Path -LiteralPath $Jdk)) {
  throw "未找到 JDK: $Jdk"
}
if (-not (Test-Path -LiteralPath $Sdk)) {
  throw "未找到 Android SDK: $Sdk"
}
if (-not (Test-Path -LiteralPath $Gradle)) {
  throw "未找到 Gradle: $Gradle"
}

$env:JAVA_HOME = $Jdk
$env:ANDROID_HOME = $Sdk
$env:ANDROID_SDK_ROOT = $Sdk
$env:Path = "$Jdk\bin;$Sdk\cmdline-tools\latest\bin;$Sdk\platform-tools;$(Split-Path $Gradle);$env:Path"

Push-Location $ProjectDir
try {
  & $Gradle assembleDebug
} finally {
  Pop-Location
}

$Apk = Join-Path $ProjectDir "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path -LiteralPath $Apk) {
  Write-Host "APK 已生成: $Apk" -ForegroundColor Green
}

