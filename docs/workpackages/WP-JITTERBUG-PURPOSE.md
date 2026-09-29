# Jitterbug: Statement of Purpose

**Status:** DRAFT — written 2026-09-29. This is the answer to "what is the
Jitterbug for?" before any further optimization target is picked.

## The objective

The Jitterbug is a **sovereign alternative** — a research pipeline that
produces citation-backed synthesis WITHOUT depending on a single frontier
vendor. Its purpose is not to beat glm-5.3 on quality. Its purpose is to make
quality-parity with frontier models *not a requirement* for high-stakes
synthesis, by keeping the pipeline owned, gated, and open.

## What "win" means

| Dimension | Metric that matters | Current value | Target (sourced) |
|---|---|---|---|
| Quality | rubric compliance | 0.604-0.719 (noisy, pre-temp-0) | >= 0.70 (the rubric's own pass line) |
| Cost | quality-per-dollar (compliance / measured token cost) | high per-prompt cost | >= 3x frontier per dollar (MEASURED, not assumed) |
| Sovereignty | zero frontier-model dependency | satisfied | holds |
| Governance | every artifact hash-linked + audited | satisfied | holds |

**Target sourcing (the review's correction):**
- **0.70, not 0.80.** The rubric.json `pass_threshold` is 0.70 — that is the
  pipeline's own defined line of "acceptable." The ResearchRubrics benchmark
  (ICLR 2026) shows even strong deep-research systems average *under 0.68*.
  0.80 was aspirational and unsourced; 0.70 is defensible as the rubric's
  native gate. It is still above the measured frontier-DR average.
- **3x is a hypothesis to MEASURE, not a claim.** quality-per-dollar needs a
  denominator: total cost per prompt = sum over every call of
  (prompt_tokens + completion_tokens) × price-per-token from the catalog
  (models-catalog.json). This is now computable from the live telemetry
  (router.decision events record prompt_tokens/completion_tokens; catalog
  has priceInUsdPerM/priceOutUsdPerM). The 3x figure becomes a target only
  after that measurement exists — until then it is an aspiration, labeled as
  such.

The comparison against glm-5.3 (0.856) is NOT the scoreboard. The scoreboard
is: "can a sovereign pipeline reach >= 0.70 (the rubric's pass line) at a
measured >= 3x quality-per-dollar, without any vendor lock?" If the answer is
yes, the Jitterbug wins its objective even while glm-5.3 wins the single-prompt
comparison.

## Why not the other two options

- **Pure cost-efficiency vehicle:** would accept lower quality for volume.
  Rejected — the pipeline is used for high-stakes family-governance and
  identity synthesis where quality floor matters.
- **Pure research vehicle:** patterns-only, quality irrelevant. Rejected —
  patterns are meaningless if they don't produce usable synthesis.

## The implication for the remaining work

- Path E (compression-loss diagnosis) is the highest-value technical move: it
  targets the 0.604→0.856 gap directly. The Agent Capsules finding says
  "injecting more context worsens compression" — so the fix is better briefs,
  not more briefs.
- Speed work (B/C) is done and valuable, but it does not close the quality
  gap. Do not optimize speed further until quality reaches the 0.70 target.
- The benchmark's job is to measure progress toward THIS objective, not to
  produce a scoreboard against frontier models.