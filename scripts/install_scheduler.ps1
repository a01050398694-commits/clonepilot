# Install Windows Task Scheduler entry so ClonePilot's auto-loop survives
# logoff and reboot. Run ONCE in an Administrator PowerShell.
#
# Usage (admin PS):
#   cd "E:\사업 유튜브 url 분석및 자동실행"
#   .\scripts\install_scheduler.ps1
#
# To remove later:
#   Unregister-ScheduledTask -TaskName "ClonePilot AutoLoop" -Confirm:$false

$ErrorActionPreference = "Stop"

$taskName = "ClonePilot AutoLoop"
$workDir = (Get-Location).Path
$psScript = Join-Path $workDir "scripts\run_forever.ps1"

if (-not (Test-Path $psScript)) {
    Write-Error "scripts\run_forever.ps1 not found in $workDir — run from project root."
    exit 1
}

# Use the user's PowerShell. -ExecutionPolicy Bypass lets us run the .ps1
# without changing the system policy.
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$psScript`"" `
    -WorkingDirectory $workDir

# Triggers: at logon AND at boot. Either one starts the loop.
$triggers = @(
    New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
    New-ScheduledTaskTrigger -AtStartup
)

# Settings: run hidden, no time-limit, restart on failure.
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Days 0) `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 5) `
    -StartWhenAvailable

# Register under the current user (no service account required).
Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $triggers `
    -Settings $settings `
    -Description "ClonePilot 3h auto-demo loop. Runs $psScript continuously." `
    -Force | Out-Null

Write-Host "✓ Installed scheduled task: $taskName"
Write-Host "  Triggers: at logon, at boot."
Write-Host "  Script:   $psScript"
Write-Host ""
Write-Host "Start now without waiting for next trigger:"
Write-Host "  Start-ScheduledTask -TaskName `"$taskName`""
Write-Host ""
Write-Host "Stop:"
Write-Host "  Stop-ScheduledTask  -TaskName `"$taskName`""
Write-Host ""
Write-Host "Remove:"
Write-Host "  Unregister-ScheduledTask -TaskName `"$taskName`" -Confirm:`$false"
