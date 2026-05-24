"""i18n adapter — one Claude call produces hero copy in 5 languages.

Why one call (not five): half the cost (~5x context savings), and tone stays
consistent across locales. Direct machine-translation of English copy makes
Korean and Japanese CTAs sound robotic — Claude rewrites them as native copy
within a single deliberation.
"""

from __future__ import annotations

from anthropic import Anthropic

from clonepilot.analysis.schema import I18nBundle, LangCode, LocalizedCopy
from clonepilot.blueprint.schema import BusinessBlueprint
from clonepilot.config import Config

DEFAULT_LANGS: list[LangCode] = ["en", "ko", "ja", "zh", "es"]

_LANG_NAMES = {
    "en": "English",
    "ko": "Korean (한국어, casual but professional)",
    "ja": "Japanese (日本語, polite -masu form)",
    "zh": "Simplified Chinese (简体中文)",
    "es": "Spanish (es-LA, neutral Latin-American)",
}


def generate_i18n(
    cfg: Config,
    blueprint: BusinessBlueprint,
    langs: list[LangCode] | None = None,
) -> I18nBundle | None:
    """Return I18nBundle with one LocalizedCopy per requested language, or None."""
    if not cfg.anthropic_api_key:
        return None
    langs = langs or DEFAULT_LANGS

    client = Anthropic(api_key=cfg.require_anthropic())

    bp_brief = (
        f"Product: {blueprint.name}\n"
        f"English tagline: {blueprint.tagline}\n"
        f"Target audience: {blueprint.target_audience}\n"
        f"Problem: {blueprint.problem}\n"
        f"Solution: {blueprint.solution}\n"
        f"Key features: {', '.join(blueprint.key_features)}\n"
        f"Differentiation: {blueprint.differentiation}\n"
    )

    lang_list_md = "\n".join(f"- {code}: {_LANG_NAMES[code]}" for code in langs)

    system = (
        "You write native marketing copy in 5 languages for a single product. "
        "Each language must read like it was written by a local copywriter, "
        "not translated. CTAs and taglines should use idiomatic native phrasing, "
        "not literal translations of the English. Keep the same product positioning, "
        "but adapt cultural emphasis (e.g., Korean leans efficiency, Japanese leans "
        "trust, Chinese leans value, Spanish leans community). "
        "Call submit_i18n once."
    )

    user = (
        f"{bp_brief}\n\n"
        "Generate native hero copy in EACH of these languages:\n"
        f"{lang_list_md}\n\n"
        "For each language, return:\n"
        "  - tagline: <= 12 words, brandable\n"
        "  - hero: 2-3 sentence hero paragraph below the tagline\n"
        "  - cta: 1-3 word primary call-to-action button label, idiomatic\n"
        "  - value_props: 3-5 short bullet value props\n\n"
        "Call submit_i18n now."
    )

    tool_schema = {
        "type": "object",
        "properties": {
            "locales": {
                "type": "object",
                "properties": {
                    code: {
                        "type": "object",
                        "properties": {
                            "tagline": {"type": "string"},
                            "hero": {"type": "string"},
                            "cta": {"type": "string"},
                            "value_props": {
                                "type": "array",
                                "items": {"type": "string"},
                                "minItems": 3,
                                "maxItems": 6,
                            },
                        },
                        "required": ["tagline", "hero", "cta", "value_props"],
                    }
                    for code in langs
                },
                "required": list(langs),
            }
        },
        "required": ["locales"],
    }

    try:
        response = client.messages.create(
            model=cfg.model_copy,
            max_tokens=3500,
            system=system,
            tools=[
                {
                    "name": "submit_i18n",
                    "description": "Submit the multilingual hero copy bundle.",
                    "input_schema": tool_schema,
                }
            ],
            tool_choice={"type": "tool", "name": "submit_i18n"},
            messages=[{"role": "user", "content": user}],
        )
    except Exception:  # noqa: BLE001
        return None

    payload = _find_tool_use_payload(response)
    raw_locales = payload.get("locales", {})

    locales: dict[LangCode, LocalizedCopy] = {}
    for code in langs:
        entry = raw_locales.get(code)
        if not entry:
            continue
        try:
            locales[code] = LocalizedCopy(**entry)
        except Exception:  # noqa: BLE001
            continue

    if not locales:
        return None

    return I18nBundle(default_lang="en" if "en" in locales else next(iter(locales)), locales=locales)


def _find_tool_use_payload(response) -> dict:
    for block in response.content:
        if getattr(block, "type", None) == "tool_use":
            return dict(block.input)
    return {}
