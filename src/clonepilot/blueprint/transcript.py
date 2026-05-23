"""Transcript fetching with graceful fallback.

Strategy: try the free `youtube-transcript-api` first (no key, no quota), then
fall back to Supadata if available. We never swallow errors silently — if both
paths fail, the caller gets a TranscriptError with all attempted reasons.
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx

from clonepilot.config import Config


class TranscriptError(RuntimeError):
    """Raised when no transcript provider could return text for a video."""


@dataclass(frozen=True)
class Transcript:
    text: str
    language: str
    source: str  # "youtube-transcript-api" | "supadata"


def fetch_transcript(video_id: str, cfg: Config) -> Transcript:
    attempts: list[str] = []

    try:
        return _fetch_via_youtube_transcript_api(video_id)
    except Exception as exc:  # noqa: BLE001 — third party raises many subclasses
        attempts.append(f"youtube-transcript-api: {exc}")

    if cfg.supadata_api_key:
        try:
            return _fetch_via_supadata(video_id, cfg.supadata_api_key)
        except Exception as exc:  # noqa: BLE001
            attempts.append(f"supadata: {exc}")
    else:
        attempts.append("supadata: SUPADATA_API_KEY not set, skipped")

    raise TranscriptError(
        "No transcript provider returned text. Attempts:\n  - "
        + "\n  - ".join(attempts)
    )


def _fetch_via_youtube_transcript_api(video_id: str) -> Transcript:
    """Free path. Works for most public videos with auto- or manual subs."""
    from youtube_transcript_api import YouTubeTranscriptApi

    api = YouTubeTranscriptApi()
    fetched = api.fetch(video_id, languages=["en", "ko", "ja", "es", "fr", "de"])
    snippets = fetched.snippets
    if not snippets:
        raise RuntimeError("empty transcript")
    text = "\n".join(s.text for s in snippets if s.text)
    return Transcript(text=text, language=fetched.language_code, source="youtube-transcript-api")


def _fetch_via_supadata(video_id: str, api_key: str) -> Transcript:
    """Paid fallback. Better at multilingual + videos with no auto-subs.

    Docs: https://supadata.ai/docs (POST /v1/youtube/transcript).
    """
    response = httpx.get(
        "https://api.supadata.ai/v1/youtube/transcript",
        params={"videoId": video_id, "text": "true"},
        headers={"x-api-key": api_key},
        timeout=30.0,
    )
    if response.status_code != 200:
        raise RuntimeError(f"HTTP {response.status_code}: {response.text[:200]}")
    payload = response.json()
    text = payload.get("content") or payload.get("text") or ""
    if not text:
        raise RuntimeError("empty 'content' field in supadata response")
    return Transcript(
        text=text,
        language=payload.get("lang", "unknown"),
        source="supadata",
    )
