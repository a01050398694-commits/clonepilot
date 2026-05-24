# GOTCHAS — ClonePilot

> Append-only. Every entry is a MUST / MUST NOT rule born from a real incident.
> Format: rule → **Why** (the incident) → **Where** (file or system that enforces it).

---

## #1 — MUST keep the generated Next.js template on a patched Next version

**Rule**: Bump `src/clonepilot/scaffold/templates.py::PACKAGE_JSON` to the latest patched `15.x.y` whenever Vercel rejects builds on the current pin.

**Why**: Phase 1 first deploy failed at the READY stage even though `next build` had succeeded — Vercel's deploy pipeline blocks builds against Next.js versions with known CVEs (CVE-2025-66478 in 15.5.0 was the trigger). The log said "Vulnerable version of Next.js detected, please update immediately."

**Where**: `src/clonepilot/scaffold/templates.py` — single source of truth for template deps.

---

## #2 — MUST disable Vercel SSO protection on every newly-created project

**Rule**: After `POST /v13/deployments` succeeds for the first time, immediately `PATCH /v9/projects/{name}` with `{"ssoProtection": null, "passwordProtection": null}`. Don't make the user discover the 401 themselves.

**Why**: Vercel Pro/Team accounts default new projects to "Protect all preview deployments with Vercel Authentication". The generated landing pages are meant to be public — without this PATCH, every preview URL returns 401 and the demo looks broken.

**Where**: `src/clonepilot/deploy/vercel.py::deploy_to_vercel` runs the disable after deployment creation.

---

## #3 — MUST NOT impose `max_length` on Claude tool_use string fields meant for marketing copy

**Rule**: When using `tool_use` to coerce structured output, use `Field(description=...)` to guide length and platform caps, but do not constrain with `max_length`. The model treats the description as soft guidance and the validator as a hard fail.

**Why**: Phase 2 first run failed `MarketingKit.model_validate()` six times — Claude generated reasonable copy lengths but overshot arbitrary `max_length=60/80/100/120` caps by a handful of characters. Six retries cost both money and latency.

**Where**: `src/clonepilot/marketing/kit.py` — every string field uses `description=` to communicate platform limits ("PH tagline. Aim for <= 60 chars.") without enforcing them.

---

## #4 — MUST treat marketing_kit as best-effort inside `oneshot`

**Rule**: When orchestrating a multi-step pipeline whose final step is generative (LLM, image, embedding), wrap it in `try/except` and surface a `*_error` field in the response. Never let a generative failure throw away the user-facing artifacts from earlier deterministic steps.

**Why**: In Phase 2, a `MarketingKit` validation crash killed the whole `oneshot` exit code, hiding the deploy URL that had already succeeded. The user thought the deploy had failed too.

**Where**: `src/clonepilot/tools/oneshot.py` — final marketing_kit call sits inside `try/except`; `marketing_kit_error: str | None` is part of the return contract.

---

## #5 — MUST `POST /v9/projects` before pushing env vars to a brand-new Vercel project

**Rule**: When you need env vars available BEFORE the first deployment runs (e.g. for serverless routes), explicitly create the project first via `POST /v9/projects` with `{"name", "framework"}`. Accept 409 (already exists) as success.

**Why**: Vercel auto-creates projects on first deploy, but env-var POSTs to a non-existent project name silently fail (or return ambiguous errors). Set up the project shell first, then upsert env, then deploy.

**Where**: `src/clonepilot/deploy/vercel.py::_push_env_vars` does the create-or-409 dance before any env POST.

---

## #6 — MUST generate an `app/icon.svg` in every Next.js scaffold

**Rule**: Every generated repo writes a deterministic SVG to `app/icon.svg`. Next.js 15 picks it up automatically as the favicon — no `<link rel="icon">` needed.

**Why**: Without this, every deployed clone has a missing-favicon 404 in the console. Cheap to fix, expensive to leave as the very first console error every user sees.

**Where**: `src/clonepilot/scaffold/generator.py::_render_favicon` produces a 32x32 SVG with the brand's first letter on a hash-derived hue.

---

## #7 — MUST NOT promise to automate OAuth or email-verification signups

**Rule**: Smithery, PyPI, GitHub, Vercel, Stripe — every gatekeeper that gives you publish or billing rights is intentionally behind a browser OAuth flow or an email-verified signup. An AI agent's contribution stops at "surface the auth URL"; the click itself is the user's. Document the one-click flow; never claim it as "automated."

**Why**: Phase 4 spent agent time trying to bypass Smithery's OAuth. There is no bypass — the consent screen is the whole product. Same shape for PyPI (email verify), GitHub fine-grained tokens (browser confirm), and Stripe (KYC).

**Where**: `docs/SMITHERY.md` and `docs/INSTALL.md` both describe the precise one-click flow and the cached-session payoff.

---

## #8 — MUST treat Vercel 400 ENV_CONFLICT as success when upserting env vars

**Rule**: In `_push_env_vars`, accept `400` with `ENV_CONFLICT` in the body as a no-op alongside the 409 case. Don't blow up a deploy because a key already exists.

**Why**: Vercel inconsistently returns either 409 or 400-with-ENV_CONFLICT when you POST an env var that already exists. The original code only handled 409, so any re-deploy of a project that already had the env var failed at the env-push step. The deploy itself doesn't actually need to overwrite — we never want to silently change a user-set value.

**Where**: `src/clonepilot/deploy/vercel.py::_push_env_vars` — the 400-with-ENV_CONFLICT branch sits next to the 409 branch.

