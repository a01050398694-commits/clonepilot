"""End-to-end Phase 1 test: URL → blueprint → repo → live URL.

Run via: uv run python scripts/e2e.py <youtube_url>
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from clonepilot.tools.analyze import analyze
from clonepilot.tools.deploy import deploy
from clonepilot.tools.scaffold import scaffold


def main() -> int:
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=L9LfsOR1YHw"
    print(f"\n[1/3] analyze({url!r}) ...", flush=True)
    analyzed = analyze(url)
    bp = analyzed["blueprint"]
    print(f"  name      : {bp['name']}")
    print(f"  tagline   : {bp['tagline']}")
    print(f"  transcript: {analyzed['transcript_chars']} chars via {analyzed['transcript_source']}")

    print("\n[2/3] scaffold(blueprint) ...", flush=True)
    scaffolded = scaffold(bp)
    print(f"  repo_path : {scaffolded['repo_path']}")
    print(f"  files     : {len(scaffolded['files_created'])}")

    print("\n[3/3] deploy(repo_path) ...", flush=True)
    deployed = deploy(scaffolded["repo_path"], project_name=bp["name"].lower())
    print(f"  url       : {deployed['url']}")
    print(f"  state     : {deployed['ready_state']}")
    print(f"  files     : {deployed['files_uploaded']}")
    print(f"  bytes     : {deployed['bytes_uploaded']}")

    # Persist for later inspection
    out = Path("e2e_result.json")
    out.write_text(
        json.dumps(
            {"analyzed": analyzed, "scaffolded": scaffolded, "deployed": deployed},
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"\nWrote {out.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
