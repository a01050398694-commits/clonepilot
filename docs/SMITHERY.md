# Publishing ClonePilot to Smithery

[Smithery](https://smithery.ai) is the largest MCP server registry (7k+ servers, the Docker Hub of MCP). Listing here is how indie hackers discover ClonePilot from inside Claude Desktop / Claude Code / Cursor.

## Why this is a manual one-click step

Smithery authenticates via browser OAuth (GitHub-backed). Even an automation can't bypass the consent screen — it's the same security model as `gh auth login` or `vercel login`. So publishing is a one-time browser click.

After that single click, the CLI session is cached on this machine and future `smithery mcp publish` calls require no further interaction.

## One-time submit

```bash
# 1. Authenticate (opens a Smithery URL — click "Authorize")
npx -y @smithery/cli@latest auth login

# 2. Publish (reads smithery.yaml + Dockerfile from this repo)
npx -y @smithery/cli@latest mcp publish \
  https://github.com/a01050398694-commits/clonepilot \
  -n askbit/clonepilot
```

Smithery scrapes `smithery.yaml`, validates the config schema, builds the Docker image, and lists the server within a few minutes.

## README badge (after publish)

Already in `README.md` as a commented block — uncomment when the listing goes live:

```markdown
[![smithery badge](https://smithery.ai/badge/@askbit/clonepilot)](https://smithery.ai/server/@askbit/clonepilot)
```

## What users get after listing

```bash
npx -y @smithery/cli@latest install @askbit/clonepilot --client claude
```

That single command writes the `mcpServers.clonepilot` block into the user's `claude_desktop_config.json` automatically.

## Until Smithery is live: install direct from GitHub

```bash
uvx --from git+https://github.com/a01050398694-commits/clonepilot clonepilot
```

Works today, no Smithery and no PyPI required. The README's primary install instructions already point here.

## Updating

Every git tag push triggers a Smithery rebuild. Bump version in `pyproject.toml`, commit, push tag `v0.x.y`.
