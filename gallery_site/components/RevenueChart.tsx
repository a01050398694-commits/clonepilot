import type { RevenueForecast, ForecastScenario } from "@/lib/report";

function fmtUsd(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n)}`;
}

function scenarioColor(label: ForecastScenario["label"]): string {
  switch (label) {
    case "aggressive":
      return "#22d3ee"; // cyan-400
    case "base":
      return "#a3e635"; // lime-400
    default:
      return "#fbbf24"; // amber-400
  }
}

export function RevenueChart({
  forecast,
  emptyHint,
}: {
  forecast: RevenueForecast | null;
  emptyHint?: string;
}) {
  if (!forecast) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/50 p-8 text-center">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-2">
          Revenue forecast unavailable
        </p>
        <p className="text-sm text-zinc-400">
          {emptyHint ??
            "Set AHREFS_API_KEY and EXA_API_KEY in your .env to enable TAM/SAM/SOM + 3-scenario ARR projection."}
        </p>
      </div>
    );
  }

  const { tam_usd_annual, sam_usd_annual, som_usd_annual_year1, scenarios, assumptions } = forecast;
  const funnelMax = Math.max(tam_usd_annual, sam_usd_annual, som_usd_annual_year1, 1);
  const funnelRows = [
    { label: "TAM (annual)", value: tam_usd_annual, hint: "Total addressable market" },
    { label: "SAM (annual)", value: sam_usd_annual, hint: "Serviceable available market" },
    { label: "SOM yr 1", value: som_usd_annual_year1, hint: "Realistic year-1 capture" },
  ];

  const scenarioMax = Math.max(...scenarios.map((s) => s.arr_usd), 1);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
          Market sizing
        </p>
        <div className="space-y-3">
          {funnelRows.map((row) => {
            const pct = Math.max(2, (row.value / funnelMax) * 100);
            return (
              <div key={row.label}>
                <div className="flex justify-between items-baseline text-xs mb-1">
                  <span className="text-zinc-300 font-medium">{row.label}</span>
                  <span className="font-mono text-cyan-300">{fmtUsd(row.value)}</span>
                </div>
                <div
                  className="h-3 rounded-full bg-cyan-400/80"
                  style={{ width: `${pct}%` }}
                  title={`${row.hint}: ${fmtUsd(row.value)}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-4">
          ARR scenarios (year 1)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((s) => {
            const pct = Math.max(8, (s.arr_usd / scenarioMax) * 100);
            return (
              <div
                key={s.label}
                className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/40"
              >
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  {s.label}
                </p>
                <p
                  className="mt-2 text-2xl font-bold font-mono"
                  style={{ color: scenarioColor(s.label) }}
                >
                  {fmtUsd(s.arr_usd)}
                </p>
                <div className="mt-3 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: scenarioColor(s.label),
                    }}
                  />
                </div>
                <ul className="mt-3 space-y-0.5 text-[10px] text-zinc-500 font-mono">
                  <li>signups/mo {s.monthly_signups.toLocaleString()}</li>
                  <li>paid {s.paid_conversions.toLocaleString()}</li>
                  <li>ARPU ${s.arpu_usd_annual}/yr</li>
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {assumptions.length > 0 && (
        <details className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <summary className="cursor-pointer text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-cyan-300">
            ▸ {assumptions.length} assumption{assumptions.length === 1 ? "" : "s"}
          </summary>
          <ul className="mt-3 space-y-1 text-xs text-zinc-400">
            {assumptions.map((a, i) => (
              <li key={i} className="leading-relaxed">
                · {a}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
