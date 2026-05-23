"""MCP tool: monetize(blueprint) → payment links per pricing tier."""

from __future__ import annotations

from clonepilot.blueprint.schema import BusinessBlueprint
from clonepilot.config import Config
from clonepilot.monetize import MonetizeMode, create_payment_links
from clonepilot.server import mcp


@mcp.tool()
def monetize(blueprint: dict) -> dict:
    """Generate Stripe payment links for every paid tier in the blueprint.

    Pass the `blueprint` returned by `analyze`. Requires `STRIPE_SECRET_KEY`
    in env for real links; without it, the tool returns PREVIEW placeholder
    links so the rest of the pipeline (scaffold + deploy) still demos
    end-to-end. The returned `payment_links` dict can be passed straight to
    `scaffold(blueprint, payment_links=...)` to bake Buy buttons into the page.
    """
    cfg = Config.load()
    bp = BusinessBlueprint.model_validate(blueprint)
    links = create_payment_links(bp, cfg.stripe_secret_key)

    mode = links[0].mode if links else (
        MonetizeMode.LIVE if cfg.stripe_secret_key and cfg.stripe_secret_key.startswith("sk_live_")
        else MonetizeMode.TEST if cfg.stripe_secret_key
        else MonetizeMode.PREVIEW
    )

    return {
        "mode": mode.value,
        "payment_links": {l.tier_name: l.url for l in links},
        "details": [
            {
                "tier_name": l.tier_name,
                "url": l.url,
                "stripe_price_id": l.stripe_price_id,
                "stripe_product_id": l.stripe_product_id,
            }
            for l in links
        ],
        "warning": (
            "PREVIEW mode — links point to example.com placeholders. "
            "Set STRIPE_SECRET_KEY to generate real Stripe Payment Links."
            if mode == MonetizeMode.PREVIEW
            else ""
        ),
    }
