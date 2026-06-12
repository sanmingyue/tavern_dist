param(
  [ValidateSet("help", "status", "list", "save", "switch", "sync", "where")]
  [string]$Action = "help",

  [string]$Name,

  [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Get-CodexHome {
  if (-not [string]::IsNullOrWhiteSpace($env:CODEX_HOME)) {
    return $env:CODEX_HOME
  }

  return Join-Path $HOME ".codex"
}

function Get-StoreRoot {
  $base = $env:LOCALAPPDATA
  if ([string]::IsNullOrWhiteSpace($base)) {
    $base = $HOME
  }

  return Join-Path $base "CodexAccountProfiles"
}

$CodexHome = Get-CodexHome
$AuthPath = Join-Path $CodexHome "auth.json"
$StoreRoot = Get-StoreRoot
$ProfilesRoot = Join-Path $StoreRoot "profiles"
$ActiveProfilePath = Join-Path $StoreRoot "active-profile.txt"

function Write-Usage {
  @"
Codex account switcher

This tool switches saved Codex auth sessions. It does not store account passwords.
Treat every saved profile as sensitive because it contains Codex access tokens.

First-time setup:
  1. Sign in to Codex with account 1, then close Codex completely.
  2. powershell -ExecutionPolicy Bypass -File .\scripts\codex-account-switch.ps1 save gpt1
  3. Sign out/in to Codex with account 2, close Codex, then save gpt2.
  4. Repeat for gpt3.

Daily use:
  powershell -ExecutionPolicy Bypass -File .\scripts\codex-account-switch.ps1 switch gpt1
  powershell -ExecutionPolicy Bypass -File .\scripts\codex-account-switch.ps1 switch gpt2
  powershell -ExecutionPolicy Bypass -File .\scripts\codex-account-switch.ps1 switch gpt3

Commands:
  help                 Show this help.
  status               Show active profile and important paths.
  list                 List saved profiles.
  save <name> [-Force] Save the current Codex auth.json as a named profile.
  switch <name>        Switch Codex auth.json to a saved profile.
  sync                 Save the current auth.json back into the active profile.
  where                Print storage paths.

Notes:
  - Close Codex before switching accounts. Reopen it after the switch.
  - Profiles are stored outside this repository under:
    $StoreRoot
"@ | Write-Host
}

function Initialize-Store {
  New-Item -ItemType Directory -Force -Path $ProfilesRoot | Out-Null

  try {
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $acl = Get-Acl -LiteralPath $StoreRoot
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
      $identity,
      "FullControl",
      "ContainerInherit,ObjectInherit",
      "None",
      "Allow"
    )
    $acl.SetAccessRule($rule)
    Set-Acl -LiteralPath $StoreRoot -AclObject $acl
  } catch {
    Write-Warning "Could not tighten folder ACLs. Keep this folder private: $StoreRoot"
  }

  try {
    $item = Get-Item -LiteralPath $StoreRoot
    $item.Attributes = $item.Attributes -bor [System.IO.FileAttributes]::Hidden
  } catch {
    # Hiding the folder is best-effort only.
  }
}

function Require-ProfileName {
  param([string]$ProfileName)

  if ([string]::IsNullOrWhiteSpace($ProfileName)) {
    throw "A profile name is required."
  }

  if ($ProfileName -eq "." -or $ProfileName -eq ".." -or $ProfileName -match '[\\/]') {
    throw "Invalid profile name: $ProfileName"
  }

  $invalidChars = [System.IO.Path]::GetInvalidFileNameChars()
  if ($ProfileName.IndexOfAny($invalidChars) -ge 0) {
    throw "Invalid profile name: $ProfileName"
  }
}

function Get-ProfileDir {
  param([string]$ProfileName)
  Require-ProfileName $ProfileName
  return Join-Path $ProfilesRoot $ProfileName
}

function Get-ProfileAuthPath {
  param([string]$ProfileName)
  return Join-Path (Get-ProfileDir $ProfileName) "auth.json"
}

function Test-CodexProcessRunning {
  $processes = Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -like "Codex*" -or $_.ProcessName -eq "codex" }

  return [bool]$processes
}

function Set-HiddenIfPossible {
  param([string]$Path)

  try {
    $item = Get-Item -LiteralPath $Path
    $item.Attributes = $item.Attributes -bor [System.IO.FileAttributes]::Hidden
  } catch {
    # Best-effort only.
  }
}

function Write-ProfileMeta {
  param([string]$ProfileName)

  $metaPath = Join-Path (Get-ProfileDir $ProfileName) "profile.txt"
  @(
    "name=$ProfileName"
    "saved_at=$((Get-Date).ToString('o'))"
    "codex_home=$CodexHome"
  ) | Set-Content -LiteralPath $metaPath -Encoding UTF8
}

function Sync-ActiveProfile {
  if (-not (Test-Path -LiteralPath $ActiveProfilePath)) {
    return
  }

  if (-not (Test-Path -LiteralPath $AuthPath)) {
    throw "Current Codex auth file was not found: $AuthPath"
  }

  $active = (Get-Content -LiteralPath $ActiveProfilePath -Raw).Trim()
  if ([string]::IsNullOrWhiteSpace($active)) {
    return
  }

  $targetAuth = Get-ProfileAuthPath $active
  if (-not (Test-Path -LiteralPath (Split-Path -Parent $targetAuth))) {
    return
  }

  Copy-Item -LiteralPath $AuthPath -Destination $targetAuth -Force
  Set-HiddenIfPossible $targetAuth
  Write-ProfileMeta $active
}

function Save-Profile {
  param([string]$ProfileName)

  Require-ProfileName $ProfileName
  Initialize-Store

  if (-not (Test-Path -LiteralPath $AuthPath)) {
    throw "No Codex auth file found at $AuthPath. Sign in to Codex first."
  }

  $profileDir = Get-ProfileDir $ProfileName
  $profileAuth = Get-ProfileAuthPath $ProfileName

  if ((Test-Path -LiteralPath $profileAuth) -and -not $Force) {
    throw "Profile '$ProfileName' already exists. Re-run with -Force to overwrite it."
  }

  New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
  Copy-Item -LiteralPath $AuthPath -Destination $profileAuth -Force
  Set-HiddenIfPossible $profileAuth
  Write-ProfileMeta $ProfileName

  Set-Content -LiteralPath $ActiveProfilePath -Value $ProfileName -Encoding UTF8
  Write-Host "Saved current Codex session as profile '$ProfileName'."
}

function Switch-Profile {
  param([string]$ProfileName)

  Require-ProfileName $ProfileName
  Initialize-Store

  $profileAuth = Get-ProfileAuthPath $ProfileName
  if (-not (Test-Path -LiteralPath $profileAuth)) {
    throw "Profile '$ProfileName' was not found. Use 'list' to see saved profiles."
  }

  if (Test-CodexProcessRunning) {
    Write-Warning "Codex appears to be running. Close Codex before switching for the cleanest result."
  }

  Sync-ActiveProfile

  New-Item -ItemType Directory -Force -Path $CodexHome | Out-Null
  Copy-Item -LiteralPath $profileAuth -Destination $AuthPath -Force
  Set-HiddenIfPossible $AuthPath

  Set-Content -LiteralPath $ActiveProfilePath -Value $ProfileName -Encoding UTF8
  Write-Host "Switched Codex session to profile '$ProfileName'. Reopen Codex now."
}

function List-Profiles {
  Initialize-Store

  $profiles = Get-ChildItem -LiteralPath $ProfilesRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name

  if (-not $profiles) {
    Write-Host "No saved profiles yet."
    return
  }

  $active = ""
  if (Test-Path -LiteralPath $ActiveProfilePath) {
    $active = (Get-Content -LiteralPath $ActiveProfilePath -Raw).Trim()
  }

  foreach ($profile in $profiles) {
    $auth = Join-Path $profile.FullName "auth.json"
    $stamp = ""
    if (Test-Path -LiteralPath $auth) {
      $stamp = (Get-Item -LiteralPath $auth).LastWriteTime.ToString("yyyy-MM-dd HH:mm:ss")
    }

    $marker = " "
    if ($profile.Name -eq $active) {
      $marker = "*"
    }

    Write-Host ("{0} {1}  {2}" -f $marker, $profile.Name, $stamp)
  }
}

function Show-Status {
  $active = "(none)"
  if (Test-Path -LiteralPath $ActiveProfilePath) {
    $active = (Get-Content -LiteralPath $ActiveProfilePath -Raw).Trim()
    if ([string]::IsNullOrWhiteSpace($active)) {
      $active = "(none)"
    }
  }

  Write-Host "Codex home:       $CodexHome"
  Write-Host "Auth file:        $AuthPath"
  Write-Host "Auth exists:      $(Test-Path -LiteralPath $AuthPath)"
  Write-Host "Profile store:    $StoreRoot"
  Write-Host "Active profile:   $active"
  Write-Host "Codex running:    $(Test-CodexProcessRunning)"
}

function Show-Paths {
  Write-Host "Codex home:       $CodexHome"
  Write-Host "Auth file:        $AuthPath"
  Write-Host "Profile store:    $StoreRoot"
  Write-Host "Profiles:         $ProfilesRoot"
  Write-Host "Active marker:    $ActiveProfilePath"
}

switch ($Action) {
  "help" {
    Write-Usage
  }
  "status" {
    Show-Status
  }
  "list" {
    List-Profiles
  }
  "save" {
    Save-Profile $Name
  }
  "switch" {
    Switch-Profile $Name
  }
  "sync" {
    Initialize-Store
    Sync-ActiveProfile
    Write-Host "Synced the current Codex session into the active profile."
  }
  "where" {
    Show-Paths
  }
}
