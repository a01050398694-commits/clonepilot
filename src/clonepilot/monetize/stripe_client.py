"""Stripe Product + Price + Payment Link generation per pricing tier.

When STRIPE_SECRET_KEY is set we create real Stripe objects via the official
SDK. When it's missing we return PREVIEW links — `https://example.com/buy/…`
placeholders — so the rest of the pipeline (scaffold, deploy) still demos
end-to-end without crashing. Preview mode is loudly tagged on every link so
nobody mistakes it for a working checkout.

Why we don't error out without a key: the value of ClonePilot is "URL → live
clone in two minutes." Forcing every demo to require a Stripe account would
break that promise. Real Stripe activation is one env var away.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from urllib.parse import quote

import stripe

from clonepilot.blueprint.schema import BusinessBlueprint


class MonetizeMode(str, Enum):
    LIVE = "live"  # sk_live_…
    TEST = "test"  # sk_test_…
    PREVIEW = "preview"  # no key — mock links


class MonetizeError(RuntimeError):
    """Stripe API call failed in a way we can't paper over."""


@dataclass(frozen=True)
class PaymentLink:
    tier_name: str
    url: str
    mode: MonetizeMode
    stripe_price_id: str | None = None
    stripe_product_id: str | None = None


def create_payment_links(
    blueprint: BusinessBlueprint,
    stripe_secret_key: str | None,
) -> list[PaymentLink]:
    """Return one PaymentLink per tier. Free tiers get no link."""
    if not stripe_secret_key:
        return [_preview_link(t) for t in blueprint.pricing_tiers if t.price_usd > 0]

    mode = MonetizeMode.LIVE if stripe_secret_key.startswith("sk_live_") else MonetizeMode.TEST
    stripe.api_key = stripe_secret_key

    links: list[PaymentLink] = []
    for tier in blueprint.pricing_tiers:
        if tier.price_usd <= 0:
            continue
        try:
            link = _create_one(blueprint, tier, mode)
        except stripe.StripeError as exc:
            raise MonetizeError(
                f"Stripe API failed for tier {tier.name!r}: {exc}"
            ) from exc
        links.append(link)
    return links


def _create_one(blueprint: BusinessBlueprint, tier, mode: MonetizeMode) -> PaymentLink:
    """Create Product + Price + Payment Link for a single tier."""
    product = stripe.Product.create(
        name=f"{blueprint.name} — {tier.name}",
        description=" • ".join(tier.features[:4]) or blueprint.tagline,
        metadata={
            "clonepilot_source_video": str(blueprint.video.url),
            "clonepilot_blueprint_name": blueprint.name,
            "clonepilot_tier_name": tier.name,
        },
    )
    price = stripe.Price.create(
        product=product.id,
        unit_amount=int(round(tier.price_usd * 100)),
        currency="usd",
        recurring=_recurring(blueprint.pricing_model),
    )
    link = stripe.PaymentLink.create(
        line_items=[{"price": price.id, "quantity": 1}],
        metadata={"tier_name": tier.name},
    )
    return PaymentLink(
        tier_name=tier.name,
        url=link.url,
        mode=mode,
        stripe_price_id=price.id,
        stripe_product_id=product.id,
    )


def _recurring(pricing_model: str) -> dict | None:
    """Stripe needs explicit recurring metadata for subscription pricing."""
    if pricing_model in {"subscription", "freemium"}:
        return {"interval": "month"}
    return None


def _preview_link(tier) -> PaymentLink:
    label = quote(tier.name, safe="")
    return PaymentLink(
        tier_name=tier.name,
        url=f"https://example.com/buy/{label}?preview=clonepilot&amount={int(tier.price_usd)}usd",
        mode=MonetizeMode.PREVIEW,
    )
