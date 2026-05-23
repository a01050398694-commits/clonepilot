"""End-to-end Phase 2 test: oneshot(url) → full bundle.

Run via: uv run python scripts/e2e_phase2.py <youtube_url>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from clonepilot.tools.oneshot import oneshot


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=L9LfsOR1YHw"
    print(f"\n=== oneshot({url!r}) ===\n", flush=True)
    result = oneshot(url)

    bp = result["blueprint"]
    print(f"  name           : {bp['name']}")
    print(f"  tagline        : {bp['tagline']}")
    print(f"  transcript     : via {result['transcript_source']}")
    print(f"  monetize mode  : {result['monetize']['mode']}")
    print(f"  payment links  : {len(result['monetize']['payment_links'])} tiers")
    for tier, link in result['monetize']['payment_links'].items():
        print(f"    {tier:20s} -> {link[:70]}{'…' if len(link) > 70 else ''}")
    print(f"  live URL       : {result['deploy']['url']}")
    print(f"  deploy state   : {result['deploy']['ready_state']}")
    kit = result.get("marketing_kit") or {}
    if kit:
        thread = kit.get("twitter_thread", {}).get("tweets", [])
        print(f"  marketing kit  : X thread {len(thread)} tweets, PH + HN + Reddit + LI + {len(kit.get('ads', []))} ads")

    out = Path("e2e_phase2_result.json")
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
