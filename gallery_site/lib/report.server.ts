import fs from "node:fs";
import path from "node:path";
import type { DeepAnalysisReport } from "./report";

export function loadReport(slug: string): DeepAnalysisReport | null {
  const file = path.join(process.cwd(), "public", "reports", `${slug}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as DeepAnalysisReport;
  } catch {
    return null;
  }
}

export function listReportSlugs(): string[] {
  const dir = path.join(process.cwd(), "public", "reports");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}
