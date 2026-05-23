# Publishing ClonePilot to Smithery

[Smithery](https://smithery.ai) is the largest MCP server registry (7k+ servers, equivalent of Docker Hub for MCP). Listing here is how indie hackers will discover ClonePilot from inside Claude Desktop / Claude Code / Cursor.

## Prereqs

1. **PyPI publish complete** — `pip install clonepilot` works publicly. (Phase 4.)
2. GitHub repo public.
3. `smithery.yaml` at repo root (already committed).
4. `Dockerfile` at repo root (already committed; only used for Smithery's hosted runtime).
5. A Smithery account linked to GitHub.

## One-time submit

```bash
# Install Smithery CLI
npm install -g @smithery/cli

# Authenticate
smithery login

# Submit
smithery publish
```

Smithery reads `smithery.yaml`, validates the config schema, builds the Docker image, and lists the server.

## README badge (after publish)

```markdown
[![smithery badge](https://smithery.ai/badge/@askbit/clonepilot)](https://smithery.ai/server/@askbit/clonepilot)
```

## Verifying

Users install via:

```bash
npx -y @smithery/cli install @askbit/clonepilot --client claude
```

That writes the `mcpServers.clonepilot` block into the user's `claude_desktop_config.json` automatically.

## Updating

Every git tag push triggers a Smithery rebuild. Bump version in `pyproject.toml`, commit, push tag `v0.x.y`.
