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

## Batch API probe result (amendment 2) — DEFERRED

Probed every plausible Workers AI batch route on this account
(`ai/v1/batch`, `ai/v1/batches`, `ai/batch`, `ai/v1/async/batches`,
`ai/v1/chat/batches`). All return `code 7000 "No route for that URI"` or
`7003 "Could not route"`. **The batch API is not available on this account.**
The single-model `ai/run/<model>` endpoint works but is per-call, not batch.

Rank-2 is DEFERRED, not abandoned. The facet research is already concurrent
via `Promise.all` (3 parallel HTTP calls). The real lever for the ~150s/prompt
facet stage is a faster research-tier model — the baseline shows gemma-4-26b
at ~51s/call with 68.6 TPS. Switching the research intent to a lower-latency
model (e.g. a flash-tier model) is the measurable alternative.

## Re-ranked optimizations (post-probe)

| Rank | Change | Status | Expected |
|---|---|---|---|
| 1 | x-session-affinity | LANDED (telemetry) | NOT verifiable (cached=0) |
| 2 | Async batch for facets | DEFERRED (no endpoint) | — |
| 3 | Faster research-tier model | NOT STARTED | targets 150s/prompt dominant cost |
| 4 | Flatten research tree | PARKED (needs baseline) | eliminates a convergence wait |
| 5 | Parallel early routing in chain | PARKED | removes sequential fallback |
| 6 | Semantic cache for briefs | PARKED | fewer model calls |
| 7 | Dependency-driven context | PARKED | ~83% token reduction |

The honest ranking after probes: **rank 3 (faster research model) is now the
highest-value remaining lever**, because it directly attacks the dominant cost
(150s/prompt on facet research) with a measurable before/after on the baseline
we just captured.