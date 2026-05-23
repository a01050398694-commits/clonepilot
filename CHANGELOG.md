# Changelog

All notable changes to ClonePilot. Format follows [Keep a Changelog](https://keepachangelog.com/), versions follow [SemVer](https://semver.org/).

## [0.1.0] — 2026-05-24

First public release. Built across five same-day phases.

### Added — MCP tools (7)
- `version()` — health check.
- `analyze(youtube_url)` — pulls transcript (free `youtube-transcript-api` with Supadata fallback), pipes it through Claude with `tool_use` to produce a typed `BusinessBlueprint` (target, problem, solution, features, pricing tiers, channels, differentiation, tech stack).
- `monetize(blueprint)` — generates Stripe Product + Price + Payment Link per paid tier. Falls back to PREVIEW links when `STRIPE_SECRET_KEY` is missing so the pipeline still demos end-to-end.
- `scaffold(blueprint, payment_links?, lead_destination?)` — generates a Next.js 15 + Tailwind landing page. Optionally bakes Stripe Buy buttons and a Resend-backed email capture form.
- `deploy(repo_path, env_vars?)` — pushes the repo to Vercel via REST API v13. Auto-creates the project, pushes any required env vars, disables SSO protection on first deploy, polls until READY.
- `marketing_kit(blueprint, live_url?)` — Claude-generated launch bundle: X thread, Product Hunt, Show HN, Reddit, LinkedIn, ad creatives.
- `attach_domain(project_name, domain)` — Vercel Domains API. Returns DNS instructions if not yet verified.
- `oneshot(youtube_url, lead_destination?)` — the full pipeline in one call.

### Added — landing-page features baked in by `scaffold`
- Hero with brand label, tagline, dual CTAs.
- Pricing section with up to N tiers, each with optional Buy button.
- Email capture form + `/api/lead` Resend route (opt-in via `lead_destination`).
- Vercel Analytics auto-wired.
- Auto-generated `app/icon.svg` favicon (brand letter on hash-derived hue).

### Distribution
- Public GitHub repo: <https://github.com/a01050398694-commits/clonepilot>.
- Install today via `uvx --from git+https://github.com/a01050398694-commits/clonepilot clonepilot`.
- `smithery.yaml` + `Dockerfile` shipped for Smithery container-runtime publish (one-click OAuth).
- `.github/workflows/publish.yml` ready to auto-publish to PyPI on tag push once `PYPI_API_TOKEN` repo secret is set.

### Verified
- Phase 1 E2E: YouTube URL → live landing in ~2 min.
- Phase 2 E2E: + Stripe preview links + marketing kit.
- Phase 3 E2E: + Resend email capture (form submission delivered an actual lead end-to-end) + Vercel Analytics tracking.
- Phase 4 E2E: zero console errors, working favicon, public repo, ready-to-publish Smithery manifest.

### Known limits
- Stripe `monetize` requires the user's own `STRIPE_SECRET_KEY` for real links — PREVIEW mode otherwise.
- Smithery + PyPI publish require a one-time browser OAuth / email verification (documented, not bypassable).
- Generated sites are single-page; multi-page (Pricing / FAQ / About routes) is on the roadmap.
