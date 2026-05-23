"""Typed representation of a business idea extracted from a YouTube video.

Why pydantic: downstream tools (scaffold, deploy) need a stable contract.
Treat BusinessBlueprint as the canonical artifact of `analyze` — every other
tool reads it without re-parsing free-form text.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

PricingModel = Literal["free", "freemium", "subscription", "one_time", "marketplace"]


class PricingTier(BaseModel):
    name: str = Field(description="Tier label e.g. 'Free', 'Pro', 'Team'.")
    price_usd: float = Field(
        ge=0,
        description="Monthly price in USD. Use 0 for free tiers and one-time/marketplace pricing.",
    )
    features: list[str] = Field(
        default_factory=list,
        description="3-6 short bullet points describing what's included.",
    )


class VideoSource(BaseModel):
    url: HttpUrl
    video_id: str
    title: str | None = None
    channel: str | None = None
    duration_sec: int | None = None


class BusinessBlueprint(BaseModel):
    """A complete, opinionated business plan distilled from one video."""

    name: str = Field(
        description="Short, brandable product name. 1-2 words preferred."
    )
    tagline: str = Field(
        max_length=80,
        description="Landing page hero subhead. No more than 12 words.",
    )
    target_audience: str = Field(
        description="One precise sentence: who buys and why they care."
    )
    problem: str = Field(
        description="Pain point the product removes, in plain language."
    )
    solution: str = Field(
        description="How the product solves it. Concrete, not abstract."
    )
    key_features: list[str] = Field(
        min_length=3,
        max_length=6,
        description="Headline features. Each <= 8 words.",
    )
    pricing_model: PricingModel
    pricing_tiers: list[PricingTier] = Field(
        default_factory=list,
        description="Concrete tiers. Leave empty for marketplace/one-time if N/A.",
    )
    channels: list[str] = Field(
        min_length=1,
        description="Acquisition channels in priority order (e.g. 'X content', 'SEO', 'YouTube').",
    )
    tech_stack: list[str] = Field(
        default_factory=list,
        description="Implementation suggestions. Bias toward indie-hacker defaults.",
    )
    differentiation: str = Field(
        description="One sentence on why this wins vs. existing alternatives."
    )
    cta_primary: str = Field(
        max_length=24,
        description="Primary call-to-action button label (e.g. 'Start free').",
    )
    cta_secondary: str | None = Field(
        default=None,
        max_length=24,
        description="Optional secondary CTA (e.g. 'See demo').",
    )
    social_proof_hint: str | None = Field(
        default=None,
        description="What kind of social proof would land best (e.g. 'creator testimonials').",
    )
    video: VideoSource
