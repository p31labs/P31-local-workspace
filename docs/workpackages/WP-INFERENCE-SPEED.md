# WP-INFERENCE-SPEED — Baseline measurement (measure-before-optimize gate)

**Status:** BASELINE CAPTURED (2026-09-29). No optimization claim lands before
this baseline exists. Phase 1 instrumentation (TTFT/TPS telemetry) is live.

## Instrumentation

`routeToWorkersAI` now returns `{ ttftMs, tps, totalMs, promptTokens,
completionTokens, cachedPromptTokens }` from the Workers AI usage object.
`dispatchLLM` surfaces it when `returnModel` is set; `emitTelemetry` records
`ttft_ms/tps/total_ms/cached_prompt_tokens` per call to the event bus.

## Baseline (bench jitterbug leg, clean telemetry, 2026-09-29)

| Model | Role | Calls | Mean total | Mean TPS | Cached tokens |
|---|---|---|---|---|---|
| gemma-4-26b-a4b-it | research facets | 24 | 50.8s | 68.6 | 64 |
| glm-5.3 | convergence (map/reduce) | 36 | 12.9s | 51.6 | 960 |
| deepseek-v4-flash | judge | 4 | 35.8s | 49.3 | 0 |

Wall compute: 1828s across 64 calls for one 4-prompt bench pass.

Honest read: the **research facet stage (gemma, ~51s × 3) is the dominant cost**,
not the convergence. Each depth-2 prompt spends ~150s on facet research vs
~26s on convergence. The TPS ceiling is ~50-70 across models — these are big
reasoning/serving models, not fast-path.

## Session-affinity finding (amendment 1)

`x-session-affinity` is landed in the router (sent when `opts.sessionId` set),
but `cached_tokens` returns **0** on both deepseek-v4-flash and glm-5.3-flash
with byte-identical system prompts across consecutive calls. The research
report's 20-40% prefill-savings claim is NOT verifiable on these models.

Nuance: glm-5.3 (bench convergence, automatic prefix caching) DID accrue 960
cached tokens across 36 calls WITHOUT session affinity — the shared-cache
protection engages when system prompts repeat. The header is not the driver;
prompt repeatability is. So: keep static system prompts byte-identical, and the
cache engages; the affinity header alone does nothing visible on these models.

## Score variance (needs recording)

The baseline run scored mean 0.719 (01 0.694, 02 0.571, 03 0.694, 04 0.917)
vs 0.604 in the frontier run (01 0.500, 03 0.444). Same pinned judge, same
pipeline — the judge is noisy run-to-run. **Single-run comparisons are not
stable; the frontier comparison should be re-run N times before claiming a gap.**
This is a measurement caveat on WP-BENCH-COMPARISON.

## Next optimization to measure (after this baseline)

Rank-2 (async batch for the 3 parallel facet calls): probe the Workers AI batch
endpoint first. The facet research is the dominant cost (150s/prompt) and the
3 calls are independent — the batch API's value is real IF the endpoint exists
and schedules them concurrently.