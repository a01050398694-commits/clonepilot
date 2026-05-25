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

---

## #9 — MUST verify the Resend sender domain OR use `onboarding@resend.dev`

**Rule**: Every Resend `from:` address must be on a domain you have verified in `resend.com/domains` (DNS TXT + DKIM records). Until verified, hardcode `onboarding@resend.dev` — Resend's pre-verified sandbox sender. Never trust a "looks valid" branded address (`noreply@example-unverified.com`) without checking the dashboard.

**Why**: Phase 7 silently dropped every waitlist confirmation email for an hour. The route handlers wrapped `resend.emails.send(...)` in `.catch(() => null)` so the user's signup still returned 200, but Resend itself rejected each call with `403 "<domain> is not verified"`. The user only discovered it by saying "no email arrived." Two failures stacked: an unverified (in fact, non-existent) domain + an over-eager catch.

**Where**: `gallery_site/app/api/upgrade/route.ts` and `gallery_site/app/api/waitlist/route.ts` — both `from` constants are pinned to `onboarding@resend.dev` with a comment pointing back to this rule. If a ClonePilot-specific domain is acquired later, follow `docs/RESEND_DOMAIN_VERIFICATION.md` and switch back to `process.env.LEAD_FROM_EMAIL || "onboarding@resend.dev"`.

**Adjacent lesson**: when calling a third-party API in a route handler, log the failure to console.error before swallowing it — silent catches turn outages into mysteries.

**Update — 2026-05-25 Operator**: investigated the `askbit.co` reference. DNS probe showed `askbit.co` is NXDOMAIN — never registered. The actually-registered `askbit.com` belongs to a separate, unrelated project of the same founder. Conclusion: ClonePilot has no branded sender domain and shouldn't acquire one yet. **Resolution**: stay on `onboarding@resend.dev` permanently while in waitlist mode. Revisit only after a domain (e.g. `clonepilot.dev`, or a subdomain of any owned project) is purchased and pointed at this product. The verification guide at `docs/RESEND_DOMAIN_VERIFICATION.md` is retained as a future-use reference. **Sub-rule for the future**: before adding ANY domain to a third-party sender (Resend, Postmark, SES) or auth provider, first run `Resolve-DnsName <domain> -Type NS -Server 1.1.1.1` and confirm it actually has nameservers — don't trust the local typo.

---

## #10 — MUST set max_tokens generously for multi-section tool_use in CJK languages

**Rule**: When a single Anthropic `tool_use` call asks for two or more sizeable arrays (risks + GTM, headlines + value props, etc.) AND the output may be in Korean / Japanese / Chinese, set `max_tokens` to at least `6000`. Whichever section serializes second in the JSON gets silently truncated to `[]` when the budget runs out.

**Why**: Phase 8.1 first E2E on a Korean transcript returned 6 well-written risks (250 chars each) but `go_to_market_90day: []`. The tool_use envelope is one JSON object — Anthropic emits fields in declaration order, then stops when `max_tokens` is hit mid-value. The validator on Anthropic's side does NOT re-raise on truncation; the partially-emitted JSON is closed off and the tail array becomes empty. CJK tokens cost ~2x ASCII so a 2500-token budget that's fine for English bursts in Korean.

**Where**: `src/clonepilot/analysis/strategy.py` — `max_tokens=6000`. Apply the same generosity to any other multi-section CJK tool_use call (search for `tool_choice` in the analysis package).

---

## #11 — MUST split server-only utilities into `*.server.ts` in Next.js App Router

**Rule**: When a file under `lib/` (or anywhere imported by both server pages and `"use client"` components) imports `node:fs`, `node:path`, or any other Node-only module, split it into two files: a server-safe `lib/foo.server.ts` (with the Node imports) and a client-safe `lib/foo.ts` (types + pure functions only). Then import `lib/foo.server` ONLY from server components / route handlers.

**Why**: Phase 8.4 first dev-server run threw `Module build failed: UnhandledSchemeError: Reading from "node:fs" is not handled by plugins` on `/demo/[slug]` and `/install` (all 500s). Root cause: `lib/report.ts` had both the `DeepAnalysisReport` types AND `loadReport()` (which uses `fs.readFileSync`). The "use client" `ReportViewer.tsx` imported the types from the same file; webpack saw the `node:fs` import in the dep graph and refused to bundle it into the client chunk. Splitting `loadReport` / `listReportSlugs` into `lib/report.server.ts` immediately fixed all three routes.

**Where**: `gallery_site/lib/report.ts` (types + pure utils, client-safe) vs `gallery_site/lib/report.server.ts` (fs-backed loaders). Same pattern for any future loader util — server-only stuff goes in `*.server.ts`.


