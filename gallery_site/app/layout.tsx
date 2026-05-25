import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://clonepilot-gallery.vercel.app"),
  title: "ClonePilot — Every demo here was built from a YouTube URL.",
  description:
    "ClonePilot watches a business YouTube video, scaffolds a Next.js landing page, deploys it to Vercel, and hands you back a live URL. Browse the gallery.",
  openGraph: {
    title: "ClonePilot — YouTube → live MVP, in one MCP call.",
    description:
      "Every site in this gallery was built from a single YouTube URL by ClonePilot, an MCP server for Claude / Cursor / Codex.",
    type: "website",
    siteName: "ClonePilot",
  },
  twitter: {
    card: "summary_large_image",
    title: "ClonePilot — YouTube → live MVP, in one MCP call.",
    description:
      "Open-source MCP server. Paste a YouTube URL in Claude Code, get a deployed Next.js site in 2 min.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
