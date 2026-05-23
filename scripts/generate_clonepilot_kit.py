"""Generate ClonePilot's OWN marketing kit using ClonePilot's marketing engine.

The blueprint here is hand-written to describe ClonePilot itself — there's no
YouTube video for the product yet. We feed it through the same
generate_marketing_kit() that ships to end users, so launch copy comes from the
exact prompt indie hackers see.

Output: clonepilot_marketing_kit.json (used by docs/MARKETING.md).
"""

from __future__ import annotations

import json
from pathlib import Path

from clonepilot.blueprint.schema import BusinessBlueprint, PricingTier, VideoSource
from clonepilot.config import Config
from clonepilot.marketing import generate_marketing_kit


def build_blueprint() -> BusinessBlueprint:
    return BusinessBlueprint(
        name="ClonePilot",
        tagline="A YouTube URL in. A deployed MVP out. From inside Claude.",
        target_audience="Indie hackers and solo founders who use Claude Code, Claude Desktop, Cursor, or Codex and want to ship faster than they can type a prompt.",
        problem="App builders like bolt.new and v0 still make you type the prompt. Indie hackers learn about businesses by watching YouTube — but turning that inspiration into a working clone takes a weekend even with AI tools.",
        solution="ClonePilot is an MCP server with 7 tools. Paste a YouTube business URL — analyze pulls the transcript and asks Claude to distill a typed BusinessBlueprint, monetize creates Stripe Payment Links per tier, scaffold generates a Next.js landing page with Buy buttons and Resend email capture baked in, deploy ships it to Vercel and returns the live URL, marketing_kit writes the launch copy. Or call oneshot to do all of it in one tool call.",
        key_features=[
            "Works inside Claude Code, Desktop, Cursor, and Codex",
            "Single oneshot tool: URL in, live URL out in ~2 min",
            "Stripe Payment Links auto-generated per tier",
            "Resend-backed email capture form, opt-in",
            "Launch kit: X / Show HN / Product Hunt / Reddit / LinkedIn / ads",
            "Auto-favicon, Vercel Analytics, SSO protection auto-disabled",
        ],
        pricing_model="free",
        pricing_tiers=[
            PricingTier(
                name="Open Source",
                price_usd=0,
                features=[
                    "All 7 MCP tools",
                    "Install: uvx --from git+github.com/.../clonepilot",
                    "Bring your own Anthropic + Vercel keys",
                ],
            )
        ],
        channels=[
            "Smithery MCP registry",
            "Show HN",
            "X / Twitter indie hacker thread",
            "Product Hunt",
            "Reddit r/sideproject and r/SaaS",
            "Awesome-MCP-Servers GitHub list",
        ],
        tech_stack=[
            "Python 3.11+ (FastMCP)",
            "Anthropic Claude Sonnet 4.6 (analyze + marketing_kit)",
            "Stripe (monetize)",
            "Vercel REST API (deploy)",
            "Resend (email capture)",
            "Next.js 15 + Tailwind (generated landing)",
        ],
        differentiation="v0, bolt.new, and Lovable make you type the prompt. ClonePilot watches the YouTube video for you, then ships the MVP without you leaving Claude.",
        cta_primary="Install via uvx",
        cta_secondary="See the live demo",
        social_proof_hint="Generated landing demo deployed in 2 minutes from a real Korean YouTube interview (https://blogflow-nine.vercel.app), with working Stripe-style buttons, working email capture, and zero hand-coded JSX.",
        video=VideoSource(
            url="https://github.com/a01050398694-commits/clonepilot",  # repo as the canonical source
            video_id="clonepilot",
        ),
    )


def main() -> int:
    cfg = Config.load()
    bp = build_blueprint()
    live_url = "https://github.com/a01050398694-commits/clonepilot"
    kit = generate_marketing_kit(bp, cfg, live_url=live_url)

    out = Path("clonepilot_marketing_kit.json")
    out.write_text(
        json.dumps(kit.model_dump(mode="json"), indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {out.resolve()}")
    print(f"  tweets        : {len(kit.twitter_thread.tweets)}")
    print(f"  PH tagline    : {kit.product_hunt.tagline}")
    print(f"  HN title      : {kit.hacker_news.title}")
    print(f"  Reddit sub    : {kit.reddit.subreddit}")
    print(f"  ad creatives  : {len(kit.ads)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
