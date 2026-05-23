# Install ClonePilot

ClonePilot ships as a Python MCP server. Once installed, it surfaces three tools (`analyze`, `scaffold`, `deploy`) inside any MCP-aware client.

## Prerequisites

- Python 3.11 or newer.
- [`uv`](https://docs.astral.sh/uv/) (recommended) — install via `curl -LsSf https://astral.sh/uv/install.sh | sh` or `winget install astral-sh.uv`.
- API keys:
  - `ANTHROPIC_API_KEY` — https://console.anthropic.com/settings/keys
  - `SUPADATA_API_KEY` *(optional)* — https://supadata.ai (free 100 transcripts/mo). Without it, ClonePilot falls back to the free `youtube-transcript-api`.
  - `VERCEL_TOKEN` — https://vercel.com/account/tokens (scope: Full Account).
  - `STRIPE_SECRET_KEY` *(optional)* — https://dashboard.stripe.com/apikeys. Without it, `monetize` returns PREVIEW links (`https://example.com/buy/...`) so the pipeline still demos end-to-end.

## Install directly from GitHub (works today, no PyPI required)

```bash
uvx --from git+https://github.com/a01050398694-commits/clonepilot clonepilot
```

That one command:
1. Fetches the latest `main` from GitHub.
2. Installs ClonePilot and its deps into an isolated uv-managed env.
3. Runs the MCP server in stdio mode — ready to wire into any MCP client.

For development, clone instead:

```bash
git clone https://github.com/a01050398694-commits/clonepilot.git
cd clonepilot
uv sync
uv run clonepilot
```

## Once published to PyPI (Phase 5)

```bash
uvx clonepilot
```

## Wire it into your client

### Claude Desktop

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or
`%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "clonepilot": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/a01050398694-commits/clonepilot", "clonepilot"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "SUPADATA_API_KEY": "...",
        "VERCEL_TOKEN": "..."
      }
    }
  }
}
```

Restart Claude Desktop. ClonePilot's tools appear in the tools menu.

### Claude Code

```bash
claude mcp add clonepilot \
  -- uvx --from git+https://github.com/a01050398694-commits/clonepilot clonepilot \
  -e ANTHROPIC_API_KEY=sk-ant-... \
  -e SUPADATA_API_KEY=... \
  -e VERCEL_TOKEN=...
```

Or edit `~/.claude/settings.json` and add the same `mcpServers` block as above.

### Cursor

`Cmd-Shift-J` → "MCP" → "Add MCP Server" → paste the same JSON block.

### OpenAI Codex CLI

`~/.codex/config.toml`:

```toml
[mcp_servers.clonepilot]
command = "uvx"
args = ["--from", "git+https://github.com/a01050398694-commits/clonepilot", "clonepilot"]
env = { ANTHROPIC_API_KEY = "sk-ant-...", SUPADATA_API_KEY = "...", VERCEL_TOKEN = "..." }
```

## Verify the install

In any MCP client, ask:

> Run the `version` tool from clonepilot.

You should see `{"version": "0.1.0", "env_status": {"anthropic": true, "supadata": true, "vercel": true}}`. A `false` means that env var didn't reach the server — check your client's `env` block.

## First run

> Use clonepilot's `oneshot` on https://www.youtube.com/watch?v=L9LfsOR1YHw.

ClonePilot will:
1. Pull the transcript.
2. Ask Claude to distill a `BusinessBlueprint`.
3. Create Stripe Payment Links for each paid tier (or PREVIEW links if no Stripe key).
4. Generate a Next.js + Tailwind landing page with the Buy buttons baked in.
5. Push to Vercel and return the live `*.vercel.app` URL.
6. Generate a marketing kit (X thread, Product Hunt, Show HN, Reddit, LinkedIn, 4 ad creatives).

End to end: ~2-3 minutes.

For finer control you can also call the individual tools (`analyze`, `monetize`, `scaffold`, `deploy`, `marketing_kit`) in any order.
