"""ClonePilot live status dashboard.

Run: `uv run python scripts/dashboard.py [--watch]`

Sources:
  * `gallery.json`           — auto-generated demos (count + names + live URLs)
  * Gallery /api/waitlist GET — current waitlist count (calls the public site)
  * Vercel REST API          — list deployments per project (Pro/free both work)
  * `x_thread_result.json`   — last X auto-tweet result (if present)

Designed to be cheap: every refresh is a couple of HTTP calls. Watch mode
refreshes every 30s. Read-only — never touches deployments or env.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

# Windows console defaults to cp949; we emit em-dashes/ANSI freely.
if sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

GALLERY_PATH = Path("gallery.json")
WAITLIST_URL_ENV = "CLONEPILOT_GALLERY_URL"  # e.g. https://clonepilot-gallery.vercel.app
VERCEL_TOKEN = os.getenv("VERCEL_TOKEN", "").strip()
VERCEL_TEAM_ID = os.getenv("VERCEL_TEAM_ID", "").strip()


# ANSI tiny helpers — no extra dep.
def c(s: str, color: str) -> str:
    codes = {"cyan": 36, "green": 32, "red": 31, "yellow": 33, "dim": 2, "bold": 1}
    return f"\x1b[{codes[color]}m{s}\x1b[0m"


def load_gallery() -> dict:
    if not GALLERY_PATH.exists():
        return {"entries": [], "ok_count": 0, "fail_count": 0, "updated_at": "—"}
    return json.loads(GALLERY_PATH.read_text(encoding="utf-8"))


def fetch_waitlist_count(base_url: str | None) -> int | None:
    if not base_url:
        return None
    try:
        r = httpx.get(f"{base_url.rstrip('/')}/api/waitlist", timeout=10)
        r.raise_for_status()
        return int(r.json().get("count", 0))
    except Exception:
        return None


def fetch_vercel_deploys(token: str, team_id: str) -> list[dict]:
    if not token:
        return []
    params = {"limit": 20}
    if team_id:
        params["teamId"] = team_id
    try:
        r = httpx.get(
            "https://api.vercel.com/v6/deployments",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
            timeout=15,
        )
        r.raise_for_status()
        return r.json().get("deployments", [])
    except Exception:
        return []


def render(gallery: dict, waitlist: int | None, deploys: list[dict]) -> str:
    lines: list[str] = []
    lines.append("")
    lines.append(c("  ClonePilot · live status", "bold"))
    lines.append(c("  ─────────────────────────", "dim"))

    ok = sum(1 for e in gallery["entries"] if e.get("ok"))
    fail = sum(1 for e in gallery["entries"] if not e.get("ok"))
    lines.append(f"  Demos live          : {c(str(ok), 'cyan')}   (failed: {fail})")
    lines.append(
        f"  Waitlist signups    : "
        f"{c(str(waitlist) if waitlist is not None else '—', 'cyan')}"
    )
    lines.append(
        f"  Vercel deploys (24h): {c(str(len(deploys)), 'cyan')}"
    )
    lines.append(
        f"  Gallery last update : {c(_short_time(gallery.get('updated_at')), 'dim')}"
    )

    if ok:
        lines.append("")
        lines.append(c("  Live demos", "bold"))
        for e in gallery["entries"]:
            if not e.get("ok"):
                continue
            name = (e.get("name") or "?")[:24].ljust(24)
            url = (e.get("live_url") or "").replace("https://", "")
            elapsed = e.get("elapsed_sec", 0)
            lines.append(
                f"  · {name} {c(url, 'cyan')} {c(f'{elapsed:.0f}s', 'dim')}"
            )

    if fail:
        lines.append("")
        lines.append(c("  Failed demos", "red"))
        for e in gallery["entries"]:
            if e.get("ok"):
                continue
            err = (e.get("error") or "?")[:60]
            url = e.get("video_url", "")
            lines.append(f"  · {c(err, 'red')}  {c(url, 'dim')}")

    if deploys:
        lines.append("")
        lines.append(c("  Recent Vercel deploys", "bold"))
        for d in deploys[:6]:
            url = d.get("url", "")
            state = d.get("state", "?")
            name = d.get("name", "?")[:20].ljust(20)
            state_c = c(
                state, "green" if state == "READY" else "yellow" if state == "BUILDING" else "red"
            )
            lines.append(f"  · {name} {state_c}  {c(url, 'dim')}")

    lines.append("")
    lines.append(
        c(f"  refreshed {datetime.now(timezone.utc).strftime('%H:%M:%S UTC')}", "dim")
    )
    return "\n".join(lines)


def _short_time(iso: str | None) -> str:
    if not iso or iso == "—":
        return "—"
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%Y-%m-%d %H:%M")
    except Exception:
        return iso[:16]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--watch", action="store_true", help="Refresh every 30s.")
    ap.add_argument("--gallery-url", default=os.getenv(WAITLIST_URL_ENV, ""))
    args = ap.parse_args()

    def one_pass() -> None:
        gallery = load_gallery()
        wait = fetch_waitlist_count(args.gallery_url)
        deploys = fetch_vercel_deploys(VERCEL_TOKEN, VERCEL_TEAM_ID)
        out = render(gallery, wait, deploys)
        if args.watch:
            sys.stdout.write("\x1b[2J\x1b[H")  # clear + home
        sys.stdout.write(out + "\n")
        sys.stdout.flush()

    if not args.watch:
        one_pass()
        return 0
    try:
        while True:
            one_pass()
            time.sleep(30)
    except KeyboardInterrupt:
        return 0


if __name__ == "__main__":
    raise SystemExit(main())
