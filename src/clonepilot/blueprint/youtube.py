"""YouTube URL parsing.

Why a dedicated module: URL shapes vary (watch?v=, youtu.be, /shorts/, /embed/,
mobile) and silently truncating an ID is a classic source of "video not found"
errors. Centralize the regex and fail loudly.
"""

from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

# YouTube IDs are 11 chars: [A-Za-z0-9_-]{11}
_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")
_PATH_ID_RE = re.compile(r"/(?:shorts|embed|v|live)/([A-Za-z0-9_-]{11})")


class InvalidYoutubeURL(ValueError):
    """Raised when a URL cannot be resolved to a YouTube video ID."""


def extract_video_id(url: str) -> str:
    """Return the 11-char YouTube video ID for any supported URL shape.

    Raises InvalidYoutubeURL if the URL is not a recognizable YouTube link.
    """
    raw = url.strip()
    if _ID_RE.match(raw):
        # User pasted just the ID.
        return raw

    parsed = urlparse(raw if "://" in raw else f"https://{raw}")
    host = (parsed.hostname or "").lower().removeprefix("www.").removeprefix("m.")

    if host in {"youtu.be"}:
        candidate = parsed.path.strip("/").split("/")[0]
        if _ID_RE.match(candidate):
            return candidate

    if host in {"youtube.com", "music.youtube.com"}:
        # watch?v=ID
        if parsed.path == "/watch":
            v_values = parse_qs(parsed.query).get("v") or []
            if v_values and _ID_RE.match(v_values[0]):
                return v_values[0]
        # /shorts/ID, /embed/ID, /v/ID, /live/ID
        path_match = _PATH_ID_RE.search(parsed.path)
        if path_match:
            return path_match.group(1)

    raise InvalidYoutubeURL(f"Could not extract a YouTube video ID from: {url!r}")
