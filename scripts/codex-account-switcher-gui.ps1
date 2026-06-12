Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$script:LauncherLogDir = Join-Path ([System.IO.Path]::GetTempPath()) "CodexAccountSwitcher"
$script:LauncherLogPath = Join-Path $script:LauncherLogDir "launcher.log"

function Write-LauncherLog {
  param([string]$Message)

  New-Item -ItemType Directory -Force -Path $script:LauncherLogDir | Out-Null
  $line = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] $Message"
  Add-Content -LiteralPath $script:LauncherLogPath -Value $line -Encoding UTF8
}

trap {
  try {
    New-Item -ItemType Directory -Force -Path $script:LauncherLogDir | Out-Null
    $line = "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] ERROR: $($_.Exception.ToString())"
    Add-Content -LiteralPath $script:LauncherLogPath -Value $line -Encoding UTF8
  } catch {
    # The message box below is the fallback if logging is unavailable.
  }

  try {
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show(
      "Codex 账号切换器启动失败：`n`n$($_.Exception.Message)`n`n日志：$script:LauncherLogPath",
      "启动失败",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Error
    ) | Out-Null
  } catch {
    # If WinForms itself is unavailable, the launcher log still has the error.
  }

  break
}

Write-LauncherLog "Starting GUI script."

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName Microsoft.VisualBasic

[System.Windows.Forms.Application]::EnableVisualStyles()

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

$script:CodexHome = Get-CodexHome
$script:AuthPath = Join-Path $script:CodexHome "auth.json"
$script:StoreRoot = Get-StoreRoot
$script:ProfilesRoot = Join-Path $script:StoreRoot "profiles"
$script:ActiveProfilePath = Join-Path $script:StoreRoot "active-profile.txt"
$script:SessionsRoot = Join-Path $script:CodexHome "sessions"
$script:SessionIndexPath = Join-Path $script:CodexHome "session_index.jsonl"

function Initialize-Store {
  New-Item -ItemType Directory -Force -Path $script:ProfilesRoot | Out-Null

  try {
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $acl = Get-Acl -LiteralPath $script:StoreRoot
    $acl.SetAccessRuleProtection($true, $false)
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
      $identity,
      "FullControl",
      "ContainerInherit,ObjectInherit",
      "None",
      "Allow"
    )
    $acl.SetAccessRule($rule)
    Set-Acl -LiteralPath $script:StoreRoot -AclObject $acl
  } catch {
    # Best effort. The folder still stays under the current user's LocalAppData.
  }

  try {
    $item = Get-Item -LiteralPath $script:StoreRoot
    $item.Attributes = $item.Attributes -bor [System.IO.FileAttributes]::Hidden
  } catch {
    # Best effort only.
  }
}

function Require-ProfileName {
  param([string]$ProfileName)

  if ([string]::IsNullOrWhiteSpace($ProfileName)) {
    throw "请输入账号档案名，例如 gpt1。"
  }

  if ($ProfileName -eq "." -or $ProfileName -eq ".." -or $ProfileName -match '[\\/]') {
    throw "账号档案名不能包含路径符号。"
  }

  $invalidChars = [System.IO.Path]::GetInvalidFileNameChars()
  if ($ProfileName.IndexOfAny($invalidChars) -ge 0) {
    throw "账号档案名包含 Windows 不允许的字符。"
  }
}

function Get-ProfileDir {
  param([string]$ProfileName)

  Require-ProfileName $ProfileName
  return Join-Path $script:ProfilesRoot $ProfileName
}

function Get-ProfileAuthPath {
  param([string]$ProfileName)

  return Join-Path (Get-ProfileDir $ProfileName) "auth.json"
}

function Set-HiddenIfPossible {
  param([string]$Path)

  try {
    $item = Get-Item -LiteralPath $Path
    $item.Attributes = $item.Attributes -bor [System.IO.FileAttributes]::Hidden
  } catch {
    # Best effort only.
  }
}

function Write-ProfileMeta {
  param([string]$ProfileName)

  $metaPath = Join-Path (Get-ProfileDir $ProfileName) "profile.txt"
  @(
    "name=$ProfileName"
    "saved_at=$((Get-Date).ToString('o'))"
    "codex_home=$script:CodexHome"
  ) | Set-Content -LiteralPath $metaPath -Encoding UTF8
}

function Get-ActiveProfile {
  if (-not (Test-Path -LiteralPath $script:ActiveProfilePath)) {
    return ""
  }

  return (Get-Content -LiteralPath $script:ActiveProfilePath -Raw).Trim()
}

function Set-ActiveProfile {
  param([string]$ProfileName)

  Set-Content -LiteralPath $script:ActiveProfilePath -Value $ProfileName -Encoding UTF8
}

function Sync-ActiveProfile {
  $active = Get-ActiveProfile
  if ([string]::IsNullOrWhiteSpace($active)) {
    return
  }

  if (-not (Test-Path -LiteralPath $script:AuthPath)) {
    throw "没有找到当前 Codex 登录文件：$script:AuthPath"
  }

  $targetAuth = Get-ProfileAuthPath $active
  $targetDir = Split-Path -Parent $targetAuth
  if (-not (Test-Path -LiteralPath $targetDir)) {
    return
  }

  Copy-Item -LiteralPath $script:AuthPath -Destination $targetAuth -Force
  Set-HiddenIfPossible $targetAuth
  Write-ProfileMeta $active
}

function Save-Profile {
  param(
    [string]$ProfileName,
    [bool]$Force
  )

  Require-ProfileName $ProfileName
  Initialize-Store

  if (-not (Test-Path -LiteralPath $script:AuthPath)) {
    throw "没有找到当前 Codex 登录文件。请先在 Codex 里登录这个账号，再保存。"
  }

  $profileDir = Get-ProfileDir $ProfileName
  $profileAuth = Get-ProfileAuthPath $ProfileName

  if ((Test-Path -LiteralPath $profileAuth) -and -not $Force) {
    throw "账号档案 '$ProfileName' 已存在。需要覆盖时请先删除或用命令行 -Force。"
  }

  New-Item -ItemType Directory -Force -Path $profileDir | Out-Null
  Copy-Item -LiteralPath $script:AuthPath -Destination $profileAuth -Force
  Set-HiddenIfPossible $profileAuth
  Write-ProfileMeta $ProfileName
  Set-ActiveProfile $ProfileName
}

function Switch-Profile {
  param([string]$ProfileName)

  Require-ProfileName $ProfileName
  Initialize-Store

  $profileAuth = Get-ProfileAuthPath $ProfileName
  if (-not (Test-Path -LiteralPath $profileAuth)) {
    throw "没有找到账号档案 '$ProfileName'。"
  }

  Sync-ActiveProfile
  New-Item -ItemType Directory -Force -Path $script:CodexHome | Out-Null
  Copy-Item -LiteralPath $profileAuth -Destination $script:AuthPath -Force
  Set-HiddenIfPossible $script:AuthPath
  Set-ActiveProfile $ProfileName
}

function Get-Profiles {
  Initialize-Store
  return @(Get-ChildItem -LiteralPath $script:ProfilesRoot -Directory -ErrorAction SilentlyContinue | Sort-Object Name)
}

function Get-CodexProcesses {
  return @(Get-Process -ErrorAction SilentlyContinue |
    Where-Object {
      ($_.ProcessName -eq "Codex" -or $_.ProcessName -eq "codex") -and
      ($_.ProcessName -notlike "codex-command-runner*")
    })
}

function Test-CodexRunning {
  return [bool](Get-CodexProcesses)
}

function Warn-IfCodexRunning {
  if (-not (Test-CodexRunning)) {
    return $true
  }

  $message = "检测到 Codex 可能正在运行。为确保账号刷新，最好先完全退出 Codex。`n`n仍然继续切换吗？"
  $result = [System.Windows.Forms.MessageBox]::Show(
    $message,
    "Codex 正在运行",
    [System.Windows.Forms.MessageBoxButtons]::YesNo,
    [System.Windows.Forms.MessageBoxIcon]::Warning
  )

  return $result -eq [System.Windows.Forms.DialogResult]::Yes
}

function Get-CodexExecutable {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA "OpenAI\Codex\bin\codex.exe"),
    (Join-Path $env:LOCALAPPDATA "Packages\OpenAI.Codex_2p2nqsd0c76g0\LocalCache\Local\OpenAI\Codex\bin\codex.exe")
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return "codex"
}

function Start-Codex {
  $exe = Get-CodexExecutable
  Start-Process -FilePath $exe | Out-Null
}

function Open-Folder {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Force -Path $Path | Out-Null
  }

  Start-Process -FilePath "explorer.exe" -ArgumentList @($Path) | Out-Null
}

function Get-RecentThreads {
  if (-not (Test-Path -LiteralPath $script:SessionIndexPath)) {
    return @()
  }

  $lines = [System.IO.File]::ReadAllLines($script:SessionIndexPath, [System.Text.Encoding]::UTF8)
  $items = New-Object System.Collections.Generic.List[object]

  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) {
      continue
    }

    try {
      $item = $line | ConvertFrom-Json
      $items.Add($item)
    } catch {
      # Ignore malformed lines.
    }
  }

  return @($items | Sort-Object updated_at -Descending | Select-Object -First 20)
}

function Get-SessionFileByThreadId {
  param([string]$ThreadId)

  if ([string]::IsNullOrWhiteSpace($ThreadId) -or -not (Test-Path -LiteralPath $script:SessionsRoot)) {
    return $null
  }

  $match = Get-ChildItem -LiteralPath $script:SessionsRoot -Recurse -File -Filter "*.jsonl" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "*$ThreadId*" } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($null -eq $match) {
    return $null
  }

  return $match.FullName
}

function Get-MessageText {
  param($Content)

  $parts = New-Object System.Collections.Generic.List[string]
  foreach ($part in @($Content)) {
    if ($null -eq $part) {
      continue
    }

    if ($part.type -eq "input_text" -or $part.type -eq "output_text") {
      [void]$parts.Add([string]$part.text)
    } elseif ($part.type -eq "input_image" -or $part.type -eq "output_image") {
      [void]$parts.Add("[image]")
    }
  }

  return ($parts -join [Environment]::NewLine).Trim()
}

function Export-ThreadToReadableText {
  param([string]$SessionFile)

  if (-not (Test-Path -LiteralPath $SessionFile)) {
    throw "没有找到 session 文件。"
  }

  $outDir = Join-Path $env:TEMP "CodexAccountSwitcher"
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null

  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($SessionFile)
  $outFile = Join-Path $outDir "$baseName.txt"
  $utf8Bom = New-Object System.Text.UTF8Encoding($true)
  $writer = New-Object System.IO.StreamWriter($outFile, $false, $utf8Bom)

  try {
    $writer.WriteLine("Source: $SessionFile")
    $writer.WriteLine("Exported: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))")
    $writer.WriteLine("")

    $lines = [System.IO.File]::ReadLines($SessionFile, [System.Text.Encoding]::UTF8)
    foreach ($line in $lines) {
      if ([string]::IsNullOrWhiteSpace($line)) {
        continue
      }

      try {
        $item = $line | ConvertFrom-Json
      } catch {
        continue
      }

      if ($item.type -ne "response_item" -or $item.payload.type -ne "message") {
        continue
      }

      $role = [string]$item.payload.role
      if ($role -ne "user" -and $role -ne "assistant") {
        continue
      }

      $text = Get-MessageText $item.payload.content
      if ([string]::IsNullOrWhiteSpace($text)) {
        continue
      }

      $timestamp = [string]$item.timestamp
      $writer.WriteLine("[$timestamp] $($role.ToUpperInvariant())")
      $writer.WriteLine($text)
      $writer.WriteLine("")
      $writer.WriteLine("------------------------------------------------------------")
      $writer.WriteLine("")
    }
  } finally {
    $writer.Dispose()
  }

  return $outFile
}

Initialize-Store

$form = New-Object System.Windows.Forms.Form
$form.Text = "Codex 账号切换器"
$form.StartPosition = "CenterScreen"
$form.Size = New-Object System.Drawing.Size(840, 620)
$form.MinimumSize = New-Object System.Drawing.Size(780, 560)
$form.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 9)

$title = New-Object System.Windows.Forms.Label
$title.Text = "Codex 账号切换器"
$title.Font = New-Object System.Drawing.Font("Microsoft YaHei UI", 14, [System.Drawing.FontStyle]::Bold)
$title.AutoSize = $true
$title.Location = New-Object System.Drawing.Point(16, 14)
$form.Controls.Add($title)

$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "双击账号档案即可切换并打开 Codex。此工具只保存 Codex 登录会话，不保存账号密码。"
$subtitle.AutoSize = $true
$subtitle.Location = New-Object System.Drawing.Point(18, 47)
$form.Controls.Add($subtitle)

$profilesLabel = New-Object System.Windows.Forms.Label
$profilesLabel.Text = "账号档案"
$profilesLabel.AutoSize = $true
$profilesLabel.Location = New-Object System.Drawing.Point(18, 84)
$form.Controls.Add($profilesLabel)

$profileList = New-Object System.Windows.Forms.ListBox
$profileList.Location = New-Object System.Drawing.Point(20, 108)
$profileList.Size = New-Object System.Drawing.Size(250, 260)
$profileList.Anchor = "Top,Left,Bottom"
$form.Controls.Add($profileList)

$btnRefresh = New-Object System.Windows.Forms.Button
$btnRefresh.Text = "刷新"
$btnRefresh.Location = New-Object System.Drawing.Point(20, 380)
$btnRefresh.Size = New-Object System.Drawing.Size(78, 32)
$btnRefresh.Anchor = "Left,Bottom"
$form.Controls.Add($btnRefresh)

$btnSave = New-Object System.Windows.Forms.Button
$btnSave.Text = "保存当前登录"
$btnSave.Location = New-Object System.Drawing.Point(104, 380)
$btnSave.Size = New-Object System.Drawing.Size(166, 32)
$btnSave.Anchor = "Left,Bottom"
$form.Controls.Add($btnSave)

$btnSwitch = New-Object System.Windows.Forms.Button
$btnSwitch.Text = "切换"
$btnSwitch.Location = New-Object System.Drawing.Point(20, 420)
$btnSwitch.Size = New-Object System.Drawing.Size(78, 34)
$btnSwitch.Anchor = "Left,Bottom"
$form.Controls.Add($btnSwitch)

$btnSwitchOpen = New-Object System.Windows.Forms.Button
$btnSwitchOpen.Text = "切换并打开 Codex"
$btnSwitchOpen.Location = New-Object System.Drawing.Point(104, 420)
$btnSwitchOpen.Size = New-Object System.Drawing.Size(166, 34)
$btnSwitchOpen.Anchor = "Left,Bottom"
$form.Controls.Add($btnSwitchOpen)

$btnOpenCodex = New-Object System.Windows.Forms.Button
$btnOpenCodex.Text = "打开 Codex"
$btnOpenCodex.Location = New-Object System.Drawing.Point(20, 462)
$btnOpenCodex.Size = New-Object System.Drawing.Size(250, 32)
$btnOpenCodex.Anchor = "Left,Bottom"
$form.Controls.Add($btnOpenCodex)

$btnOpenSessions = New-Object System.Windows.Forms.Button
$btnOpenSessions.Text = "打开本地聊天记录文件夹"
$btnOpenSessions.Location = New-Object System.Drawing.Point(20, 502)
$btnOpenSessions.Size = New-Object System.Drawing.Size(250, 32)
$btnOpenSessions.Anchor = "Left,Bottom"
$form.Controls.Add($btnOpenSessions)

$btnOpenProfiles = New-Object System.Windows.Forms.Button
$btnOpenProfiles.Text = "打开账号档案文件夹"
$btnOpenProfiles.Location = New-Object System.Drawing.Point(20, 542)
$btnOpenProfiles.Size = New-Object System.Drawing.Size(250, 28)
$btnOpenProfiles.Anchor = "Left,Bottom"
$form.Controls.Add($btnOpenProfiles)

$statusLabel = New-Object System.Windows.Forms.Label
$statusLabel.Text = "状态"
$statusLabel.AutoSize = $true
$statusLabel.Location = New-Object System.Drawing.Point(292, 84)
$form.Controls.Add($statusLabel)

$statusBox = New-Object System.Windows.Forms.TextBox
$statusBox.Location = New-Object System.Drawing.Point(294, 108)
$statusBox.Size = New-Object System.Drawing.Size(510, 120)
$statusBox.Multiline = $true
$statusBox.ReadOnly = $true
$statusBox.ScrollBars = "Vertical"
$statusBox.Anchor = "Top,Left,Right"
$form.Controls.Add($statusBox)

$threadsLabel = New-Object System.Windows.Forms.Label
$threadsLabel.Text = "最近本地聊天记录"
$threadsLabel.AutoSize = $true
$threadsLabel.Location = New-Object System.Drawing.Point(292, 246)
$form.Controls.Add($threadsLabel)

$threadList = New-Object System.Windows.Forms.ListBox
$threadList.Location = New-Object System.Drawing.Point(294, 270)
$threadList.Size = New-Object System.Drawing.Size(510, 250)
$threadList.Anchor = "Top,Left,Right,Bottom"
$form.Controls.Add($threadList)

$btnRefreshThreads = New-Object System.Windows.Forms.Button
$btnRefreshThreads.Text = "刷新记录"
$btnRefreshThreads.Location = New-Object System.Drawing.Point(294, 535)
$btnRefreshThreads.Size = New-Object System.Drawing.Size(96, 32)
$btnRefreshThreads.Anchor = "Left,Bottom"
$form.Controls.Add($btnRefreshThreads)

$btnOpenSelectedThread = New-Object System.Windows.Forms.Button
$btnOpenSelectedThread.Text = "查看选中记录"
$btnOpenSelectedThread.Location = New-Object System.Drawing.Point(398, 535)
$btnOpenSelectedThread.Size = New-Object System.Drawing.Size(132, 32)
$btnOpenSelectedThread.Anchor = "Left,Bottom"
$form.Controls.Add($btnOpenSelectedThread)

$btnSync = New-Object System.Windows.Forms.Button
$btnSync.Text = "同步当前会话到档案"
$btnSync.Location = New-Object System.Drawing.Point(538, 535)
$btnSync.Size = New-Object System.Drawing.Size(150, 32)
$btnSync.Anchor = "Left,Bottom"
$form.Controls.Add($btnSync)

$btnHelp = New-Object System.Windows.Forms.Button
$btnHelp.Text = "说明"
$btnHelp.Location = New-Object System.Drawing.Point(696, 535)
$btnHelp.Size = New-Object System.Drawing.Size(108, 32)
$btnHelp.Anchor = "Right,Bottom"
$form.Controls.Add($btnHelp)

$script:ThreadItems = @()

function Refresh-ProfilesUi {
  $profileList.Items.Clear()
  $active = Get-ActiveProfile

  foreach ($profile in Get-Profiles) {
    $name = $profile.Name
    if ($name -eq $active) {
      [void]$profileList.Items.Add("* $name")
    } else {
      [void]$profileList.Items.Add("  $name")
    }
  }

  Refresh-StatusUi
}

function Refresh-ThreadsUi {
  $threadList.Items.Clear()
  $script:ThreadItems = @(Get-RecentThreads)

  foreach ($thread in $script:ThreadItems) {
    $updated = ""
    try {
      $updated = ([DateTime]::Parse($thread.updated_at)).ToLocalTime().ToString("yyyy-MM-dd HH:mm")
    } catch {
      $updated = [string]$thread.updated_at
    }

    $name = [string]$thread.thread_name
    if ([string]::IsNullOrWhiteSpace($name)) {
      $name = [string]$thread.id
    }

    [void]$threadList.Items.Add("$updated  $name")
  }
}

function Refresh-StatusUi {
  $active = Get-ActiveProfile
  if ([string]::IsNullOrWhiteSpace($active)) {
    $active = "(无)"
  }

  $codexExe = Get-CodexExecutable
  $statusBox.Text = @(
    "当前档案: $active"
    "Codex 正在运行: $(Test-CodexRunning)"
    "Codex 登录文件: $script:AuthPath"
    "账号档案目录: $script:StoreRoot"
    "本地聊天记录: $script:SessionsRoot"
    "Codex 启动入口: $codexExe"
  ) -join [Environment]::NewLine
}

function Get-SelectedProfileName {
  if ($profileList.SelectedItem -eq $null) {
    throw "请先选择一个账号档案。"
  }

  return ([string]$profileList.SelectedItem).TrimStart("*", " ")
}

function Show-Error {
  param([string]$Message)

  [System.Windows.Forms.MessageBox]::Show(
    $Message,
    "操作失败",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Error
  ) | Out-Null
}

function Use-SelectedProfile {
  param([bool]$Launch)

  try {
    $name = Get-SelectedProfileName
    if (-not (Warn-IfCodexRunning)) {
      return
    }

    Switch-Profile $name
    Refresh-ProfilesUi

    if ($Launch) {
      Start-Codex
    }

    $tail = ""
    if ($Launch) {
      $tail = "，并已尝试打开 Codex"
    }

    [System.Windows.Forms.MessageBox]::Show(
      "已切换到账号档案 '$name'$tail。",
      "完成",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
  } catch {
    Show-Error $_.Exception.Message
  }
}

$btnRefresh.Add_Click({
  Refresh-ProfilesUi
})

$btnSave.Add_Click({
  try {
    $default = Get-ActiveProfile
    if ([string]::IsNullOrWhiteSpace($default)) {
      $default = "gpt1"
    }

    $name = [Microsoft.VisualBasic.Interaction]::InputBox(
      "给当前 Codex 登录保存一个档案名，例如 gpt1、gpt2、gpt3。",
      "保存当前登录",
      $default
    )

    if ([string]::IsNullOrWhiteSpace($name)) {
      return
    }

    Save-Profile $name.Trim() $false
    Refresh-ProfilesUi
    [System.Windows.Forms.MessageBox]::Show(
      "已保存当前 Codex 登录为 '$($name.Trim())'。",
      "完成",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
  } catch {
    Show-Error $_.Exception.Message
  }
})

$btnSwitch.Add_Click({
  Use-SelectedProfile $false
})

$btnSwitchOpen.Add_Click({
  Use-SelectedProfile $true
})

$profileList.Add_DoubleClick({
  if ($profileList.SelectedItem -ne $null) {
    Use-SelectedProfile $true
  }
})

$btnOpenCodex.Add_Click({
  try {
    Start-Codex
  } catch {
    Show-Error $_.Exception.Message
  }
})

$btnOpenSessions.Add_Click({
  try {
    Open-Folder $script:SessionsRoot
  } catch {
    Show-Error $_.Exception.Message
  }
})

$btnOpenProfiles.Add_Click({
  try {
    Open-Folder $script:StoreRoot
  } catch {
    Show-Error $_.Exception.Message
  }
})

$btnRefreshThreads.Add_Click({
  try {
    Refresh-ThreadsUi
  } catch {
    Show-Error $_.Exception.Message
  }
})

$btnOpenSelectedThread.Add_Click({
  try {
    if ($threadList.SelectedIndex -lt 0) {
      throw "请先选择一条本地聊天记录。"
    }

    $thread = $script:ThreadItems[$threadList.SelectedIndex]
    $file = Get-SessionFileByThreadId ([string]$thread.id)
    if ($null -eq $file) {
      throw "没有找到对应的 session 文件。"
    }

    $readable = Export-ThreadToReadableText $file
    Start-Process -FilePath "notepad.exe" -ArgumentList @($readable) | Out-Null
  } catch {
    Show-Error $_.Exception.Message
  }
})

$btnSync.Add_Click({
  try {
    Sync-ActiveProfile
    Refresh-ProfilesUi
    [System.Windows.Forms.MessageBox]::Show(
      "已把当前 Codex 登录会话同步回当前账号档案。",
      "完成",
      [System.Windows.Forms.MessageBoxButtons]::OK,
      [System.Windows.Forms.MessageBoxIcon]::Information
    ) | Out-Null
  } catch {
    Show-Error $_.Exception.Message
  }
})

$btnHelp.Add_Click({
  $message = @"
第一次使用:
1. 在 Codex 里登录第一个账号，完全退出 Codex。
2. 打开这个切换器，点“保存当前登录”，命名为 gpt1。
3. 在 Codex 里换第二个账号登录，退出 Codex，保存为 gpt2。
4. 第三个账号保存为 gpt3。

日常使用:
- 选中账号档案，点“切换并打开 Codex”。
- 或者直接双击账号档案。

本地聊天记录:
- 这个切换器不会切换你的 CodexHome，所以本地记录仍在同一个 sessions 目录。
- auth.json 和账号档案都等同于登录令牌，请当密码保管。
"@

  [System.Windows.Forms.MessageBox]::Show(
    $message,
    "说明",
    [System.Windows.Forms.MessageBoxButtons]::OK,
    [System.Windows.Forms.MessageBoxIcon]::Information
  ) | Out-Null
})

Refresh-ProfilesUi
Refresh-ThreadsUi

if ($env:CODEX_SWITCHER_INIT_ONLY -eq "1") {
  Write-LauncherLog "GUI initialized successfully."
  Write-Host "GUI initialized successfully."
  exit 0
}

[void][System.Windows.Forms.Application]::Run($form)
