import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Analytics } from "@vercel/analytics/react";
import { getLang } from "@/lib/lang";
import { LANG_HTML } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://clonepilot-gallery.vercel.app"),
  title: "ClonePilot — YouTube business video to deployed clone, in two minutes.",
  description:
    "Open-source MCP for Claude Code, Cursor, and Codex. Drop a YouTube business video, get a Next.js site, a deep market report, and a live Vercel URL.",
  openGraph: {
    title: "ClonePilot — YouTube to live site, one MCP call.",
    description:
      "Open-source MCP. Paste a YouTube business video in Claude Code. Get a deployed Next.js site plus a deep market report.",
    type: "website",
    siteName: "ClonePilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClonePilot — YouTube to live site, one MCP call.",
    description:
      "Open-source MCP for Claude Code. YouTube URL in, deployed Next.js site out.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();
  return (
    <html
      lang={LANG_HTML[lang]}
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-[100dvh] font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
