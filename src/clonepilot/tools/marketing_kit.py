"""MCP tool: marketing_kit(blueprint, live_url?) → launch copy bundle."""

from __future__ import annotations

from clonepilot.blueprint.schema import BusinessBlueprint
from clonepilot.config import Config
from clonepilot.marketing import generate_marketing_kit
from clonepilot.server import mcp


@mcp.tool()
def marketing_kit(blueprint: dict, live_url: str | None = None) -> dict:
    """Generate a launch-ready copy bundle: X thread, Product Hunt, Show HN, Reddit, LinkedIn, 3 ad creatives.

    Pass the `blueprint` returned by `analyze`. Optionally pass the `live_url`
    returned by `deploy` so the model embeds it in CTAs (otherwise it leaves
    `{{URL}}` placeholders).

    Returns a JSON document the user can paste channel-by-channel on launch day.
    """
    cfg = Config.load()
    bp = BusinessBlueprint.model_validate(blueprint)
    kit = generate_marketing_kit(bp, cfg, live_url=live_url)
    return kit.model_dump(mode="json")
