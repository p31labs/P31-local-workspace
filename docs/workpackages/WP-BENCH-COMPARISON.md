# WP-BENCH-COMPARISON — Jitterbug vs Frontier (authoritative)

**Status:** RESOLVED (2026-09-29). First calibrated cross-model bench.

## The comparison

Judge: `deepseek-v4-flash` (pinned), calibrated at raw agreement 0.909,
Cohen's κ 0.818 — both clear the trust bar (0.80 / 0.60). Scores authoritative.

| Source | Mean compliance | Pass@k | n |
|---|---|---|---|
| jitterbug | 0.604 | 25% | 4 |
| frontier:glm-5.3 | 0.856 | 100% | 4 |
| frontier:deepseek-v4-pro | 0.707 | 75% | 4 |

## Per prompt

| Prompt | jitterbug | glm-5.3 | deepseek-v4-pro |
|---|---|---|---|
| 01-spoon-aware-adaptation | 0.500 | 1.000 | 1.000 |
| 02-family-safe-governance | 0.619 | 0.952 | 0.952 |
| 03-privacy-preserving-identity | 0.444 | 0.722 | 0.000 |
| 04-step-level-routing | 0.854 | 0.750 | 0.875 |

## Verdict

Jitterbug loses on 3/4 prompts. It wins only on 04 (step-level routing),
where its multi-facet decomposition genuinely fits the task.

The gap is NOT speed. glm-5.3 produces a higher-scoring report with a SINGLE
call; jitterbug makes 3 facet + 1 convergence call per level (depth 2 → 8
calls) and still scores lower. **The convergence stage compresses away
information the frontier single-call keeps.** The speed optimizations in
WP-INFERENCE-SPEED do not close this gap.

## Finding: deepseek-v4-pro degenerate output on 03

deepseek-v4-pro scored **0.000** on 03-privacy-preserving-identity. Its report
was a 73-char title-only stub:

`# Deterministic Privacy-Preserving Identity: The Pickle Name System ##`

This is the output-stalling family of failure — the calibrated judge scored it
all-Not-Satisfied. The convergence fix (WP-CONVERGENCE-RESILIENCE) prevents
jitterbug from ever returning empty; the frontier baseline has no such guard.

## Decision required

The quality gap (jitterbug 0.604 vs glm-5.3 0.856) is a separate thread from
speed. Options:
1. Accept jitterbug as the cost-efficient sovereign pipeline (small models,
   sovereign routing, spoon-gated) and keep frontier models for high-stakes
   synthesis only.
2. Improve facet prompts to inject the sources the rubric demands
   (retrieval-style), targeting the 02-family (0.619) and 03-privacy (0.444)
   reference losses.
3. Treat jitterbug's convergence compression as a real defect and reduce
   information loss in the map-reduce briefs.

This is recorded here so it is not buried under latency numbers.