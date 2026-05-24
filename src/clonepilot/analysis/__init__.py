"""Deep analysis pipeline (Phase 8.1).

Turns a YouTube URL into a DeepAnalysisReport: blueprint + market sizing +
competitor map + bottom-up revenue forecast + 5-language hero copy + risks
and a 90-day GTM. Each external dependency (Ahrefs, Exa, Trends) is fail-soft
— a missing key or a network blip degrades data_quality.confidence_0_100,
never crashes the pipeline.
"""

from clonepilot.analysis.schema import DeepAnalysisReport

__all__ = ["DeepAnalysisReport"]
