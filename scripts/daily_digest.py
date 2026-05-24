"""ClonePilot daily digest — single PowerShell line, single answer.

Run any time:
    uv run python scripts/daily_digest.py

Prints exactly one line so you can drop it into Windows Task Scheduler,
PowerShell prompt banner, or pipe it to a Discord/Slack webhook later.

Example output:
    [2026-05-25 09:00 UTC] waitlist 12 (+3 today) · upgrade 8 (+2): pro 5 · life 1 · either 2 · demos 14

How "today" is defined:
    Diff vs the snapshot saved at `.daily_digest_state.json` (project root).
    First run prints (+0) and seeds the snapshot. Each subsequent run shows
    the delta since the previous run AND replaces the snapshot only if the
    UTC date has rolled over — so running it 10x in one day still shows the
    diff vs yesterday's close, not vs the last run.

Sources: same public endpoints the dashboard already uses, no Vercel token
needed. Read-only — safe to schedule.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

# Windows console fix — emit Unicode (em dash, middle dot) safely.
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

DEFAULT_GALLERY_URL = "https://clonepilot-gallery.vercel.app"
STATE_FILE = Path(".daily_digest_state.json")


def fetch_json(url: str, timeout: float = 10.0) -> dict | None:
    try:
        r = httpx.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception:
        return None


def load_state() -> dict:
    if not STATE_FILE.exists():
        return {}
    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_state(state: dict) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="One-line ClonePilot daily digest.")
    ap.add_argument(
        "--gallery-url",
        default=os.getenv("CLONEPILOT_GALLERY_URL", DEFAULT_GALLERY_URL),
        help="Public gallery base URL (default: env CLONEPILOT_GALLERY_URL or prod).",
    )
    ap.add_argument(
        "--no-update",
        action="store_true",
        help="Print delta but do not save today's snapshot (useful for testing).",
    )
    args = ap.parse_args()

    base = args.gallery_url.rstrip("/")
    waitlist = fetch_json(f"{base}/api/waitlist") or {}
    upgrade = fetch_json(f"{base}/api/upgrade") or {}

    now = datetime.now(timezone.utc)
    today = now.date().isoformat()

    today_waitlist = int(waitlist.get("count", 0))
    today_upgrade_total = int(upgrade.get("total", 0))
    today_pro = int(upgrade.get("pro", 0))
    today_life = int(upgrade.get("lifetime", 0))
    today_either = int(upgrade.get("either", 0))

    # Count locally-generated demos (read root gallery.json if present).
    gallery_path = Path("gallery.json")
    demos_live = 0
    if gallery_path.exists():
        try:
            g = json.loads(gallery_path.read_text(encoding="utf-8"))
            demos_live = sum(1 for e in g.get("entries", []) if e.get("ok"))
        except Exception:
            pass

    state = load_state()
    last_date = state.get("date")
    last_waitlist = state.get("waitlist", today_waitlist)
    last_upgrade_total = state.get("upgrade_total", today_upgrade_total)

    # Delta only meaningful when last snapshot is from a previous UTC day.
    if last_date and last_date != today:
        d_wait = today_waitlist - int(last_waitlist)
        d_upgrade = today_upgrade_total - int(last_upgrade_total)
    elif not last_date:
        d_wait = 0
        d_upgrade = 0
    else:
        # same-day re-run: still show delta vs snapshot for transparency
        d_wait = today_waitlist - int(last_waitlist)
        d_upgrade = today_upgrade_total - int(last_upgrade_total)

    def signed(n: int) -> str:
        return f"+{n}" if n >= 0 else str(n)

    line = (
        f"[{now.strftime('%Y-%m-%d %H:%M UTC')}] "
        f"waitlist {today_waitlist} ({signed(d_wait)} today) "
        f"· upgrade {today_upgrade_total} ({signed(d_upgrade)}): "
        f"pro {today_pro} · life {today_life} · either {today_either} "
        f"· demos {demos_live}"
    )
    print(line)

    # Roll snapshot forward only when UTC date changes (or first run).
    # That way same-day reruns keep showing real "today" delta.
    if not args.no_update and (not last_date or last_date != today):
        save_state(
            {
                "date": today,
                "waitlist": today_waitlist,
                "upgrade_total": today_upgrade_total,
                "pro": today_pro,
                "lifetime": today_life,
                "either": today_either,
                "saved_at": now.isoformat(),
            }
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
