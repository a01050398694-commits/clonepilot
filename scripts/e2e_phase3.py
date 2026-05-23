"""End-to-end Phase 3 test: oneshot with email capture + analytics.

Run via: uv run python scripts/e2e_phase3.py <youtube_url>
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from clonepilot.tools.oneshot import oneshot

LEAD = os.getenv("CLONEPILOT_DEMO_LEAD", "a01050398694@gmail.com")


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=L9LfsOR1YHw"
    print(f"\n=== oneshot({url!r}, lead_destination={LEAD!r}) ===\n", flush=True)
    result = oneshot(url, lead_destination=LEAD, skip_marketing=True)

    bp = result["blueprint"]
    print(f"  name           : {bp['name']}")
    print(f"  monetize mode  : {result['monetize']['mode']}")
    print(f"  payment links  : {len(result['monetize']['payment_links'])} tiers")
    print(f"  live URL       : {result['deploy']['url']}")
    print(f"  deploy state   : {result['deploy']['ready_state']}")

    out = Path("e2e_phase3_result.json")
    out.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nWrote {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
