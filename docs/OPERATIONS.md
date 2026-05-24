# Operations — daily checks, schedulers, run-forever loop

Single page covering "what do I run every morning" and "how do I keep the
24/7 demo loop alive across reboots". All commands assume `cd "E:\사업 유튜브 url 분석및 자동실행"`.

---

## Daily digest — one line per day

`scripts/daily_digest.py` prints one line of status (waitlist + upgrade + demos)
and the delta since the previous UTC day. Designed to be the cheapest possible
"what happened yesterday" check.

```powershell
uv run python scripts/daily_digest.py
```

Example output:

```
[2026-05-25 09:00 UTC] waitlist 12 (+3 today) · upgrade 8 (+2): pro 5 · life 1 · either 2 · demos 14
```

Same-day reruns keep showing the delta vs the previous day's snapshot, so you
can rerun freely without losing the daily diff. Snapshot is stored at
`.daily_digest_state.json` (gitignored — see below).

### Add to PowerShell prompt banner (optional)

To see the digest every time you open a new shell in the project folder:

```powershell
# Append this to $PROFILE (PowerShell startup script):
if ((Get-Location).Path -eq "E:\사업 유튜브 url 분석및 자동실행") {
    uv run python scripts/daily_digest.py
}
```

### Schedule it (optional)

Once a day at 09:00 KST. Run **once** in an admin PowerShell:

```powershell
$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -Command `"cd 'E:\사업 유튜브 url 분석및 자동실행'; uv run python scripts/daily_digest.py | Out-File -Append -Encoding utf8 '.daily_digest.log'`""
$trigger = New-ScheduledTaskTrigger -Daily -At "09:00"
Register-ScheduledTask -TaskName "ClonePilot Daily Digest" `
  -Action $action -Trigger $trigger -Force
```

Daily history accumulates at `.daily_digest.log`.

---

## 24/7 auto-demo loop

`scripts/run_forever.ps1` continuously generates new demo sites from a YouTube
URL queue. Keeps the gallery looking active and seeds SEO. Two ways to keep it
alive across reboots.

### One-shot foreground (good for testing)

```powershell
.\scripts\run_forever.ps1
```

Runs until you Ctrl+C or close the window.

### Persistent — Windows Task Scheduler (recommended)

Run **once** in an **admin** PowerShell:

```powershell
.\scripts\install_scheduler.ps1
```

This registers a Scheduled Task **"ClonePilot AutoLoop"** that:

- Starts at user logon AND at system boot (either trigger fires it).
- Runs hidden (no visible window).
- Restarts up to 3× if it crashes, 5 min apart.
- Has no execution time limit.

### Check status

```powershell
Get-ScheduledTask -TaskName "ClonePilot AutoLoop" |
  Select-Object TaskName, State, LastRunTime, NextRunTime
```

Expected output once installed:

```
TaskName              State LastRunTime         NextRunTime
--------              ----- -----------         -----------
ClonePilot AutoLoop   Ready 2026-05-25 09:00:00 2026-05-26 09:00:00
```

If the task does not exist you'll see:

```
Get-ScheduledTask : No MSFT_ScheduledTask objects found with property 'TaskName' equal to 'ClonePilot AutoLoop'
```

→ run `.\scripts\install_scheduler.ps1` from an admin shell.

### Operator-session check (2026-05-24)

Operator session probed Task Scheduler on **2026-05-24** and confirmed
**"ClonePilot AutoLoop" is NOT installed yet**. To activate the background loop:

```powershell
# 1. Open admin PowerShell (Win+X → Terminal (Admin))
# 2. Run:
cd "E:\사업 유튜브 url 분석및 자동실행"
.\scripts\install_scheduler.ps1
# 3. Verify:
Get-ScheduledTask -TaskName "ClonePilot AutoLoop"
```

### Manual control after install

```powershell
# Start now without waiting for next trigger
Start-ScheduledTask -TaskName "ClonePilot AutoLoop"
# Stop
Stop-ScheduledTask -TaskName "ClonePilot AutoLoop"
# Remove permanently
Unregister-ScheduledTask -TaskName "ClonePilot AutoLoop" -Confirm:$false
```

---

## Live dashboard (richer view, optional)

`scripts/dashboard.py` is the long-form version of `daily_digest.py`. Shows the
same numbers + last 20 Vercel deploys + per-demo statuses, refreshing every 30s
in watch mode.

```powershell
# one-shot snapshot
uv run python scripts/dashboard.py

# live (Ctrl+C to exit)
uv run python scripts/dashboard.py --watch
```

Use `daily_digest.py` for the morning check, `dashboard.py --watch` only when
you're actively debugging or babysitting a launch.

---

## Files this page references

| File | Purpose | Owner |
|---|---|---|
| `scripts/daily_digest.py` | One-line daily summary | Operator |
| `scripts/dashboard.py` | Long-form live status | Operator |
| `scripts/run_forever.ps1` | The actual demo-generation loop | (background) |
| `scripts/install_scheduler.ps1` | Register Task Scheduler entry | one-time setup |
| `.daily_digest_state.json` | Yesterday's counts (do not commit) | auto-generated |
| `.daily_digest.log` | Append-only digest history (optional) | auto-generated |
