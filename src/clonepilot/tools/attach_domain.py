"""MCP tool: attach_domain(project_name, domain) → DNS instructions."""

from __future__ import annotations

import httpx

from clonepilot.config import Config
from clonepilot.server import mcp

API_BASE = "https://api.vercel.com"


@mcp.tool()
def attach_domain(project_name: str, domain: str) -> dict:
    """Attach a custom domain to a Vercel project and return any DNS steps.

    project_name: slug used during deploy (e.g. the lowercased blueprint name).
    domain: bare domain like "trycoffeebot.com" — no scheme, no trailing slash.

    If the domain is already registered with this Vercel account or its
    nameservers point at Vercel, the attach completes immediately and HTTPS
    starts provisioning. Otherwise the response includes the DNS records the
    user must add at their registrar.
    """
    cfg = Config.load()
    token = cfg.require_vercel()

    bare = domain.strip().lower().replace("https://", "").replace("http://", "").rstrip("/")
    if not bare or "." not in bare or " " in bare:
        raise ValueError(f"domain looks malformed: {domain!r}")

    headers = {"Authorization": f"Bearer {token}"}
    params = {"teamId": cfg.vercel_team_id} if cfg.vercel_team_id else None

    resp = httpx.post(
        f"{API_BASE}/v10/projects/{project_name}/domains",
        headers=headers,
        params=params,
        json={"name": bare},
        timeout=30.0,
    )
    if resp.status_code in {200, 201}:
        body = resp.json()
        return _summarize(body, bare)

    if resp.status_code == 409:
        # Already attached. Fetch its current state.
        get = httpx.get(
            f"{API_BASE}/v9/projects/{project_name}/domains/{bare}",
            headers=headers,
            params=params,
            timeout=30.0,
        )
        if get.status_code == 200:
            return _summarize(get.json(), bare, already_attached=True)
        return {
            "domain": bare,
            "already_attached": True,
            "note": "Already attached to this project; details fetch failed.",
        }

    raise RuntimeError(
        f"Vercel attach_domain failed: {resp.status_code} {resp.text[:400]}"
    )


def _summarize(body: dict, bare: str, already_attached: bool = False) -> dict:
    verified = body.get("verified", False)
    verification = body.get("verification") or []
    return {
        "domain": bare,
        "already_attached": already_attached,
        "verified": verified,
        "live_url": f"https://{bare}" if verified else None,
        "dns_records_required": [
            {
                "type": v.get("type"),
                "name": v.get("domain"),
                "value": v.get("value"),
                "reason": v.get("reason"),
            }
            for v in verification
        ],
        "next_step": (
            f"Live now at https://{bare}"
            if verified
            else "Add the DNS record(s) above at your registrar, then call attach_domain again to re-check."
        ),
    }
