"""24h background loop: generate one demo, append to gallery, optionally tweet.

Picks the next un-processed URL from a curated YouTube channel queue, runs
oneshot(), appends to gallery.json, and (if X env vars are present) posts one
tweet linking to the new demo.

Run continuously via Windows Task Scheduler (every 3h) or `python -m clonepilot
... && sleep 10800` cron loop. Self-contained — one iteration per run.

X free-tier cap: 500 writes/month ≈ 16/day. We post 1 tweet per cycle and
cycle every 3h → 8/day = ~240/month. Safe.

Set CLONEPILOT_AUTOLOOP_QUEUE to a path with one YouTube URL per line to add
your own queue; default is scripts/auto_queue.txt.
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import tweepy
from dotenv import load_dotenv

from clonepilot.tools.oneshot import oneshot

load_dotenv()

QUEUE_PATH = Path(
    os.getenv("CLONEPILOT_AUTOLOOP_QUEUE", "scripts/auto_queue.txt")
)
GALLERY = Path("gallery.json")
LOG = Path("auto_loop.log")


def _log(msg: str) -> None:
    line = f"{datetime.now(timezone.utc).isoformat()}  {msg}"
    print(line, flush=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def _load_queue() -> list[str]:
    if not QUEUE_PATH.exists():
        return []
    return [
        ln.strip()
        for ln in QUEUE_PATH.read_text(encoding="utf-8").splitlines()
        if ln.strip() and not ln.startswith("#")
    ]


def _load_gallery() -> dict:
    if not GALLERY.exists():
        return {"updated_at": "", "ok_count": 0, "fail_count": 0, "entries": []}
    return json.loads(GALLERY.read_text(encoding="utf-8"))


def _save_gallery(g: dict) -> None:
    GALLERY.write_text(
        json.dumps(g, indent=2, ensure_ascii=False), encoding="utf-8"
    )


def _done_urls(g: dict) -> set[str]:
    return {e["video_url"] for e in g.get("entries", []) if e.get("ok")}


def _next_url(queue: list[str], done: set[str]) -> str | None:
    for u in queue:
        if u not in done:
            return u
    return None


def _tweet(text: str) -> str | None:
    """Best-effort. Return tweet id or None."""
    try:
        client = tweepy.Client(
            consumer_key=os.environ["X_API_KEY"],
            consumer_secret=os.environ["X_API_SECRET"],
            access_token=os.environ["X_ACCESS_TOKEN"],
            access_token_secret=os.environ["X_ACCESS_SECRET"],
            wait_on_rate_limit=False,
        )
        resp = client.create_tweet(text=text[:278])
        return str(resp.data["id"])
    except KeyError:
        _log("tweet: X creds missing — skipping")
        return None
    except Exception as exc:  # noqa: BLE001
        _log(f"tweet failed: {exc}")
        return None


def main() -> int:
    queue = _load_queue()
    if not queue:
        _log(f"queue empty at {QUEUE_PATH} — nothing to do")
        return 0

    gallery = _load_gallery()
    done = _done_urls(gallery)
    url = _next_url(queue, done)
    if not url:
        _log("queue exhausted — all URLs already in gallery")
        return 0

    _log(f"cycle start: {url}")
    started = time.time()
    try:
        res = oneshot(url, skip_marketing=True)
    except Exception as exc:  # noqa: BLE001
        _log(f"oneshot FAIL {url} :: {type(exc).__name__}: {exc}")
        entry = {
            "ok": False,
            "video_url": url,
            "error": f"{type(exc).__name__}: {exc}",
            "elapsed_sec": round(time.time() - started, 1),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        gallery["entries"].append(entry)
        gallery["fail_count"] = sum(1 for e in gallery["entries"] if not e.get("ok"))
        gallery["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save_gallery(gallery)
        return 0

    bp = res["blueprint"]
    live = res["deploy"]["url"]
    elapsed = round(time.time() - started, 1)
    entry = {
        "ok": True,
        "video_url": url,
        "name": bp["name"],
        "tagline": bp.get("tagline", ""),
        "target": bp.get("target_audience", ""),
        "pricing_model": bp.get("pricing_model", ""),
        "tiers": [
            {
                "name": t["name"],
                "price_usd": t["price_usd"],
                "features": t.get("features", [])[:5],
            }
            for t in bp.get("pricing_tiers", [])
        ],
        "live_url": live,
        "deploy_id": res["deploy"].get("deployment_id"),
        "elapsed_sec": elapsed,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    gallery["entries"].append(entry)
    gallery["ok_count"] = sum(1 for e in gallery["entries"] if e.get("ok"))
    gallery["fail_count"] = sum(1 for e in gallery["entries"] if not e.get("ok"))
    gallery["updated_at"] = datetime.now(timezone.utc).isoformat()
    _save_gallery(gallery)
    _log(f"oneshot OK {bp['name']!r} -> {live} ({elapsed}s)")

    # Tweet — best-effort.
    gallery_url = os.getenv(
        "CLONEPILOT_GALLERY_URL", "https://clonepilot-gallery.vercel.app"
    ).rstrip("/")
    text = (
        f"ClonePilot just cloned a {bp.get('target_audience', 'business')[:40]} "
        f"from YouTube → live in {int(elapsed)}s\n\n"
        f"{live}?utm_source=x&utm_medium=auto\n\n"
        f"more demos: {gallery_url}?utm_source=x"
    )
    tid = _tweet(text)
    if tid:
        _log(f"tweeted {tid}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
