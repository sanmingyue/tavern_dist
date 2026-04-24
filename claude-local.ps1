$claudeHome = Join-Path $PSScriptRoot ".local-npm"
$claudeCmd = Join-Path $claudeHome "claude.cmd"
& $claudeCmd @args
