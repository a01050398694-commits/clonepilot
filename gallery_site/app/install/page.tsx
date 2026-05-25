import Link from "next/link";
import { ConfigSnippet } from "./ConfigSnippet";
import { SiteNav, SiteFooter } from "@/components/SiteChrome";
import { getLang } from "@/lib/lang";
import { t } from "@/lib/i18n";
import { tInstall, type InstallDict } from "@/lib/i18n-install";

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

function buildKeys(i: InstallDict) {
  return [
    {
      name: "ANTHROPIC_API_KEY",
      where: "https://console.anthropic.com/settings/keys",
      cost: i.cost_paid_per_build,
    },
    {
      name: "SUPADATA_API_KEY",
      where: "https://supadata.ai (YouTube transcripts)",
      cost: i.cost_free_videos,
    },
    {
      name: "VERCEL_TOKEN",
      where: "https://vercel.com/account/tokens",
      cost: i.cost_free_vercel,
    },
  ];
}

export default async function InstallPage() {
  const lang = await getLang();
  const d = t(lang);
  const i = tInstall(lang);
  const keys = buildKeys(i);

  return (
    <div className="min-h-[100dvh]">
      <SiteNav lang={lang} d={d} />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <nav className="mb-12 text-xs font-mono">
          <Link href="/" className="text-ink-dim hover:text-accent">
            {i.back_to_gallery}
          </Link>
        </nav>

        <header className="max-w-3xl mb-12">
          <p className="text-accent font-mono text-xs uppercase tracking-wider mb-3">
            {i.eyebrow}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {i.title}
          </h1>
          <p className="mt-5 text-ink-muted text-lg leading-relaxed">
            {i.subtitleRich(({ children }) => <>{children}</>)}
          </p>
          <p className="mt-3 text-ink-dim text-sm">
            {i.free_note_prefix}{" "}
            <Link href="/pricing" className="text-accent hover:underline">
              {i.free_note_link}
            </Link>{" "}
            {i.free_note_suffix}
          </p>
        </header>

        <section className="space-y-8">
          {PLATFORMS.map((p) => (
            <div
              key={p.id}
              id={p.id}
              className="border border-strong rounded-xl bg-surface overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-strong flex items-center justify-between">
                <h2 className="text-xl font-semibold">{p.name}</h2>
                <span className="text-xs font-mono text-ink-dim">
                  {i.config_label}
                </span>
              </div>
              <div className="px-6 py-4 text-xs font-mono text-ink-dim whitespace-pre-line border-b border-strong">
                {p.configPath}
              </div>
              <ConfigSnippet json={p.configBlock} />
            </div>
          ))}
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-bold">{i.keys_title}</h2>
          <p className="mt-2 text-sm text-ink-muted">{i.keys_subtitle}</p>
          <div className="mt-6 grid gap-3">
            {keys.map((k) => (
              <div
                key={k.name}
                className="p-4 rounded-md border border-strong bg-surface flex flex-col sm:flex-row sm:items-center gap-2 justify-between"
              >
                <div>
                  <p className="font-mono text-sm text-accent">{k.name}</p>
                  <p className="text-xs text-ink-dim mt-1">{k.cost}</p>
                </div>
                <a
                  href={`https://${k.where.split(" ")[0].replace(/^https?:\/\//, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-ink-muted hover:text-accent font-mono"
                >
                  {k.where} →
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 p-6 border border-accent/30 bg-accent/5 rounded-xl">
          <h2 className="text-xl font-bold">{i.skip_keys_title}</h2>
          <p className="mt-2 text-ink-muted text-sm leading-relaxed">
            {i.skip_keys_body}
          </p>
          <pre className="mt-4 p-3 rounded bg-bg border border-strong font-mono text-xs overflow-x-auto">
            <code>{`"env": { "CLONEPILOT_LICENSE_KEY": "cpl_xxxxxxxx" }`}</code>
          </pre>
          <Link
            href="/pricing"
            className="mt-5 inline-block px-5 py-2.5 rounded-md bg-accent text-bg font-semibold hover:bg-accent-strong transition"
          >
            {i.skip_keys_cta}
          </Link>
        </section>
      </main>
      <SiteFooter d={d} />
    </div>
  );
}
