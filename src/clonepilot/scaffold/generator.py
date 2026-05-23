"""Materialize a Next.js repo on disk from a BusinessBlueprint.

The output is a complete project that `npm install && npm run build` can ship.
We never call out to npm here — that's the deploy step's job. This stays pure
filesystem so it's fast and deterministic.
"""

from __future__ import annotations

import json
import re
import shutil
from datetime import datetime
from pathlib import Path

from clonepilot.blueprint.schema import BusinessBlueprint
from clonepilot.config import Config
from clonepilot.scaffold import templates as T


def scaffold_repo(
    blueprint: BusinessBlueprint,
    cfg: Config,
    payment_links: dict[str, str] | None = None,
    lead_destination: str | None = None,
) -> Path:
    """Write a working Next.js repo to a fresh dir under workspace.

    Returns the repo path. Overwrites any prior repo with the same slug —
    callers that need history should snapshot the workspace themselves.

    payment_links: optional {tier_name: url} dict. When present, the rendered
    pricing tier cards get Buy buttons pointing to those URLs.

    lead_destination: optional email address. When present, the hero gains an
    email capture form that POSTs to /api/lead, and a Resend-backed route
    forwards each submission to that destination. RESEND_API_KEY must be set
    on the deployed environment for the route to succeed at runtime.
    """
    slug = _slugify(blueprint.name)
    repo_dir = cfg.workspace / f"{slug}-{datetime.now():%Y%m%d-%H%M%S}"
    if repo_dir.exists():
        shutil.rmtree(repo_dir)
    repo_dir.mkdir(parents=True)

    _write(repo_dir / "package.json", T.PACKAGE_JSON.replace("__SLUG__", slug))
    _write(repo_dir / "next.config.mjs", T.NEXT_CONFIG)
    _write(repo_dir / "tsconfig.json", T.TSCONFIG)
    _write(repo_dir / "tailwind.config.ts", T.TAILWIND_CONFIG)
    _write(repo_dir / "postcss.config.mjs", T.POSTCSS_CONFIG)
    _write(repo_dir / ".gitignore", T.GITIGNORE)
    _write(repo_dir / "next-env.d.ts", T.NEXT_ENV_DTS)

    app_dir = repo_dir / "app"
    app_dir.mkdir()
    _write(app_dir / "globals.css", T.GLOBALS_CSS)
    _write(
        app_dir / "layout.tsx",
        _fill(
            T.LAYOUT_TSX,
            {
                "__NAME__": _ts_safe(blueprint.name),
                "__TAGLINE__": _ts_safe(blueprint.tagline),
                "__DESCRIPTION__": _ts_safe(blueprint.solution[:160]),
            },
        ),
    )
    _write(app_dir / "icon.svg", _render_favicon(blueprint.name))

    capture_enabled = bool(lead_destination)
    _write(
        app_dir / "page.tsx",
        _render_page(blueprint, payment_links or {}, capture_enabled),
    )

    if capture_enabled:
        api_dir = app_dir / "api" / "lead"
        api_dir.mkdir(parents=True)
        _write(
            api_dir / "route.ts",
            T.LEAD_API_ROUTE.replace("__NAME__", _ts_safe(blueprint.name)),
        )
        components_dir = repo_dir / "components"
        components_dir.mkdir()
        _write(components_dir / "EmailCaptureForm.tsx", T.EMAIL_FORM_TSX)

    _write(
        repo_dir / "README.md",
        _fill(
            T.README_TMPL,
            {
                "__NAME__": blueprint.name,
                "__TAGLINE__": blueprint.tagline,
                "__VIDEO_TITLE__": blueprint.video.title or "the source video",
                "__VIDEO_URL__": str(blueprint.video.url),
            },
        ),
    )

    # Stash the source blueprint next to the repo for traceability.
    _write(
        repo_dir / "blueprint.json",
        json.dumps(blueprint.model_dump(mode="json"), indent=2, ensure_ascii=False),
    )

    return repo_dir


def _render_page(
    b: BusinessBlueprint,
    payment_links: dict[str, str],
    capture_enabled: bool,
) -> str:
    """Build app/page.tsx with the blueprint baked in as JSX."""
    features_jsx = "\n".join(
        f'            <li className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" /><span>{_ts_safe(f)}</span></li>'
        for f in b.key_features
    )

    tiers_jsx = "\n".join(
        _render_tier(t, payment_links.get(t.name)) for t in b.pricing_tiers
    ) or _no_tiers_jsx()

    cta_secondary = (
        f'<a href="#features" className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold hover:bg-zinc-50">{_ts_safe(b.cta_secondary)}</a>'
        if b.cta_secondary
        else ""
    )

    capture_import = (
        'import { EmailCaptureForm } from "@/components/EmailCaptureForm";\n\n'
        if capture_enabled
        else ""
    )
    capture_block = (
        f'        <EmailCaptureForm ctaLabel="{_ts_safe(b.cta_primary)}" />\n'
        if capture_enabled
        else ""
    )

    return f"""{capture_import}export default function HomePage() {{
  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-600">{_ts_safe(b.name)}</p>
        <h1 className="mx-auto max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
          {_ts_safe(b.tagline)}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-zinc-600">
          {_ts_safe(b.solution)}
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <a href="#pricing" className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-semibold text-white hover:bg-zinc-800">
            {_ts_safe(b.cta_primary)}
          </a>
          {cta_secondary}
        </div>
{capture_block}      </section>

      <section id="features" className="border-y border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">For {_ts_safe(b.target_audience)}</p>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight sm:text-4xl">
            {_ts_safe(b.problem)}
          </h2>
          <ul className="mx-auto mt-12 grid max-w-3xl gap-4 text-base text-zinc-700">
{features_jsx}
          </ul>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-600">
          {_ts_safe(b.differentiation)}
        </p>
        <div className="mt-12 grid gap-6 md:grid-cols-{max(1, len(b.pricing_tiers) or 1)}">
{tiers_jsx}
        </div>
      </section>

      <footer className="border-t border-zinc-200 py-10 text-center text-sm text-zinc-500">
        <p>Built with ClonePilot from <a className="underline" href="{b.video.url}">this video</a>.</p>
      </footer>
    </main>
  );
}}
"""


def _render_tier(tier, payment_url: str | None) -> str:
    bullets = "\n".join(
        f'              <li className="flex items-start gap-2"><span className="text-emerald-500">+</span><span>{_ts_safe(f)}</span></li>'
        for f in tier.features
    )
    price = f"${int(tier.price_usd)}" if tier.price_usd > 0 else "Free"
    period = "/mo" if tier.price_usd > 0 else ""
    if payment_url:
        cta = (
            f'            <a href="{payment_url}" target="_blank" rel="noopener"'
            f' className="mt-6 block w-full rounded-lg bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-zinc-800">'
            f'Buy {_ts_safe(tier.name)}</a>'
        )
    elif tier.price_usd <= 0:
        cta = (
            '            <a href="#features"'
            ' className="mt-6 block w-full rounded-lg border border-zinc-300 px-4 py-3 text-center text-sm font-semibold hover:bg-zinc-50">'
            'Get started</a>'
        )
    else:
        cta = ""

    return f"""          <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
            <h3 className="text-lg font-semibold">{_ts_safe(tier.name)}</h3>
            <p className="mt-2 text-4xl font-bold">{price}<span className="text-base font-medium text-zinc-500">{period}</span></p>
            <ul className="mt-6 space-y-2 text-sm text-zinc-700 flex-1">
{bullets}
            </ul>
{cta}
          </div>"""


def _no_tiers_jsx() -> str:
    return """          <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm md:col-span-1">
            <p className="text-zinc-600">Pricing TBD — contact for details.</p>
          </div>"""


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or "clonepilot-site"


def _ts_safe(value: str) -> str:
    """Escape characters that would break out of a JSX text/string literal."""
    if not value:
        return ""
    return (
        value.replace("\\", "\\\\")
        .replace("{", "&#123;")
        .replace("}", "&#125;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def _fill(template: str, mapping: dict[str, str]) -> str:
    out = template
    for k, v in mapping.items():
        out = out.replace(k, v)
    return out


def _write(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def _render_favicon(name: str) -> str:
    """Generate a 32x32 SVG favicon: first letter on a brand-derived color.

    Why: Next.js 15 auto-serves app/icon.svg as the site favicon (no
    <link rel="icon"> needed). Beats the missing-favicon 404 every site gets,
    keeps generation deterministic per brand name.
    """
    letter = (name or "?").strip()[:1].upper()
    if not letter.isalnum():
        letter = "?"

    # Deterministic hue from the brand name → distinct color per product.
    seed = sum(ord(c) for c in name) if name else 0
    hue = seed % 360
    bg = f"hsl({hue}, 75%, 40%)"

    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
        f'<rect width="32" height="32" rx="7" fill="{bg}"/>'
        '<text x="16" y="22" text-anchor="middle" '
        'font-family="-apple-system,Segoe UI,Inter,system-ui,sans-serif" '
        f'font-size="20" font-weight="700" fill="white">{letter}</text>'
        '</svg>\n'
    )
