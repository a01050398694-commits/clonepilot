"""Ahrefs Keywords Explorer adapter (HTTP, fail-soft).

Why HTTP, not an SDK: Ahrefs publishes v3 REST endpoints that are stable and
the official Python SDK is heavy. We call only the two endpoints we need:
  - keywords-explorer/overview          → volume, KD, CPC per seed keyword
  - keywords-explorer/volume-by-country → geo split for the primary seed

Fail-soft: if AHREFS_API_KEY is unset OR any request errors, return None.
The orchestrator will mark data_quality.fallbacks_used and degrade
confidence_0_100 accordingly — never crash the pipeline.

Endpoint docs: https://docs.ahrefs.com/api/v3
"""

from __future__ import annotations

from dataclasses import dataclass

import httpx

from clonepilot.analysis.schema import GeoShare, KeywordVolume

_BASE = "https://api.ahrefs.com/v3"


@dataclass(frozen=True)
class AhrefsResult:
    keywords: list[KeywordVolume]
    geo_distribution: list[GeoShare]
    global_monthly_searches: int | None


def fetch_keywords(
    api_key: str | None,
    seed_keywords: list[str],
    primary_keyword: str | None = None,
    country: str = "us",
    timeout_sec: float = 20.0,
) -> AhrefsResult | None:
    """Pull volume/KD/CPC for up to 10 seeds + geo split for the primary seed.

    `primary_keyword` defaults to the first seed. `country` is the localization
    used for the overview query — geo-by-country sums across all countries.
    """
    if not api_key or not seed_keywords:
        return None

    primary = primary_keyword or seed_keywords[0]
    seeds = list(dict.fromkeys(seed_keywords))[:10]  # de-dupe, cap at 10

    try:
        with httpx.Client(
            base_url=_BASE,
            headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
            timeout=timeout_sec,
        ) as client:
            overview = _overview(client, seeds, country)
            geo = _volume_by_country(client, primary)
    except httpx.HTTPError:
        return None
    except Exception:  # noqa: BLE001 — defensive; any shape becomes a soft-fail
        return None

    # Sum volume across geo as the global signal. If geo call failed, fall back
    # to overview's primary-keyword volume as a single-country approximation.
    global_searches = sum(g.monthly_searches or 0 for g in geo) if geo else None
    if not global_searches and overview:
        for kw in overview:
            if kw.keyword.lower() == primary.lower() and kw.volume:
                global_searches = kw.volume
                break

    return AhrefsResult(
        keywords=overview,
        geo_distribution=geo,
        global_monthly_searches=global_searches if global_searches else None,
    )


def _overview(client: httpx.Client, seeds: list[str], country: str) -> list[KeywordVolume]:
    """POST keywords-explorer/overview — Ahrefs v3 expects a JSON body."""
    payload = {
        "country": country,
        "keywords": seeds,
        "select": "keyword,volume,difficulty,cpc",
    }
    resp = client.post("/keywords-explorer/overview", json=payload)
    if resp.status_code != 200:
        return []
    rows = resp.json().get("keywords", [])
    out: list[KeywordVolume] = []
    for row in rows:
        keyword = row.get("keyword")
        if not keyword:
            continue
        out.append(
            KeywordVolume(
                keyword=keyword,
                volume=int(row.get("volume") or 0),
                kd=_float_or_none(row.get("difficulty")),
                cpc_usd=_float_or_none(row.get("cpc")),
            )
        )
    return out


def _volume_by_country(client: httpx.Client, keyword: str) -> list[GeoShare]:
    payload = {"keyword": keyword, "select": "country,volume"}
    resp = client.post("/keywords-explorer/volume-by-country", json=payload)
    if resp.status_code != 200:
        return []
    rows = resp.json().get("countries", [])
    if not rows:
        return []

    total = sum(int(r.get("volume") or 0) for r in rows)
    if total <= 0:
        return []

    geos: list[GeoShare] = []
    for r in rows:
        iso = (r.get("country") or "").upper()
        volume = int(r.get("volume") or 0)
        if not iso or volume <= 0:
            continue
        geos.append(
            GeoShare(
                country=iso,
                share_pct=round(volume / total * 100, 2),
                monthly_searches=volume,
            )
        )
    geos.sort(key=lambda g: g.share_pct, reverse=True)
    return geos[:15]


def _float_or_none(v) -> float | None:
    if v is None:
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
