# N=3 Variance — Jitterbug compliance (temperature-0 judge)

**Status:** COMPLETE (2026-09-29). The judge is temperature-0 and calibrated.
This measures the PIPELINE's run-to-run variance, the last unknown.

## Result

| Prompt | N1 | N2 | N3 | mean | std |
|---|---|---|---|---|---|
| 01-spoon-aware-adaptation | 0.500 | 0.806 | 0.583 | 0.630 | 0.158 |
| 02-family-safe-governance | 0.690 | 0.714 | 0.643 | 0.682 | 0.036 |
| 03-privacy-preserving-identity | 0.722 | 0.278 | 0.500 | 0.500 | 0.222 |
| 04-step-level-routing | 0.958 | — (crash) | 0.708 | 0.833 | 0.177 |

**Overall mean 0.646, std 0.179 (n=11).**

## The finding

**Single-run comparisons are not valid for this pipeline.** The per-prompt
std is 0.036-0.222; the overall std is 0.179. A single run could have scored
0.604 (early), 0.718 (N1), or 0.609 (N3) depending on luck.

Consequences:
1. **The frontier comparison must be re-read against the band.** jitterbug
   mean 0.646 ± 0.18 vs glm-5.3 0.856 (stable — frontier single-call is
   deterministic on a fixed prompt+system). The gap is real but its SIZE is
   ±0.18, not the raw difference.
2. **02-family-governance is the tightest (std 0.036)** — the most reliable
   single number in the bench. It is also the lowest-stability-needing prompt.
3. **03-privacy-identity is the noisiest (std 0.222)** — any single run's
   number on this prompt is essentially a coin flip. It should be re-run with
   a larger N before being used as a quality signal.
4. **The pipeline itself (facets + convergence + judge at temp 0) has
   irreducible variance.** Temp-0 removed judge noise; the residual is
   generation-level (different facet splits, different convergence outputs
   each run).

## Data provenance

- N1: `runs/2026-09-29-N1-fixed/results.json` (temp-0 judge)
- N2: recoverable only from `/tmp/bench-n3.out` stdout (p1 0.806, p2 0.714,
  p3 0.278; p4 lost to a directory collision — see SESSION-STATE finding)
- N3: `runs/2026-09-29-N3/results.json` (temp-0 judge)

## The rule this enforces

Every future bench claim must report **mean ± std over N≥3**, not a single
run. The purpose objective (quality ≥ 0.70) must be evaluated against the
band, not a point estimate.

## Cleanup owed

- `runs/2026-09-29-N2/` holds my compression diagnostics (mislabeled). Extract
  to `runs/compression/` and remove the wrong N2 label.
- The N=3 wrapper should use `--out N<k>` (committed) so no future run
  depends on mtime-guessing renames.