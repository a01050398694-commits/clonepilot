"""One-click Smithery publish helper.

Run: `uv run python scripts/publish_smithery.py`

What it does:
  1. Kicks off `smithery auth login --json`, extracts the auth_url, and prints it
     in big letters. You click once in your browser, approve, done.
  2. Polls `smithery auth whoami` until the CLI sees the new session (~30s).
  3. Runs `smithery mcp publish` against this repo's smithery.yaml.

After the first run, the CLI session is cached locally — future publishes are a
single `smithery mcp publish` with no browser step.

Why a wrapper at all: the Smithery CLI's interactive flow opens a browser tab
and then sits in a TTY spinner. This script makes the flow obvious for users
who paste the wrapper command into a terminal that isn't a TTY (CI, Claude
Code, agent shell) and would otherwise see no actionable output.
"""

from __future__ import annotations

import json
import subprocess
import sys
import time

REPO_URL = "https://github.com/a01050398694-commits/clonepilot"
SERVER_NAME = "askbit/clonepilot"
SMITHERY = ["npx", "-y", "@smithery/cli@latest"]
POLL_INTERVAL_SEC = 3
POLL_DEADLINE_SEC = 180


def _run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def _already_logged_in() -> bool:
    result = _run([*SMITHERY, "auth", "whoami", "--json"])
    if result.returncode != 0:
        return False
    try:
        data = json.loads(result.stdout.strip().splitlines()[-1])
    except (json.JSONDecodeError, IndexError):
        return False
    return bool(data.get("email") or data.get("user") or data.get("id"))


def _kickoff_login() -> str:
    """Return the auth URL the user must visit once."""
    result = _run([*SMITHERY, "auth", "login", "--json"], input="")
    for line in (result.stdout or "").splitlines():
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError:
            continue
        url = payload.get("auth_url")
        if url:
            return url
    raise RuntimeError(
        f"Could not parse auth_url from smithery output.\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
    )


def _wait_for_login() -> None:
    deadline = time.monotonic() + POLL_DEADLINE_SEC
    while time.monotonic() < deadline:
        if _already_logged_in():
            return
        time.sleep(POLL_INTERVAL_SEC)
    raise TimeoutError(
        f"Did not see successful login within {POLL_DEADLINE_SEC}s. "
        "Re-run the script after authorizing in the browser."
    )


def _publish() -> int:
    print("\n→ Publishing to Smithery as", SERVER_NAME, flush=True)
    result = subprocess.run(
        [*SMITHERY, "mcp", "publish", REPO_URL, "-n", SERVER_NAME],
        text=True,
    )
    return result.returncode


def main() -> int:
    if _already_logged_in():
        print("✓ Smithery CLI already authenticated. Skipping login.", flush=True)
    else:
        url = _kickoff_login()
        print("=" * 70)
        print("OPEN THIS URL IN YOUR BROWSER AND CLICK 'AUTHORIZE':")
        print()
        print("  ", url)
        print()
        print("Waiting for the browser approval to come back…")
        print("=" * 70)
        _wait_for_login()
        print("✓ Smithery session active.")

    return _publish()


if __name__ == "__main__":
    sys.exit(main())
