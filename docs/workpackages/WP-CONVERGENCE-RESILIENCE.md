# Convergence Stage Resilience — Enterprise Solution

**Status:** RESOLVED (2026-09-29). The jitterbug convergence stage returned empty
on 4/4 bench runs; it now produces a full synthesis on the identical input.

---

## Root cause (research-confirmed)

The `synthesis` intent routes to the **highest-price reasoning model** in the
catalog (`@cf/zai-org/glm-5.3`, price 1.4, reasoning=true). GLM is a documented
"output stalling" failure: reasoning models **allocate the output token budget
to chain-of-thought first, leaving nothing for the visible response**, and
*where reasoning exhausted the completion cap the model emits no answer at all*.

Two compounding defects in the previous implementation:

1. **No `reasoning_effort` forwarded.** The router's Workers AI body sent
   `model/messages/max_tokens/temperature` but NOT `reasoning_effort`. The
   documented fix (`cloudflare/ai workers-ai-provider@3.1.12`, PR e9b2a9a) is
   exactly this: silently-dropped `reasoning_effort`/`chat_template_kwargs`
   caused GLM/Kimi/QwQ to burn the entire completion cap on chain-of-thought.
2. **Single giant synthesis call.** `runConvergence` packed all ~25KB of
   research facets into ONE call with `maxTokens: 2000`. Ratio of estimated
   output cost to available Output Generation Capacity ≈ 1.0 → direct
   generation was infeasible. The existing empty-content retry (4x, backoff)
   handles *transient burst*, not *structural stalling*.

## The five-layer fix

| Layer | File | Mechanism |
|---|---|---|
| L1 OGC planning | `convergence/planner.mjs` | Models completion-budget × (1−reasoning overhead); selects direct/chunked/deferred |
| L2 Chunked + checkpoint | `convergence/resilient.mjs` | Map-reduce: compact each facet → brief (checkpointed), then synthesize briefs; a crash on facet k preserves 0..k−1 |
| L3 Stall recovery | `convergence/stall-recovery.mjs` | Bounded (2) strong-nudge retries that RESTATE the question; 3rd attempt compacts context |
| L4 Model chain + CB | `convergence/model-health.mjs`, `convergence/model-chain.mjs` | Per-model circuit breaker (CLOSED→OPEN→HALF_OPEN), OPEN sinks in chain, jittered backoff |
| L5 Graceful cascade | `convergence/graceful.mjs` | full-synthesis → chunked → concatenated-briefs. **Never zero.** |

**Root-cause fix at the router:** `routeToWorkersAI` now forwards
`reasoning_effort: 'low'` by default so reasoning models reserve output budget
for the visible response. `dispatchLLM` gains `opts.returnModel` (observability)
and `opts.model` (fallback-chain override).

## Evidence

- **Deterministic unit tests (no LLM):** 5/5 layer hooks PASS + 2 negative
  controls (`stall-recovery` throws bounded; planner never mis-selects direct).
- **Live reproduction of the exact bench failure:** 3 × 7.2KB facets through
  `gracefulConvergence` + `convergeWithChain` (real Workers AI) →
  **level: full-synthesis, degraded: false, 3034 chars, 22.7s** (was: empty, 4/4).
- **Verify suite:** `node tools/agent-verify/verify.mjs --claims self-claims.json`
  → PASS (16/16), including the live-fix claims.

## Metrics (enterprise SLOs)

| Metric | Source | Threshold |
|---|---|---|
| convergence_success_rate | `level != concatenated-briefs` | > 0.95 |
| degradation_rate | `degraded == true` | < 0.05 |
| stall_recovery_rate | `recovered == true` (from model-chain) | tracking |

## The one-line contract

The convergence stage never returns empty. It returns the best synthesis the
available models can produce, or the research itself — and it says which
(`jitterbug.convergence_completed` audit event carries `convergenceLevel` and
`stageTrace`).

## Boundaries / known limits

- Fallback models may produce lower-quality synthesis (documented trade-off;
  watch `degradation_rate`).
- Reasoning models can still stall on *pathological* inputs; the architecture
  works around it, not through it.
- The `__test*` hooks are deterministic (no LLM) so the suite runs in CI
  without tokens; the live-fix claim requires `CF_API_TOKEN` and is advisory
  in CI.