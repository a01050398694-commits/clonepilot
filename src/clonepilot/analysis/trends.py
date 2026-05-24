"""Google Trends adapter via pytrends.

Why pytrends: free, no API key, gives 60-month interest_over_time and per-
country interest_by_region. We use both to compute a trend_score_0_100 and
infer rising/stable/declining.

Caveats handled:
- pytrends scrapes the unofficial Trends front-end. It rate-limits and 429s.
  Every call is wrapped in try/except and returns None on any failure so the
  pipeline keeps moving.
- "Interest" is a 0–100 RELATIVE index, not absolute search volume. We never
  pretend otherwise; absolute volume comes from Ahrefs.
"""

from __future__ import annotations

from dataclasses import dataclass

from clonepilot.analysis.schema import GeoShare, TrendDirection

# pytrends imports happen lazily inside fetch_trends() so a missing package
# (or a transient ImportError on Windows) degrades to None instead of crashing
# every consumer that just `import`s this module.


@dataclass(frozen=True)
class TrendsResult:
    direction: TrendDirection
    score_0_100: int
    geo_distribution: list[GeoShare]


def fetch_trends(
    keyword: str,
    timeframe: str = "today 5-y",
    timeout_sec: float = 15.0,
) -> TrendsResult | None:
    """Fetch interest_over_time + interest_by_region for one keyword.

    Returns None on any error — caller is expected to log it under
    data_quality.fallbacks_used.
    """
    try:
        from pytrends.request import TrendReq
    except ImportError:
        return None

    try:
        pytrends = TrendReq(hl="en-US", tz=0, timeout=(timeout_sec, timeout_sec))
        pytrends.build_payload([keyword], cat=0, timeframe=timeframe, geo="", gprop="")

        iot = pytrends.interest_over_time()
        direction, score = _summarize_trend(iot, keyword)

        geo_dist = _geo_distribution(pytrends, keyword)
        return TrendsResult(direction=direction, score_0_100=score, geo_distribution=geo_dist)
    except Exception:  # noqa: BLE001 — pytrends raises many shapes (429, JSON, network)
        return None


def _summarize_trend(iot, keyword: str) -> tuple[TrendDirection, int]:
    """Convert interest_over_time DataFrame to (direction, 0-100 score).

    Score = mean of last 12 months (relative interest 0-100) blended with slope sign.
    """
    if iot is None or iot.empty or keyword not in iot.columns:
        return ("unknown", 50)

    series = iot[keyword].astype(float)
    if len(series) < 6:
        return ("unknown", int(series.mean()) if len(series) else 50)

    recent = series.tail(12)
    prior = series.head(max(1, len(series) - 12))
    recent_avg = float(recent.mean())
    prior_avg = float(prior.mean()) if len(prior) else recent_avg

    delta = recent_avg - prior_avg
    direction: TrendDirection
    if delta > 5:
        direction = "rising"
    elif delta < -5:
        direction = "declining"
    else:
        direction = "stable"

    # Compose score: half-weight the recent absolute interest, half-weight the slope.
    slope_component = max(-50, min(50, delta * 2))
    score = int(max(0, min(100, recent_avg * 0.5 + 50 + slope_component * 0.5)))
    return (direction, score)


def _geo_distribution(pytrends, keyword: str) -> list[GeoShare]:
    try:
        ibr = pytrends.interest_by_region(resolution="COUNTRY", inc_low_vol=False)
    except Exception:  # noqa: BLE001
        return []
    if ibr is None or ibr.empty or keyword not in ibr.columns:
        return []

    series = ibr[keyword].astype(float)
    series = series[series > 0]
    if series.empty:
        return []

    # Normalize to share_pct that sums to 100 across the top entries we keep.
    top = series.sort_values(ascending=False).head(10)
    total = float(top.sum())
    if total <= 0:
        return []

    out: list[GeoShare] = []
    for country_name, value in top.items():
        iso = _country_name_to_iso2(str(country_name))
        if not iso:
            continue
        share = float(value) / total * 100
        out.append(GeoShare(country=iso, share_pct=round(share, 2)))
    return out


# Small built-in name→ISO2 map keeps us from pulling pycountry just for the top
# 30 Trends countries. Unknown names are simply dropped from geo_distribution.
_NAME_TO_ISO2: dict[str, str] = {
    "United States": "US",
    "United Kingdom": "GB",
    "India": "IN",
    "Canada": "CA",
    "Australia": "AU",
    "Germany": "DE",
    "France": "FR",
    "Brazil": "BR",
    "Japan": "JP",
    "South Korea": "KR",
    "China": "CN",
    "Spain": "ES",
    "Mexico": "MX",
    "Italy": "IT",
    "Netherlands": "NL",
    "Singapore": "SG",
    "Philippines": "PH",
    "Indonesia": "ID",
    "Russia": "RU",
    "Poland": "PL",
    "Turkey": "TR",
    "Argentina": "AR",
    "South Africa": "ZA",
    "Nigeria": "NG",
    "Vietnam": "VN",
    "Thailand": "TH",
    "Sweden": "SE",
    "Norway": "NO",
    "Denmark": "DK",
    "Finland": "FI",
    "Ireland": "IE",
    "New Zealand": "NZ",
    "Saudi Arabia": "SA",
    "United Arab Emirates": "AE",
    "Israel": "IL",
    "Egypt": "EG",
    "Pakistan": "PK",
    "Bangladesh": "BD",
    "Malaysia": "MY",
    "Hong Kong": "HK",
    "Taiwan": "TW",
    "Switzerland": "CH",
    "Austria": "AT",
    "Belgium": "BE",
    "Portugal": "PT",
    "Greece": "GR",
    "Romania": "RO",
    "Czechia": "CZ",
    "Hungary": "HU",
    "Ukraine": "UA",
}


def _country_name_to_iso2(name: str) -> str | None:
    return _NAME_TO_ISO2.get(name)
