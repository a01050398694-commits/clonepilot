"""MCP tool: scaffold(blueprint) → repo path."""

from __future__ import annotations

from clonepilot.blueprint.schema import BusinessBlueprint
from clonepilot.config import Config
from clonepilot.scaffold import scaffold_repo
from clonepilot.server import mcp


@mcp.tool()
def scaffold(
    blueprint: dict,
    payment_links: dict[str, str] | None = None,
    lead_destination: str | None = None,
) -> dict:
    """Generate a deployable Next.js 15 + Tailwind landing repo from a BusinessBlueprint.

    Pass the `blueprint` object returned by `analyze`. The tool writes a fresh
    Next.js project to a workspace directory (under $CLONEPILOT_WORKSPACE or
    the OS temp dir) with all configs, layout, page, and a README. The page
    renders hero, features, pricing, and CTA pulled directly from the blueprint.

    payment_links (optional): {tier_name: url} dict from `monetize`. When
    supplied, each pricing tier card gets a Buy button pointing to that link.

    lead_destination (optional): email address that should receive each lead.
    When set, the hero gets an email capture form and a Resend-backed
    /api/lead route. Requires RESEND_API_KEY on the deployed environment.

    Returns the absolute repo path — feed it to `deploy(repo_path)`.
    """
    bp = BusinessBlueprint.model_validate(blueprint)
    cfg = Config.load()
    repo_dir = scaffold_repo(
        bp,
        cfg,
        payment_links=payment_links,
        lead_destination=lead_destination,
    )
    return {
        "repo_path": str(repo_dir),
        "name": bp.name,
        "files_created": sorted(p.name for p in repo_dir.iterdir()),
        "payment_links_wired": bool(payment_links),
        "lead_capture_enabled": bool(lead_destination),
    }
