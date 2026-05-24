"""Free-tier deploy quota + paid-license validation.

Decision: this module never *blocks* analyze() or scaffold() — those are local,
cheap, and have unbounded value as exploration tools. We gate only deploy()
because deploy() is the one tool that (a) costs us tokens, (b) burns through
the user's Vercel quota, and (c) produces the irreversible "live URL" artifact
that the buyer is actually paying for.

Two tiers:

* No `CLONEPILOT_LICENSE_KEY` (Free):
  Track deploys in `~/.clonepilot/usage.json` per calendar month.
  Allow 1 successful deploy per month. After that, raise LicenseExhaustedError
  with an upgrade URL.

* `CLONEPILOT_LICENSE_KEY` set (Pro / Lifetime):
  POST it to `<gallery>/api/license/verify`. Cache the answer for 1 hour in
  `~/.clonepilot/license_cache.json` so we don't hammer the endpoint.
  Tiers returned by the gallery: 'pro' or 'lifetime'. Both unlock unlimited.

We deliberately do not phone-home for usage tracking on the Free tier — the
counter is local-only, can be reset by deleting the file, and is documented as
honor-system. Anyone reverse-engineering it can self-host the open-source MCP
for free anyway; the value of Pro is the hosted convenience, not the gate.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import httpx

DEFAULT_GALLERY = "https://clonepilot-gallery.vercel.app"
FREE_DEPLOYS_PER_MONTH = 1
LICENSE_CACHE_TTL_SEC = 60 * 60  # 1 hour


class LicenseError(RuntimeError):
    """Raised when the license check itself fails (network, malformed)."""


class LicenseExhaustedError(RuntimeError):
    """Raised when free-tier quota is exhausted. Carries an upgrade URL."""

    def __init__(self, used: int, limit: int, upgrade_url: str) -> None:
        super().__init__(
            f"Free tier exhausted ({used}/{limit} deploys this month). "
            f"Upgrade for unlimited at {upgrade_url}"
        )
        self.used = used
        self.limit = limit
        self.upgrade_url = upgrade_url


@dataclass(frozen=True)
class LicenseStatus:
    tier: str  # 'free' | 'pro' | 'lifetime'
    valid: bool
    email: str | None
    deploys_used_this_month: int
    deploys_remaining_this_month: int | None  # None = unlimited
    upgrade_url: str
    cached_at: float


def _state_dir() -> Path:
    workspace = os.getenv("CLONEPILOT_WORKSPACE", "").strip()
    base = Path(workspace) if workspace else Path.home() / ".clonepilot"
    base.mkdir(parents=True, exist_ok=True)
    return base


def _gallery_url() -> str:
    return os.getenv("CLONEPILOT_GALLERY_URL", DEFAULT_GALLERY).rstrip("/")


def _upgrade_url() -> str:
    return f"{_gallery_url()}/pricing?utm_source=mcp_exhausted"


def _current_month_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _load_usage() -> dict:
    p = _state_dir() / "usage.json"
    if not p.exists():
        return {"month": _current_month_key(), "deploys": []}
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        data = {"month": _current_month_key(), "deploys": []}
    if data.get("month") != _current_month_key():
        # Roll over on new month.
        data = {"month": _current_month_key(), "deploys": []}
    return data


def _save_usage(data: dict) -> None:
    p = _state_dir() / "usage.json"
    p.write_text(json.dumps(data, indent=2), encoding="utf-8")


def record_deploy(live_url: str | None) -> None:
    """Append one entry to this month's usage. Call AFTER a successful deploy."""
    data = _load_usage()
    data["deploys"].append(
        {
            "ts": datetime.now(timezone.utc).isoformat(),
            "url": live_url or "?",
        }
    )
    _save_usage(data)


def _validate_paid_license(key: str) -> LicenseStatus | None:
    """Hit the gallery API. Returns None on transient failures (network down)."""
    cache_path = _state_dir() / "license_cache.json"
    if cache_path.exists():
        try:
            cached = json.loads(cache_path.read_text(encoding="utf-8"))
            if (
                cached.get("key") == key
                and time.time() - cached.get("cached_at", 0) < LICENSE_CACHE_TTL_SEC
            ):
                return LicenseStatus(
                    tier=cached["tier"],
                    valid=cached["valid"],
                    email=cached.get("email"),
                    deploys_used_this_month=cached.get("deploys_used_this_month", 0),
                    deploys_remaining_this_month=None,
                    upgrade_url=_upgrade_url(),
                    cached_at=cached["cached_at"],
                )
        except Exception:
            pass

    try:
        r = httpx.post(
            f"{_gallery_url()}/api/license/verify",
            json={"key": key},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
    except Exception:
        # On network failure: be lenient — let the user through if they had a
        # valid cache anytime (graceful degradation). Otherwise None.
        if cache_path.exists():
            try:
                cached = json.loads(cache_path.read_text(encoding="utf-8"))
                if cached.get("key") == key and cached.get("valid"):
                    return LicenseStatus(
                        tier=cached["tier"],
                        valid=True,
                        email=cached.get("email"),
                        deploys_used_this_month=0,
                        deploys_remaining_this_month=None,
                        upgrade_url=_upgrade_url(),
                        cached_at=cached.get("cached_at", time.time()),
                    )
            except Exception:
                pass
        return None

    if not data.get("valid"):
        return LicenseStatus(
            tier="free",
            valid=False,
            email=None,
            deploys_used_this_month=0,
            deploys_remaining_this_month=FREE_DEPLOYS_PER_MONTH,
            upgrade_url=_upgrade_url(),
            cached_at=time.time(),
        )

    cached_entry = {
        "key": key,
        "valid": True,
        "tier": data.get("tier", "pro"),
        "email": data.get("email"),
        "cached_at": time.time(),
    }
    try:
        cache_path.write_text(json.dumps(cached_entry, indent=2), encoding="utf-8")
    except Exception:
        pass

    return LicenseStatus(
        tier=cached_entry["tier"],
        valid=True,
        email=cached_entry["email"],
        deploys_used_this_month=0,
        deploys_remaining_this_month=None,
        upgrade_url=_upgrade_url(),
        cached_at=cached_entry["cached_at"],
    )


def check_deploy_allowed() -> LicenseStatus:
    """Call BEFORE invoking a deploy. Raises LicenseExhaustedError if blocked.

    Pro / Lifetime keys: always allowed.
    Free tier: 1 deploy/month based on local usage.json.
    """
    key = os.getenv("CLONEPILOT_LICENSE_KEY", "").strip()
    if key:
        status = _validate_paid_license(key)
        if status and status.valid:
            return status
        # Invalid or unreachable key falls through to free-tier behaviour
        # instead of hard-locking the user out.

    usage = _load_usage()
    used = len(usage["deploys"])
    if used >= FREE_DEPLOYS_PER_MONTH:
        raise LicenseExhaustedError(
            used=used,
            limit=FREE_DEPLOYS_PER_MONTH,
            upgrade_url=_upgrade_url(),
        )
    return LicenseStatus(
        tier="free",
        valid=True,
        email=None,
        deploys_used_this_month=used,
        deploys_remaining_this_month=FREE_DEPLOYS_PER_MONTH - used,
        upgrade_url=_upgrade_url(),
        cached_at=time.time(),
    )
