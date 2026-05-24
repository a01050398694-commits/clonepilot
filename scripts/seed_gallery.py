"""Seed the public ClonePilot gallery with N demo sites.

Picks a curated list of indie-hacker/SaaS YouTube videos, runs oneshot() on
each, writes one combined gallery.json the gallery web page can render. Each
demo failure is captured (transcript missing, deploy reject, etc.) so one bad
URL doesn't kill the whole batch.

Run: `uv run python scripts/seed_gallery.py [n=5]`
"""

from __future__ import annotations

import json
import sys
import time
import traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

from clonepilot.tools.oneshot import oneshot

# Curated indie-hacker / SaaS / solo-founder talks that almost always have
# captions and a clear business behind them. Order = priority.
SEED_VIDEOS = [
    # 0. Korean Naver-blog AdSense walkthrough (already known to work end-to-end)
    "https://www.youtube.com/watch?v=L9LfsOR1YHw",
    # 1. Pieter Levels on Lex Fridman — Nomad List / RemoteOK
    "https://www.youtube.com/watch?v=oFtjKbXKqbg",
    # 2. Marc Lou on building ShipFast / making $1M solo
    "https://www.youtube.com/watch?v=ZRPxbZpUf2g",
    # 3. Tony Dinh on TypingMind & shipping micro-SaaS
    "https://www.youtube.com/watch?v=YBpcQrMR-vw",
    # 4. Daniel Vassallo on Small Bets & quitting Amazon
    "https://www.youtube.com/watch?v=3wOK-1iBHvU",
    # 5. Justin Welsh on solopreneur funnel
    "https://www.youtube.com/watch?v=tWp2sVL5GpQ",
    # 6. Indie Hackers podcast — Sahil Lavingia (Gumroad)
    "https://www.youtube.com/watch?v=HwAfQU7Y29I",
    # 7. Arvid Kahl on bootstrapped SaaS
    "https://www.youtube.com/watch?v=Q-AaOoVF2ho",
    # 8. Greg Isenberg on community businesses
    "https://www.youtube.com/watch?v=Ot1Q57Lj1A8",
    # 9. Levelsio on building startups in 12 hours
    "https://www.youtube.com/watch?v=4QbW8GLDeFE",
]


def _run_one(idx: int, url: str) -> dict:
    """Run oneshot for a single video; capture errors so batch survives."""
    started = time.time()
    print(f"[{idx:02d}] start {url}", flush=True)
    try:
        result = oneshot(url, skip_marketing=True)
        elapsed = time.time() - started
        bp = result["blueprint"]
        live_url = result["deploy"]["url"]
        print(
            f"[{idx:02d}] OK   {bp['name']!r:30} -> {live_url} ({elapsed:.0f}s)",
            flush=True,
        )
        return {
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
            "live_url": live_url,
            "deploy_id": result["deploy"].get("deployment_id"),
            "elapsed_sec": round(elapsed, 1),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as exc:  # noqa: BLE001 — capture all failures
        elapsed = time.time() - started
        print(
            f"[{idx:02d}] FAIL {url} :: {type(exc).__name__}: {exc} ({elapsed:.0f}s)",
            flush=True,
        )
        return {
            "ok": False,
            "video_url": url,
            "error": f"{type(exc).__name__}: {exc}",
            "traceback": traceback.format_exc(limit=3),
            "elapsed_sec": round(elapsed, 1),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }


def main() -> int:
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    urls = SEED_VIDEOS[:n]
    out_path = Path("gallery.json")

    # Resume support: skip URLs already present and successful in gallery.json
    existing: list[dict] = []
    done_urls: set[str] = set()
    if out_path.exists():
        try:
            existing = json.loads(out_path.read_text(encoding="utf-8")).get(
                "entries", []
            )
            done_urls = {e["video_url"] for e in existing if e.get("ok")}
        except Exception:  # noqa: BLE001
            pass
    todo = [u for u in urls if u not in done_urls]
    print(
        f"Seed plan: {len(todo)} new (skipping {len(done_urls)} already-done)",
        flush=True,
    )

    # Run 2 at a time — keeps total under ~10 min while respecting Anthropic
    # rate limits and Vercel deploy concurrency.
    new_entries: list[dict] = []
    with ThreadPoolExecutor(max_workers=2) as pool:
        futures = {pool.submit(_run_one, i, u): u for i, u in enumerate(todo, 1)}
        for fut in as_completed(futures):
            new_entries.append(fut.result())

    combined = existing + new_entries
    # Stable order: keep input order; failures last
    combined.sort(key=lambda e: (not e.get("ok"), urls.index(e["video_url"]) if e["video_url"] in urls else 999))

    out_path.write_text(
        json.dumps(
            {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "ok_count": sum(1 for e in combined if e.get("ok")),
                "fail_count": sum(1 for e in combined if not e.get("ok")),
                "entries": combined,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"\nWrote {out_path.resolve()}", flush=True)
    print(
        f"Summary: OK={sum(1 for e in combined if e.get('ok'))} "
        f"FAIL={sum(1 for e in combined if not e.get('ok'))}",
        flush=True,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
