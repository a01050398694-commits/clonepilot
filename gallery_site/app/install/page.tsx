import Link from "next/link";
import { ConfigSnippet } from "./ConfigSnippet";

export const metadata = {
  title: "Install ClonePilot — 1-minute setup for Claude / Cursor / Codex",
  description:
    "Copy-paste the MCP config block into your AI editor. Free tier: 1 build/month, no signup.",
};

const PLATFORMS: { id: string; name: string; configPath: string; configBlock: object }[] = [
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    configPath:
      "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json\nWindows: %APPDATA%\\Claude\\claude_desktop_config.json",
    configBlock: {
      mcpServers: {
        clonepilot: {
          command: "uvx",
          args: [
            "--from",
            "git+https://github.com/a01050398694-commits/clonepilot",
            "clonepilot",
          ],
          env: {
            ANTHROPIC_API_KEY: "sk-ant-...",
            SUPADATA_API_KEY: "your-supadata-key",
            VERCEL_TOKEN: "your-vercel-token",
          },
        },
      },
    },
  },
  {
    id: "claude-code",
    name: "Claude Code (CLI)",
    configPath: "~/.claude/mcp.json (or use `claude mcp add`)",
    configBlock: {
      mcpServers: {
        clonepilot: {
          command: "uvx",
          args: [
            "--from",
            "git+https://github.com/a01050398694-commits/clonepilot",
            "clonepilot",
          ],
          env: {
            ANTHROPIC_API_KEY: "sk-ant-...",
            SUPADATA_API_KEY: "your-supadata-key",
            VERCEL_TOKEN: "your-vercel-token",
          },
        },
      },
    },
  },
  {
    id: "cursor",
    name: "Cursor",
    configPath: "Cursor → Settings → Features → MCP",
    configBlock: {
      mcpServers: {
        clonepilot: {
          command: "uvx",
          args: [
            "--from",
            "git+https://github.com/a01050398694-commits/clonepilot",
            "clonepilot",
          ],
          env: {
            ANTHROPIC_API_KEY: "sk-ant-...",
            SUPADATA_API_KEY: "your-supadata-key",
            VERCEL_TOKEN: "your-vercel-token",
          },
        },
      },
    },
  },
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    configPath: "~/.codex/config.toml — under [mcp_servers.clonepilot]",
    configBlock: {
      "mcp_servers.clonepilot": {
        command: "uvx",
        args: [
          "--from",
          "git+https://github.com/a01050398694-commits/clonepilot",
          "clonepilot",
        ],
        env: {
          ANTHROPIC_API_KEY: "sk-ant-...",
          SUPADATA_API_KEY: "your-supadata-key",
          VERCEL_TOKEN: "your-vercel-token",
        },
      },
    },
  },
];

const KEYS = [
  {
    name: "ANTHROPIC_API_KEY",
    where: "https://console.anthropic.com/settings/keys",
    cost: "paid · ~$0.03 per build",
  },
  {
    name: "SUPADATA_API_KEY",
    where: "https://supadata.ai (YouTube transcripts)",
    cost: "free tier: 100 videos/mo",
  },
  {
    name: "VERCEL_TOKEN",
    where: "https://vercel.com/account/tokens",
    cost: "free Hobby tier: 100 deploys/day",
  },
];

export default function InstallPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <nav className="mb-12 text-xs font-mono">
        <Link href="/" className="text-zinc-500 hover:text-cyan-400">
          ← gallery
        </Link>
      </nav>

      <header className="max-w-3xl mb-12">
        <p className="text-cyan-400 font-mono text-xs uppercase tracking-wider mb-3">
          1-minute install · 0 signup
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Drop this block into your editor.
        </h1>
        <p className="mt-5 text-zinc-400 text-lg leading-relaxed">
          ClonePilot is an MCP server. You paste a config block once, restart
          your editor, and from then on you can paste any YouTube URL into the
          chat and ask Claude to clone the business.
        </p>
        <p className="mt-3 text-zinc-500 text-sm">
          Free tier: 1 full build per month. After that, just see the analysis
          + roadmap (or{" "}
          <Link href="/pricing" className="text-cyan-400 hover:underline">
            grab Pro
          </Link>{" "}
          for unlimited).
        </p>
      </header>

      <section className="space-y-8">
        {PLATFORMS.map((p) => (
          <div
            key={p.id}
            id={p.id}
            className="border border-zinc-800 rounded-xl bg-zinc-950 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              <span className="text-xs font-mono text-zinc-500">
                MCP config
              </span>
            </div>
            <div className="px-6 py-4 text-xs font-mono text-zinc-500 whitespace-pre-line border-b border-zinc-800">
              {p.configPath}
            </div>
            <ConfigSnippet json={p.configBlock} />
          </div>
        ))}
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold">Required keys (Free tier brings their own)</h2>
        <p className="mt-2 text-sm text-zinc-400">
          On the Free tier, you bring 3 keys. On Pro/Lifetime, we provide them
          — paste a single CLONEPILOT_LICENSE_KEY instead.
        </p>
        <div className="mt-6 grid gap-3">
          {KEYS.map((k) => (
            <div
              key={k.name}
              className="p-4 rounded-md border border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
            >
              <div>
                <p className="font-mono text-sm text-cyan-300">{k.name}</p>
                <p className="text-xs text-zinc-500 mt-1">{k.cost}</p>
              </div>
              <a
                href={`https://${k.where.split(" ")[0].replace(/^https?:\/\//, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:text-cyan-400 font-mono"
              >
                {k.where} →
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 p-6 border border-cyan-500/30 bg-cyan-500/5 rounded-xl">
        <h2 className="text-xl font-bold">Want to skip the keys?</h2>
        <p className="mt-2 text-zinc-300 text-sm leading-relaxed">
          Pro and Lifetime tiers run ClonePilot on our hosted backend — no
          Anthropic or Vercel keys needed. You paste just one line:
        </p>
        <pre className="mt-4 p-3 rounded bg-zinc-950 border border-zinc-800 font-mono text-xs overflow-x-auto">
          <code>{`"env": { "CLONEPILOT_LICENSE_KEY": "cpl_xxxxxxxx" }`}</code>
        </pre>
        <Link
          href="/pricing"
          className="mt-5 inline-block px-5 py-2.5 rounded-md bg-cyan-400 text-zinc-950 font-semibold hover:bg-cyan-300 transition"
        >
          See pricing →
        </Link>
      </section>

      <footer className="mt-20 pt-8 border-t border-zinc-900 text-xs text-zinc-600 font-mono flex flex-wrap gap-4 justify-center">
        <Link href="/" className="hover:text-cyan-400">gallery</Link>
        <Link href="/install" className="hover:text-cyan-400">install</Link>
        <Link href="/pricing" className="hover:text-cyan-400">pricing</Link>
        <a href="https://github.com/a01050398694-commits/clonepilot" className="hover:text-cyan-400">github</a>
      </footer>
    </main>
  );
}
