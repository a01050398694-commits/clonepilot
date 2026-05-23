"""MCP tool: oneshot(youtube_url) → full bundle in one call."""

from __future__ import annotations

from pathlib import Path

from clonepilot.blueprint.extractor import extract_blueprint
from clonepilot.blueprint.schema import BusinessBlueprint, VideoSource
from clonepilot.blueprint.transcript import fetch_transcript
from clonepilot.blueprint.youtube import extract_video_id
from clonepilot.config import Config
from clonepilot.deploy import deploy_to_vercel
from clonepilot.marketing import generate_marketing_kit
from clonepilot.monetize import create_payment_links
from clonepilot.scaffold import scaffold_repo
from clonepilot.server import mcp
from clonepilot.tools.analyze import _fetch_video_meta


@mcp.tool()
def oneshot(
    youtube_url: str,
    lead_destination: str | None = None,
    skip_marketing: bool = False,
) -> dict:
    """The end-to-end ClonePilot flow in a single call.

    Pipeline: analyze → monetize → scaffold (with payment links + optional
    email capture baked in) → deploy (with required env vars pushed) →
    marketing_kit (with the live URL).

    lead_destination (optional): email that receives every lead. Enables the
    email capture form + Resend route. RESEND_API_KEY must be set on the
    ClonePilot server env; we forward it into the deployed Vercel project.

    Set `skip_marketing=True` to skip the final Claude call if you only need
    the deployed page.
    """
    cfg = Config.load()

    video_id = extract_video_id(youtube_url)
    canonical_url = f"https://www.youtube.com/watch?v={video_id}"

    transcript = fetch_transcript(video_id, cfg)
    video_meta: VideoSource = _fetch_video_meta(video_id, canonical_url)
    blueprint: BusinessBlueprint = extract_blueprint(
        transcript_text=transcript.text, video=video_meta, cfg=cfg
    )

    links = create_payment_links(blueprint, cfg.stripe_secret_key)
    payment_links_map = {l.tier_name: l.url for l in links}

    repo_dir: Path = scaffold_repo(
        blueprint,
        cfg,
        payment_links=payment_links_map,
        lead_destination=lead_destination,
    )

    project_name = "".join(
        c if c.isalnum() or c == "-" else "-" for c in blueprint.name.lower()
    ).strip("-")[:52] or "clonepilot-site"

    env_vars: dict[str, str] = {}
    if lead_destination:
        env_vars["LEAD_DESTINATION"] = lead_destination
        if cfg.resend_api_key:
            env_vars["RESEND_API_KEY"] = cfg.resend_api_key
        if cfg.resend_from_email:
            env_vars["LEAD_FROM_EMAIL"] = cfg.resend_from_email

    deployed = deploy_to_vercel(
        repo_dir=repo_dir,
        project_name=project_name,
        token=cfg.require_vercel(),
        team_id=cfg.vercel_team_id,
        env_vars=env_vars or None,
    )

    kit_payload = None
    kit_error = None
    if not skip_marketing:
        try:
            kit_payload = generate_marketing_kit(
                blueprint, cfg, live_url=deployed.url
            ).model_dump(mode="json")
        except Exception as exc:  # noqa: BLE001 — kit is best-effort
            kit_error = f"{type(exc).__name__}: {exc}"

    return {
        "blueprint": blueprint.model_dump(mode="json"),
        "transcript_source": transcript.source,
        "monetize": {
            "mode": links[0].mode.value if links else "preview",
            "payment_links": payment_links_map,
        },
        "repo_path": str(repo_dir),
        "deploy": {
            "url": deployed.url,
            "deployment_id": deployed.deployment_id,
            "ready_state": deployed.ready_state,
        },
        "marketing_kit": kit_payload,
        "marketing_kit_error": kit_error,
    }
