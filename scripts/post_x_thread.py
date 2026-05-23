"""Post the ClonePilot launch thread to X with defensive cleanup.

Loads tweets from clonepilot_marketing_kit.json. Posts them as a single reply
chain. If any tweet after the first fails, deletes everything posted so far
to avoid leaving a dangling fragment on the user's timeline.

Env required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET.
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import tweepy


def _client() -> tweepy.Client:
    return tweepy.Client(
        consumer_key=os.environ["X_API_KEY"],
        consumer_secret=os.environ["X_API_SECRET"],
        access_token=os.environ["X_ACCESS_TOKEN"],
        access_token_secret=os.environ["X_ACCESS_SECRET"],
        wait_on_rate_limit=False,
    )


def _delete_all(client: tweepy.Client, ids: list[str]) -> None:
    for tid in reversed(ids):
        try:
            client.delete_tweet(tid)
            print(f"  rolled back tweet {tid}", flush=True)
        except Exception as exc:  # noqa: BLE001
            print(f"  WARN: could not delete {tid}: {exc}", flush=True)


TWEETS: list[str] = [
    # 1 — hook (171)
    "bolt.new and v0 still make you type the prompt. ClonePilot doesn't. "
    "Paste a YouTube URL inside Claude — get a deployed MVP with Stripe + "
    "email capture in ~2 min.",
    # 2 — how (260)
    "How it works:\n\n"
    "1/ Paste a YouTube biz URL\n"
    "2/ analyze: transcript → BusinessBlueprint via Claude\n"
    "3/ monetize: Stripe Payment Links per tier\n"
    "4/ scaffold: Next.js + Buy buttons + Resend email capture\n"
    "5/ deploy: live Vercel URL\n\n"
    "Or `oneshot` does all 5 in one call.",
    # 3 — proof (208)
    "Tested it on a real Korean YouTube interview about a SaaS business.\n\n"
    "2 minutes later: https://blogflow-nine.vercel.app\n\n"
    "Working Stripe-style buttons. Working email capture. Zero hand-coded JSX. "
    "I never left Claude.",
    # 4 — positioning (262)
    "ClonePilot is an MCP server — 7 tools. Lives inside Claude Code, Claude "
    "Desktop, Cursor, or Codex. No new tab. No new app. No new mental model.\n\n"
    "You already use Claude to build. This removes the part where you do the "
    "research and write the brief.",
    # 5 — CTA (212)
    "Free + open source. Bring your own Anthropic + Vercel keys.\n\n"
    "Install in one line:\n"
    "uvx --from git+https://github.com/a01050398694-commits/clonepilot\n\n"
    "Repo + star + issues:\n"
    "https://github.com/a01050398694-commits/clonepilot",
]


def main() -> int:
    tweets = TWEETS
    if not tweets:
        print("No tweets to post", file=sys.stderr)
        return 1
    # Defensive pre-check before any network call.
    for i, t in enumerate(tweets, 1):
        if len(t) > 280:
            print(f"FATAL pre-check: tweet {i} = {len(t)} chars (max 280)")
            return 2

    client = _client()
    posted: list[str] = []
    in_reply_to: str | None = None

    for i, text in enumerate(tweets, 1):
        if len(text) > 280:
            print(f"FATAL: tweet {i} exceeds 280 chars ({len(text)}). Aborting.")
            _delete_all(client, posted)
            return 2
        try:
            kwargs: dict = {"text": text}
            if in_reply_to:
                kwargs["in_reply_to_tweet_id"] = in_reply_to
            resp = client.create_tweet(**kwargs)
            tid = str(resp.data["id"])
            posted.append(tid)
            in_reply_to = tid
            print(f"  posted tweet {i}/{len(tweets)} → id {tid}", flush=True)
            time.sleep(2)
        except tweepy.errors.TweepyException as exc:
            print(f"FATAL on tweet {i}: {exc}")
            print("Rolling back...")
            _delete_all(client, posted)
            return 3

    first_id = posted[0]
    print()
    print(f"Thread head: https://x.com/i/web/status/{first_id}")
    Path("x_thread_result.json").write_text(
        json.dumps(
            {"posted_ids": posted, "thread_url": f"https://x.com/i/web/status/{first_id}"},
            indent=2,
        ),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
