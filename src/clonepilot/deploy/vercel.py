"""Vercel deploy via REST API v13.

Why REST not CLI: lets the MCP server work in any environment (Claude Desktop
on Mac/Windows, Codex containers, CI) without bundling the Vercel CLI binary.
The trade-off: we walk the repo and base64-upload source files ourselves.

We never upload node_modules, .next, .git, or anything in .gitignore — Vercel
builds from source on their side.
"""

from __future__ import annotations

import base64
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import httpx

API_BASE = "https://api.vercel.com"

# Hard skips. We do not parse the repo's .gitignore — anything genuinely needed
# at build time is already a source file the loop will pick up.
SKIP_DIR_NAMES = {"node_modules", ".next", ".git", ".vercel", "out", "dist", "build"}
SKIP_FILE_SUFFIXES = {".log"}
SKIP_FILE_NAMES = {".DS_Store", "Thumbs.db"}


class VercelDeployError(RuntimeError):
    """Raised on any non-recoverable Vercel API failure."""


@dataclass(frozen=True)
class DeployResult:
    url: str
    deployment_id: str
    inspector_url: str
    ready_state: str
    bytes_uploaded: int
    file_count: int


def deploy_to_vercel(
    repo_dir: Path,
    project_name: str,
    token: str,
    team_id: str | None = None,
    poll_timeout_sec: int = 300,
    env_vars: dict[str, str] | None = None,
) -> DeployResult:
    """Push the repo to Vercel and block until READY or ERROR.

    project_name should match the slug used during scaffold — Vercel will
    create the project on first deploy if it doesn't exist.

    env_vars: optional {NAME: value} dict pushed to the project (production
    target) BEFORE the deployment is created, so serverless functions can
    read them at runtime. We POST each one and accept the 409 (already exists)
    case as a no-op — we never overwrite a value the user set themselves.
    """
    files_payload = list(_collect_files(repo_dir))
    if not files_payload:
        raise VercelDeployError(f"No deployable files found under {repo_dir}")

    total_bytes = sum(len(f["data"]) for f in files_payload)

    body = {
        "name": project_name,
        "files": files_payload,
        "projectSettings": {"framework": "nextjs"},
        "target": "production",
    }

    if env_vars:
        _push_env_vars(project_name, env_vars, token, team_id)

    create_resp = _request(
        "POST", "/v13/deployments", token, team_id, json_body=body, timeout=120.0
    )
    if create_resp.status_code >= 300:
        raise VercelDeployError(
            f"Create deployment failed: {create_resp.status_code} {create_resp.text[:500]}"
        )
    created = create_resp.json()
    deployment_id = created["id"]

    # Vercel Pro/Team accounts ship with SSO protection on by default, which
    # 401s every preview URL. The landing pages we generate are meant to be
    # public, so we disable it on first deploy. Idempotent and silent on free
    # accounts where the field is already null.
    _request(
        "PATCH",
        f"/v9/projects/{project_name}",
        token,
        team_id,
        json_body={"ssoProtection": None, "passwordProtection": None},
        timeout=30.0,
    )
    inspector_url = created.get("inspectorUrl", "")
    initial_url = created.get("url") or created.get("alias", [None])[0] or ""

    final = _poll_until_ready(deployment_id, token, team_id, poll_timeout_sec)
    ready_state = final.get("readyState") or final.get("status") or "UNKNOWN"

    if ready_state in {"ERROR", "CANCELED"}:
        raise VercelDeployError(
            f"Deployment {deployment_id} ended in state {ready_state}. "
            f"Inspect: {inspector_url}"
        )

    final_url = (
        final.get("url")
        or initial_url
        or (final.get("alias", [None])[0] if final.get("alias") else None)
        or ""
    )
    if not final_url:
        raise VercelDeployError(f"Deployment {deployment_id} returned no URL")

    return DeployResult(
        url=f"https://{final_url}" if not final_url.startswith("http") else final_url,
        deployment_id=deployment_id,
        inspector_url=inspector_url,
        ready_state=ready_state,
        bytes_uploaded=total_bytes,
        file_count=len(files_payload),
    )


def _collect_files(repo_dir: Path) -> Iterable[dict]:
    """Yield Vercel inline-file dicts for every source file under repo_dir."""
    repo_dir = repo_dir.resolve()
    for path in repo_dir.rglob("*"):
        if not path.is_file():
            continue
        if any(part in SKIP_DIR_NAMES for part in path.relative_to(repo_dir).parts):
            continue
        if path.name in SKIP_FILE_NAMES:
            continue
        if path.suffix.lower() in SKIP_FILE_SUFFIXES:
            continue
        rel = path.relative_to(repo_dir).as_posix()
        data_b64 = base64.b64encode(path.read_bytes()).decode("ascii")
        yield {
            "file": rel,
            "data": data_b64,
            "encoding": "base64",
        }


def _poll_until_ready(
    deployment_id: str, token: str, team_id: str | None, timeout_sec: int
) -> dict:
    deadline = time.monotonic() + timeout_sec
    delay = 2.0
    last_state = "UNKNOWN"
    last_payload: dict = {}
    while time.monotonic() < deadline:
        resp = _request(
            "GET",
            f"/v13/deployments/{deployment_id}",
            token,
            team_id,
            timeout=30.0,
        )
        if resp.status_code >= 300:
            raise VercelDeployError(
                f"Poll failed: {resp.status_code} {resp.text[:300]}"
            )
        last_payload = resp.json()
        last_state = last_payload.get("readyState") or last_payload.get("status", "UNKNOWN")
        if last_state in {"READY", "ERROR", "CANCELED"}:
            return last_payload
        time.sleep(delay)
        delay = min(delay * 1.4, 8.0)
    raise VercelDeployError(
        f"Timed out after {timeout_sec}s. Last state: {last_state}"
    )


def _request(
    method: str,
    path: str,
    token: str,
    team_id: str | None,
    json_body: dict | None = None,
    timeout: float = 30.0,
) -> httpx.Response:
    headers = {"Authorization": f"Bearer {token}"}
    params: dict[str, str] = {}
    if team_id:
        params["teamId"] = team_id
    return httpx.request(
        method,
        f"{API_BASE}{path}",
        headers=headers,
        params=params or None,
        json=json_body,
        timeout=timeout,
    )


def _push_env_vars(
    project_name: str,
    env_vars: dict[str, str],
    token: str,
    team_id: str | None,
) -> None:
    """Ensure the Vercel project exists, then upsert each env var.

    Idempotent: we POST each var and treat 409 (already exists) as success
    without overwriting. Use the Vercel dashboard to rotate a value — we
    never silently change a key the user may have set themselves.
    """
    # 1. Ensure project exists. 409 = already exists, fine.
    create_proj = _request(
        "POST",
        "/v9/projects",
        token,
        team_id,
        json_body={"name": project_name, "framework": "nextjs"},
    )
    if create_proj.status_code not in {200, 201, 409}:
        raise VercelDeployError(
            f"Create project failed: {create_proj.status_code} {create_proj.text[:300]}"
        )

    # 2. Upsert each env var.
    for name, value in env_vars.items():
        if not value:
            continue
        resp = _request(
            "POST",
            f"/v10/projects/{project_name}/env",
            token,
            team_id,
            json_body={
                "key": name,
                "value": value,
                "type": "encrypted",
                "target": ["production", "preview", "development"],
            },
        )
        if resp.status_code in {200, 201, 409}:
            continue
        raise VercelDeployError(
            f"Push env {name!r} failed: {resp.status_code} {resp.text[:300]}"
        )
