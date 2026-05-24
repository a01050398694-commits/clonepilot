# ClonePilot — 24/7 auto-demo loop launcher.
#
# Picks one un-processed URL from scripts/auto_queue.txt every 3 hours,
# generates a demo, appends to gallery.json, and posts one tweet.
#
# Usage:
#   1. Open PowerShell in this directory.
#   2. .\scripts\run_forever.ps1
#   3. Leave the window open. Ctrl+C to stop.
#
# To survive logoff: run via Windows Task Scheduler (one-time, "At startup",
# action = `powershell.exe -File scripts\run_forever.ps1`, run whether user
# logged in or not).

$ErrorActionPreference = "Continue"
$intervalSeconds = 3 * 60 * 60   # 3 hours = 8 cycles/day = ~240/mo (X-safe)

Write-Host "ClonePilot auto-loop started. Interval: $intervalSeconds s"
Write-Host "Stop with Ctrl+C."

while ($true) {
    Write-Host ""
    Write-Host "[$(Get-Date -Format 'u')] starting cycle"
    & uv run python scripts\auto_demo_loop.py
    $exit = $LASTEXITCODE
    Write-Host "[$(Get-Date -Format 'u')] cycle done (exit $exit). sleeping $intervalSeconds s..."
    Start-Sleep -Seconds $intervalSeconds
}
