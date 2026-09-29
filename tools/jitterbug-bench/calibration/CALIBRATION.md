# Judge Calibration

Run: 2026-09-29
Human verdicts: 22 of 22

| Metric | Value | Trust bar | Pass |
|---|---|---|---|
| Raw agreement | 0.909 | >= 0.8 | YES |
| Cohen's kappa | 0.818 | >= 0.6 | YES |
| Negative-criteria agreement | 0.500 | (informational) | — |

**Verdict: JUDGE CALIBRATED — scores are authoritative.**

## Confusion matrix (human → judge)

| | Satisfied | Partially | Not Satisfied |
|---|---|---|---|
| **Satisfied** | 11 | 0 | 2 |
| **Partially** | 0 | 0 | 0 |
| **Not Satisfied** | 0 | 0 | 9 |

## Next step
The frontier comparison leg (run-bench.mjs --models glm-5.3,deepseek-v4-pro) is now valid. Run it.