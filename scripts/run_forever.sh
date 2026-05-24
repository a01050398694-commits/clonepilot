#!/usr/bin/env bash
# ClonePilot — 24/7 auto-demo loop launcher (bash version).
#
# Picks one un-processed URL every 3h, generates a demo, posts one tweet.
# Run via:  nohup bash scripts/run_forever.sh > auto_loop.stdout 2>&1 &
set -u
INTERVAL=$((3 * 60 * 60))  # 3 hours = 8/day = ~240/mo (X-safe)
cd "$(dirname "$0")/.."
echo "ClonePilot auto-loop started. interval=${INTERVAL}s pid=$$"
while true; do
  echo "[$(date -u +%FT%TZ)] starting cycle"
  uv run python scripts/auto_demo_loop.py || echo "cycle failed: $?"
  echo "[$(date -u +%FT%TZ)] cycle done, sleeping ${INTERVAL}s"
  sleep "$INTERVAL"
done
