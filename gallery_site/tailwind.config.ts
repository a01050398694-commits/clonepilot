import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-3": "var(--surface-3)",
        ink: "var(--text)",
        "ink-muted": "var(--text-muted)",
        "ink-dim": "var(--text-dim)",
        "ink-faint": "var(--text-faint)",
        "ink-inverse": "var(--ink-inverse)",
        /* Backward-compatible monochrome aliases — emerald accent is gone */
        accent: {
          DEFAULT: "var(--text)",
          strong: "#ffffff",
          soft: "rgba(255,255,255,0.06)",
        },
      },
      borderColor: {
        DEFAULT: "var(--border)",
        strong: "var(--border-strong)",
        bright: "var(--border-bright)",
      },
      letterSpacing: {
        tightish: "-0.015em",
        tightest: "-0.03em",
        wider2: "0.22em",
      },
      borderRadius: {
        none: "0",
        sm: "2px",
        DEFAULT: "3px",
        md: "4px",
        lg: "6px",
      },
    },
  },
  plugins: [],
} satisfies Config;
