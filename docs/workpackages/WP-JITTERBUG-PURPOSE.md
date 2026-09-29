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

| Dimension | Metric that matters | Current value | Target |
|---|---|---|---|
| Quality | rubric compliance | 0.604-0.719 (noisy) | >= 0.80 (parity-adjacent) |
| Cost | quality-per-dollar (compliance / model cost) | high per-prompt cost | >= 3x frontier per dollar |
| Sovereignty | zero frontier-model dependency | satisfied | holds |
| Governance | every artifact hash-linked + audited | satisfied | holds |

The comparison against glm-5.3 (0.856) is NOT the scoreboard. The scoreboard
is: "can a sovereign pipeline reach quality-parity-adjacent at a fraction of
the cost, without any vendor lock?" If the answer is 0.80+ at 3x the
quality-per-dollar, the Jitterbug wins its objective even while glm-5.3 wins
the single-prompt comparison.

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
  gap. Do not optimize speed further until quality reaches the 0.80 target.
- The benchmark's job is to measure progress toward THIS objective, not to
  produce a scoreboard against frontier models.