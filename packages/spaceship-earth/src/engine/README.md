# Spaceship Earth — the quantum machine (engine architecture)

> ⚠️ **HONEST LABEL.** This engine binds the ship's UI to the contested-science
> math in `@p31/quantum-core` (SIC-POVM, Posner molecules, morphogenetic
> fields). That underlying science is a **metaphor, not established fact**. No
> medical or scientific claims are made anywhere in this system. Every engine
> file carries the same disclaimer. See `packages/quantum-core/src/*` and
> `QF1_CONTESTED_SCIENCE.md`.

The cockpit is **one self-adapting machine** built from five composable engines.
Observable user state flows into a SIC-POVM measurement, out to coherence /
mesh / layout, and observed outcomes are folded back in — so the ship's state
**evolves over a session** instead of being a pure function of the spoon slider.

```
 spoons / care / engagement
        │
        ▼
   ┌──────────── Phase 1: SIC-POVM state engine (stateEngine.ts) ───────────┐
   │  UserState ─▶ density matrix ρ ─▶ sicPovmProbabilities(ρ)               │
   │  ─▶ { explore, create, connect, reflect }  (a SUPERPOSITION, sums to 1) │
   │  ─▶ entropy (dispersion / coherence proxy)                              │
   └───────────────────────────────┬────────────────────────────────────────┘
                                    │ modes + entropy
        ┌───────────────┬──────────┼───────────────┬───────────────┐
        ▼               ▼          ▼                ▼               │
  Phase 2: K₄      Phase 3:    (drives HUD)    Phase 4:            │
  skeleton         Posner                       morphogenetic       │
  (k4Binding.ts)   coherence                    layout              │
  live curvature   (coherence.ts)               (layoutField.ts)    │
  mesh from        ▸ biometrics                  ▸ HUD panel         │
  relay ping +     ▸ field order/chaos             position/scale/  │
  activity         ▸ Fawn-Guard gating             opacity from a   │
                                                    recursive field  │
                                                    seeded by        │
                                                    passport+spoons  │
                                                    +session age     │
        │               │                                            │
        └───────────────┴──────────── outcomes ─────────────────────┘
                                    │ (transmit, coherence, care)
                                    ▼
   ┌──────────── Phase 5: feedback loop (feedbackLoop.ts) ──────────────────┐
   │  FeedbackState = bounded EWMA memory of engagement / coherence / care   │
   │  applyFeedback(raw, memory) ─▶ effective UserState ─▶ back to Phase 1   │
   │  runFeedbackCycle folds (1 - entropy) coherence back each measurement   │
   └────────────────────────────────────────────────────────────────────────┘
```

## The five phases

| Phase | File | What it does | Canonical math |
|-------|------|--------------|----------------|
| 1 | `stateEngine.ts` | Encodes user state as a 2×2 density matrix, measures it via the SIC-POVM into four **ship-mode** probabilities (a continuous blend, never a hard toggle) + entropy. | `@p31/quantum-core` `sicPovmProbabilities`, `verifySicPovm` |
| 2 | `k4Binding.ts` | Builds the live **K₄ skeleton** (4 subsystems / 6 edges) with edge health from Ricci curvature over relay RTT + activity. Feeds `DeltaMesh`. | `RicciMath` (Ollivier–Ricci) |
| 3 | `coherence.ts` | Derives **Posner coherence** from spoons + engagement + entropy; drives `ProofOfCare` biometrics, `MolecularField` order/chaos, and coherence-gated Fawn-Guard. | `@p31/quantum-core/posner` `createPosnerState`, `updatePosnerCoherence` |
| 4 | `layoutField.ts` | A recursive **morphogenetic field** (seeded by passport hash + spoon energy, depth = session age) lays out the HUD panels — **CSS/token-only**, never restructures the DOM. | `@p31/quantum-core/morphogeneticField` (uses `PHI` from `@p31/design-core/math`) |
| 5 | `feedbackLoop.ts` | **Closes the ring.** A bounded EWMA of observed outcomes blends into the SIC-POVM inputs so the ship adapts over the session. Lives in the store as `feedback`. | composes Phase 1 |

## Wiring

- **Store** (`sovereign/useSovereignStore.ts`): holds `modeProbabilities`,
  `modeDominant`, `modeEntropy`, `engagement`, and `feedback`. `measureState()`
  runs a full `runFeedbackCycle`; `recordOutcome()` folds an outcome without
  re-measuring; `setEngagement()` folds + re-measures.
- **App** (`App.tsx`): mirrors the spoon slider into the store and calls
  `measureState()`; builds `shipK4` (Phase 2), `shipCoherence` (Phase 3), and
  `layout` (Phase 4); the Whale-Channel transmit handler records coherence +
  raises engagement, driving a full outcome → memory → re-measure cycle.

## Honest engine properties (verified, not idealized)

These are **real behaviors of this SIC-POVM mapping**, encoded truthfully in the
tests rather than assumed:

- **A pure-diagonal ρ (engagement = 0) measures UNIFORMLY (0.25 each)** —
  energy (spoons) alone does *not* differentiate the modes. Spoons only shape
  the distribution once a **connection** signal (off-diagonal / engagement > 0)
  is present.
- **Entropy falls as engagement rises and SATURATES at 0.5** for engagement ≥ 5
  (1.0 at eng=0 → 0.5 at eng=5+). So the coherence signal is only expressive in
  the low-engagement regime.
- `sicPovmProbabilities` returns **sub-normalized** projectors; the engine
  normalizes them to a proper distribution.

## Spoon scale

The ship uses the **canonical P31 scale of 0–5** (`DESIGN.md` `data-spoons`),
single-sourced through `maxSpoons` in the store and `MAX_SPOONS` in `App.tsx`.
The state engine internally expects a 0–5 energy axis; the store normalizes
`spoons / maxSpoons * 5` so any UI scale stays correct.

## Known gaps (honest current state)

- **Relay** (`sovereignRelay`) is client-complete but a **no-op** until
  `VITE_RELAY_URL` is set → `pingMs = 0` → K₄ edges degrade honestly.
- **Somatic biometrics** (`somaticHrv` / `somaticHr`) are `0` until real
  hardware feeds them; `ProofOfCare` falls back to a **coherence-derived**
  proxy (deterministic, not fabricated random values).
- **`didKey`** defaults to `UNINITIALIZED`, so all users share one layout seed
  until an identity is generated (deterministic; diverges once a DID exists).
- Phase 4 layout **re-seeds on spoon change**, not on a per-second ticker, so
  session-depth evolution advances in steps, not continuously.

## Tests

Per-phase suites plus a cross-phase integration test that drives a real
`spoons → transmit → re-measure` cycle and asserts the whole ring moves:

`stateEngine` · `k4Binding` · `coherence` · `layoutField` · `feedbackLoop` ·
`integration` (all under `src/__tests__/`).

```bash
npx vitest run          # full ship suite
```
