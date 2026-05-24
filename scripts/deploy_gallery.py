"""Deploy the gallery_site/ Next.js app to Vercel.

Wraps clonepilot's deploy_to_vercel helper. Idempotent: re-running just creates
a new deployment under the same project name.

Run: `uv run python scripts/deploy_gallery.py`
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from clonepilot.config import Config
from clonepilot.deploy import deploy_to_vercel

PROJECT_NAME = "clonepilot-gallery"
SRC = Path("gallery_site")
DST_PUBLIC_GALLERY = SRC / "public" / "gallery.json"
ROOT_GALLERY = Path("gallery.json")


def main() -> int:
    if not SRC.exists():
        print(f"FATAL: {SRC} not found", file=sys.stderr)
        return 1

    # Always sync the latest gallery.json into the site's public/ before deploy.
    if ROOT_GALLERY.exists():
        shutil.copy2(ROOT_GALLERY, DST_PUBLIC_GALLERY)
        print(f"synced {ROOT_GALLERY} -> {DST_PUBLIC_GALLERY}")

    cfg = Config.load()
    env_vars = {}
    if cfg.resend_api_key:
        env_vars["RESEND_API_KEY"] = cfg.resend_api_key
    if cfg.resend_from_email:
        env_vars["LEAD_FROM_EMAIL"] = cfg.resend_from_email
    import os
    if lead := os.getenv("LEAD_DESTINATION", "").strip():
        env_vars["LEAD_DESTINATION"] = lead

    print(f"deploying {SRC} as project {PROJECT_NAME!r} ...", flush=True)
    result = deploy_to_vercel(
        repo_dir=SRC,
        project_name=PROJECT_NAME,
        token=cfg.require_vercel(),
        team_id=cfg.vercel_team_id,
        env_vars=env_vars or None,
    )
    print()
    print(f"  URL          : {result.url}")
    print(f"  state        : {result.ready_state}")
    print(f"  files        : {result.file_count}")
    print(f"  bytes        : {result.bytes_uploaded}")
    print(f"  deployment_id: {result.deployment_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
