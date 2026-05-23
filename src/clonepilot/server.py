"""FastMCP server entry point.

Why a thin entry: each tool lives in its own module under `tools/` so they can
be tested and iterated independently. This file just wires them into MCP.
"""

from __future__ import annotations

from fastmcp import FastMCP

from clonepilot import __version__
from clonepilot.config import Config, ConfigError

mcp = FastMCP(
    name="ClonePilot",
    instructions=(
        "Turn a YouTube business video into a deployed MVP. "
        "Call analyze(url) first to extract a BusinessBlueprint, then "
        "scaffold(blueprint) to generate a Next.js repo, then deploy(repo_path) "
        "to push it live on Vercel."
    ),
)


@mcp.tool()
def version() -> dict:
    """Return ClonePilot version and a quick health check of required env vars."""
    cfg = Config.load()
    return {
        "version": __version__,
        "env_status": {
            "anthropic": bool(cfg.anthropic_api_key),
            "supadata": bool(cfg.supadata_api_key),
            "vercel": bool(cfg.vercel_token),
        },
    }


def _register_tools() -> None:
    """Import tool modules so their @mcp.tool() decorators run.

    Why lazy: keeps cold-start fast and lets `version()` work even if a tool
    module has an optional dependency that's missing.
    """
    from clonepilot.tools import (  # noqa: F401
        analyze,
        attach_domain,
        deploy,
        marketing_kit,
        monetize,
        oneshot,
        scaffold,
    )


def main() -> None:
    _register_tools()
    mcp.run()


if __name__ == "__main__":
    main()
