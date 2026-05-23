# Dockerfile for Smithery hosted runtime.
# Local users normally run via `uvx clonepilot` — this is only needed if you
# host the MCP server on Smithery's infrastructure.

FROM python:3.12-slim

RUN pip install --no-cache-dir uv==0.11.7

WORKDIR /app
COPY pyproject.toml uv.lock* README.md ./
COPY src ./src

RUN uv sync --frozen --no-dev || uv sync --no-dev

ENV PYTHONUNBUFFERED=1
ENTRYPOINT ["uv", "run", "clonepilot"]
