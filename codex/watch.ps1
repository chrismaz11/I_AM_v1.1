# ---------------------------------------------------------
# CODEX-WATCH — Continuous Auto-Updating System
# ---------------------------------------------------------

Write-Host "Codex-Watch started. Monitoring changes…"
Write-Host "Press CTRL+C to stop."

$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = (Get-Location).Path
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.Filter = "*.*"

$action = {
    Write-Host "`nChange detected — regenerating docs…"

    codex-readme
    codex-roadmap
    codex-changelog
    codex-heartbeat

    Write-Host "`nUpdates complete. Watching…"
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null
while ($true) { Start-Sleep -Seconds 1 }
