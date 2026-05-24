"""MCP tool: analyze_deep(youtube_url) → DeepAnalysisReport.

This is the Phase 8.1 successor to `analyze`. The original tool is preserved
so that scaffold/deploy/oneshot pipelines that consumed BusinessBlueprint
keep working unchanged — analyze_deep RETURNS the blueprint inside
`report.blueprint` for backward compatibility.
"""

from __future__ import annotations

from clonepilot.analysis.pipeline import run_deep_analysis
from clonepilot.server import mcp


@mcp.tool()
def analyze_deep(youtube_url: str) -> dict:
    """Produce a deep business analysis report from one YouTube URL.

    Output is a DeepAnalysisReport: BusinessBlueprint + market sizing
    (Ahrefs + Google Trends) + competitor map (Exa + LLM extraction) +
    bottom-up revenue forecast (TAM/SAM/SOM, 3 scenarios) + 5-language
    hero copy (en/ko/ja/zh/es) + ranked risks + 90-day go-to-market plan.

    Every external dependency is fail-soft. Missing keys (Ahrefs, Exa) or
    transient rate limits (Trends) degrade `data_quality.confidence_0_100`
    but never crash the pipeline.

    Backward compatibility: `report["blueprint"]` is the same shape as
    `analyze(url)["blueprint"]`, so scaffold/deploy continue to work.
    """
    report = run_deep_analysis(youtube_url)
    return report.model_dump(mode="json")
