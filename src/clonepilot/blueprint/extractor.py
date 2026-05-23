"""Claude-backed extraction of a BusinessBlueprint from raw transcript text.

Why tool_use: Anthropic's tool_use forces the model to emit valid JSON matching
the pydantic schema. Free-form JSON-in-text would silently corrupt on long
transcripts. We pass the schema once and let the model fill it.
"""

from __future__ import annotations

from anthropic import Anthropic

from clonepilot.blueprint.schema import BusinessBlueprint, VideoSource
from clonepilot.config import Config

_SYSTEM_PROMPT = """You are a product strategist watching a YouTube video where someone explains a business idea or running business.

Your job: distill the video into a complete, deployable BusinessBlueprint that an indie hacker can implement this weekend.

Rules:
- Stay faithful to the video's stated business. Do not invent unrelated features.
- Plain language. No marketing fluff. No empty buzzwords.
- The product name must be brandable: short, memorable, no generic words like "Platform" or "Solution".
- Pricing tiers must be concrete USD numbers, not ranges.
- Channels must be ranked by what the video itself emphasizes — if the speaker is a YouTuber, YouTube ranks first.
- tech_stack: bias indie-hacker defaults (Next.js, Supabase, Vercel, Stripe) unless the video explicitly demands otherwise.
- differentiation must reference a concrete competitor or category the video mentions.

Call the submit_blueprint tool exactly once with the filled schema."""


def extract_blueprint(
    transcript_text: str,
    video: VideoSource,
    cfg: Config,
) -> BusinessBlueprint:
    """Call Claude with the transcript and return a validated blueprint."""
    client = Anthropic(api_key=cfg.require_anthropic())

    tool_schema = BusinessBlueprint.model_json_schema()
    # We pre-fill `video` server-side so the model can't hallucinate it.
    tool_schema = _strip_video_field(tool_schema)

    user_content = _build_user_prompt(transcript_text, video)

    response = client.messages.create(
        model=cfg.model_blueprint,
        max_tokens=4096,
        system=_SYSTEM_PROMPT,
        tools=[
            {
                "name": "submit_blueprint",
                "description": "Submit the extracted BusinessBlueprint.",
                "input_schema": tool_schema,
            }
        ],
        tool_choice={"type": "tool", "name": "submit_blueprint"},
        messages=[{"role": "user", "content": user_content}],
    )

    payload = _find_tool_use_payload(response)
    payload["video"] = video.model_dump(mode="json")
    return BusinessBlueprint.model_validate(payload)


def _build_user_prompt(transcript_text: str, video: VideoSource) -> str:
    head = f"Video: {video.url}\n"
    if video.title:
        head += f"Title: {video.title}\n"
    if video.channel:
        head += f"Channel: {video.channel}\n"
    return (
        head
        + "\n--- TRANSCRIPT ---\n"
        + transcript_text.strip()
        + "\n--- END ---\n\nCall submit_blueprint now."
    )


def _strip_video_field(schema: dict) -> dict:
    """Remove `video` from the schema so the model doesn't try to fabricate it."""
    schema = dict(schema)
    properties = dict(schema.get("properties", {}))
    properties.pop("video", None)
    schema["properties"] = properties
    required = [r for r in schema.get("required", []) if r != "video"]
    schema["required"] = required
    return schema


def _find_tool_use_payload(response) -> dict:
    for block in response.content:
        if getattr(block, "type", None) == "tool_use":
            return dict(block.input)
    raise RuntimeError(
        f"Claude did not call submit_blueprint. stop_reason={response.stop_reason}"
    )
