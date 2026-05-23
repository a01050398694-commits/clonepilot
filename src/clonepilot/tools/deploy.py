"""MCP tool: deploy(repo_path) → live URL."""

from __future__ import annotations

from pathlib import Path

from clonepilot.config import Config
from clonepilot.deploy import deploy_to_vercel
from clonepilot.server import mcp


@mcp.tool()
def deploy(
    repo_path: str,
    project_name: str | None = None,
    env_vars: dict[str, str] | None = None,
) -> dict:
    """Deploy a scaffolded repo to Vercel and return the live URL.

    Pass the `repo_path` returned by `scaffold`. The first deploy creates the
    Vercel project under the token's owner; subsequent deploys to the same
    `project_name` update it.

    env_vars (optional): pushed to the project before the deployment runs.
    Idempotent — existing values are not overwritten. Use this for runtime
    secrets like RESEND_API_KEY that the deployed serverless routes need.

    Requires `VERCEL_TOKEN` in env. Generate one at
    https://vercel.com/account/tokens (scope: Full Account).
    """
    cfg = Config.load()
    token = cfg.require_vercel()

    repo_dir = Path(repo_path).expanduser().resolve()
    if not repo_dir.is_dir():
        raise FileNotFoundError(f"repo_path is not a directory: {repo_path}")

    name = (project_name or repo_dir.name).lower()
    # Vercel project slugs allow only lowercase, digits, and hyphens.
    name = "".join(c if c.isalnum() or c == "-" else "-" for c in name).strip("-")[:52]

    result = deploy_to_vercel(
        repo_dir=repo_dir,
        project_name=name,
        token=token,
        team_id=cfg.vercel_team_id,
        env_vars=env_vars,
    )
    return {
        "url": result.url,
        "deployment_id": result.deployment_id,
        "inspector_url": result.inspector_url,
        "ready_state": result.ready_state,
        "files_uploaded": result.file_count,
        "bytes_uploaded": result.bytes_uploaded,
        "env_vars_pushed": sorted((env_vars or {}).keys()),
    }
