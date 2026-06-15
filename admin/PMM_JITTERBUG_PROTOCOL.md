# PMM Jitterbug Protocol — Quantum Maturity Oscillator

**Schema:** `PMM_JITTERBUG=1.0`
**Date:** June 15, 2026
**Status:** Live

A continuous, self-regulating maturity system for the P31 monorepo. Every artifact is a quantum particle whose maturity state fluctuates based on health signals, time decay, and entanglement bonds. No manual grading — the system dances.

---

## Core Metaphor

| Quantum Concept | PMM Mapping |
|----------------|-------------|
| Particle | Artifact (package, worker, app) |
| Energy level | Maturity stage (SEED → FRUIT) |
| Decoherence | Score decay from neglect, test failure, dependency rot |
| Entanglement | Mutual reinforcement between integrated artifacts |
| Zero-point jitter | Random perturbation preventing threshold lock |
| Wavefunction collapse | Stage transition when continuous score crosses threshold |
| Depressed state | Artifact flagged for repair (forced SEED) |

---

## Architecture

```
┌──────────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  grading-index.json  │────→│  jitterbug       │────→│  grading-index   │
│  (static snapshot)   │     │  daemon.py        │     │  (updated state) │
└──────────────────────┘     │                  │     └──────────────────┘
                             │  - decay         │            │
  ┌──────────────────┐       │  - reinforcement │            ↓
  │  CI test results  │────→│  - entanglement  │     ┌──────────────────┐
  │  (signals.json)   │      │  - jitter        │     │  GRADING_REPORT  │
  └──────────────────┘       │  - depression    │     │  (with changelog)│
                             └──────────────────┘     └──────────────────┘
```

### Inputs

1. **`grading-index.json`** — current state (static scores from `grade-repo.py`)
2. **`jitterbug-signals.json`** — CI health signals (written by CI pipeline)
3. **Git timestamps** — last modification time per artifact

### Outputs

1. **Updated `grading-index.json`** — with `continuous_scores`, `depressed` flag, `entanglement_partners`
2. **Change log** in report showing what moved and why

---

## Decay Rates (Entropy)

Each dimension decays per hour since last positive signal. Rates tuned so a neglected artifact drops one stage in ~14 days.

| Dimension | Decay/hr | Decay/day | Rationale |
|-----------|----------|-----------|-----------|
| CODE | 0.001 | 0.024 | Code doesn't rot quickly |
| TEST | 0.002 | 0.048 | Tests go stale over time |
| DOCS | 0.004 | 0.096 | Docs drift fastest |
| OPS | 0.002 | 0.048 | Build scripts can rot |
| SEC | 0.003 | 0.072 | CVEs appear weekly |

An artifact with overall 3.5 decays to 2.5 in ~14 days with no signals.

---

## Signals (Positive Reinforcement)

| Signal Source | Effect | Trigger |
|--------------|--------|---------|
| Tests pass | TEST += 0.2, refresh timestamp | CI run with passing tests |
| Build succeeds | CODE += 0.1, refresh timestamp | CI build green |
| New test file detected | TEST += 0.3 | Git diff shows new `*.test.*` |
| Commit to artifact | CODE += 0.05 | Git log shows changes |
| Deploy succeeds | OPS += 0.2 | Deploy workflow green |
| Dependencies updated | SEC += 0.2 | Lockfile changed |
| Coverage threshold met | TEST += 0.3 | Coverage report ≥ 50% |

Signals have diminishing returns: applying the same signal 10x in an hour only counts once.

---

## Entanglement (Mutual Reinforcement)

When artifact A depends on B (or they share an integration test), they are **entangled**. Both get a boost when both are healthy.

**Rule:** If both A and B have `overall_score ≥ 3.0`:
- A.TEST += 0.05
- B.TEST += 0.05

**Collateral damage:** If A depends on B and B is depressed (overall < 1.5):
- A.TEST -= 0.1
- A.depressed_if_no_mitigation = True

Entanglement bonds are declared in a `jitterbug-entanglements.json` file or inferred from package.json dependency graphs.

---

## Quantum Jitter

Small random perturbations to prevent threshold lock:

```
jitter = normal(mean=0, std=0.02)
overall_score += jitter
```

Clamped to [1.0, 5.0]. Jitter recalculated each tick. This ensures an artifact at exactly 2.499 doesn't oscillate indefinitely — it eventually tips.

---

## Stage Transition Rules

| Stage | Continuous Score | Conditions |
|-------|-----------------|------------|
| SEED | < 1.5 | — |
| SPROUT | 1.5 – 2.49 | — |
| SAPLING | 2.5 – 3.49 | — |
| BLOOM | 3.5 – 4.49 | No depressed dependents |
| FRUIT | ≥ 4.5 | All dimensions ≥ 4.0, no depressed dependents, OQE verified |

---

## Depression State

An artifact enters **depressed** state when:
1. `overall_score < 1.2` (critical decay)
2. OR `test_failures > 0` in the last CI run AND `overall_score < 2.0`
3. OR any dependent is depressed AND it has no entanglement partners to buffer

Depressed artifacts:
- Stage forced to SEED regardless of individual dimension scores
- Flagged with `depressed: true` in the index
- Added to "repair queue" in the report
- Their entanglement partners get a collateral damage penalty

An artifact exits depression when:
1. `overall_score ≥ 2.0` AND
2. No test failures in last CI run AND
3. No depressed dependents

---

## Tick Cycle (Daemon Run)

Each invocation of `jitterbug-daemon.py`:

1. **Load** current state from `grading-index.json`
2. **Load signals** from `jitterbug-signals.json` (if exists)
3. **Apply decay** — reduce scores by decay_rate × hours since last refresh
4. **Apply signals** — boost scores from CI health data
5. **Apply entanglement** — boost/penalty based on partner states
6. **Apply jitter** — random perturbation
7. **Check transitions** — update stages based on continuous scores
8. **Check depression** — flag/unflag depressed artifacts
9. **Write** updated `grading-index.json` with delta log
10. **Append** to `GRADING_REPORT.md` change log section

---

## Files

| File | Purpose |
|------|---------|
| `scripts/jitterbug-daemon.py` | The daemon |
| `admin/PMM_JITTERBUG_PROTOCOL.md` | This spec |
| `jitterbug-signals.json` | CI signal input (optional, created by CI) |
| `jitterbug-entanglements.json` | Entanglement bond declarations (optional) |
| `grading-index.json` | State (read + write) |
| `GRADING_REPORT.md` | Human-readable report (appended) |
