"""Runtime configuration loaded from environment variables.

Why: a single typed source of truth for every tool, so individual tool modules
never reach into os.environ directly and never fail silently on a missing key.
"""

from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


class ConfigError(RuntimeError):
    """Raised when a required env var is missing or malformed."""


@dataclass(frozen=True)
class Config:
    anthropic_api_key: str | None
    supadata_api_key: str | None
    vercel_token: str | None
    vercel_team_id: str | None
    youtube_api_key: str | None
    stripe_secret_key: str | None
    resend_api_key: str | None
    resend_from_email: str | None
    workspace: Path
    model_blueprint: str
    model_copy: str

    def require_anthropic(self) -> str:
        """Return Anthropic key or raise — call from tools that actually need Claude."""
        if not self.anthropic_api_key:
            raise ConfigError(
                "ANTHROPIC_API_KEY is required for this tool. Set it in your MCP server env block."
            )
        return self.anthropic_api_key

    def require_vercel(self) -> str:
        if not self.vercel_token:
            raise ConfigError(
                "VERCEL_TOKEN is required for deploy. Generate one at https://vercel.com/account/tokens."
            )
        return self.vercel_token

    @classmethod
    def load(cls) -> "Config":
        workspace_raw = os.getenv("CLONEPILOT_WORKSPACE", "").strip()
        workspace = (
            Path(workspace_raw).expanduser().resolve()
            if workspace_raw
            else Path(tempfile.gettempdir()) / "clonepilot"
        )
        workspace.mkdir(parents=True, exist_ok=True)

        return cls(
            anthropic_api_key=_clean(os.getenv("ANTHROPIC_API_KEY")),
            supadata_api_key=_clean(os.getenv("SUPADATA_API_KEY")),
            vercel_token=_clean(os.getenv("VERCEL_TOKEN")),
            vercel_team_id=_clean(os.getenv("VERCEL_TEAM_ID")),
            youtube_api_key=_clean(os.getenv("YOUTUBE_API_KEY")),
            stripe_secret_key=_clean(os.getenv("STRIPE_SECRET_KEY")),
            resend_api_key=_clean(os.getenv("RESEND_API_KEY")),
            resend_from_email=_clean(os.getenv("RESEND_FROM_EMAIL")),
            workspace=workspace,
            model_blueprint=os.getenv(
                "CLONEPILOT_MODEL_BLUEPRINT", "claude-sonnet-4-6"
            ).strip(),
            model_copy=os.getenv(
                "CLONEPILOT_MODEL_COPY", "claude-sonnet-4-6"
            ).strip(),
        )


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
