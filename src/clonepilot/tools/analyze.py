"""MCP tool: analyze(youtube_url) → BusinessBlueprint."""

from __future__ import annotations

import httpx

from clonepilot.blueprint.extractor import extract_blueprint
from clonepilot.blueprint.schema import BusinessBlueprint, VideoSource
from clonepilot.blueprint.transcript import fetch_transcript
from clonepilot.blueprint.youtube import extract_video_id
from clonepilot.config import Config
from clonepilot.server import mcp


@mcp.tool()
def analyze(youtube_url: str) -> dict:
    """Extract a BusinessBlueprint from a YouTube business video.

    Pass any standard YouTube URL (watch, youtu.be, shorts, embed). The tool
    fetches the transcript, then asks Claude to distill it into a structured
    blueprint with target audience, problem, solution, features, pricing,
    channels, and differentiation. The returned blueprint is the input for
    `scaffold` and `deploy`.
    """
    cfg = Config.load()
    video_id = extract_video_id(youtube_url)
    canonical_url = f"https://www.youtube.com/watch?v={video_id}"

    transcript = fetch_transcript(video_id, cfg)
    video_meta = _fetch_video_meta(video_id, canonical_url)

    blueprint: BusinessBlueprint = extract_blueprint(
        transcript_text=transcript.text,
        video=video_meta,
        cfg=cfg,
    )
    return {
        "blueprint": blueprint.model_dump(mode="json"),
        "transcript_source": transcript.source,
        "transcript_chars": len(transcript.text),
    }


def _fetch_video_meta(video_id: str, canonical_url: str) -> VideoSource:
    """Pull title + channel via YouTube's public oEmbed endpoint (no key).

    oEmbed is rate-friendly and works for any public video. We fail soft —
    if the endpoint is unreachable, return the URL/ID only.
    """
    try:
        response = httpx.get(
            "https://www.youtube.com/oembed",
            params={"url": canonical_url, "format": "json"},
            timeout=10.0,
        )
        if response.status_code == 200:
            data = response.json()
            return VideoSource(
                url=canonical_url,
                video_id=video_id,
                title=data.get("title"),
                channel=data.get("author_name"),
            )
    except httpx.HTTPError:
        pass
    return VideoSource(url=canonical_url, video_id=video_id)
