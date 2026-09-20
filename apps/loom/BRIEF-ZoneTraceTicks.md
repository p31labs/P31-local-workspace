# UI Brief: ZoneTraceTicks

**Status:** Move A of the field-frontend rebuild. Grounded on the §11 redline
(finding 5: `layoutZone` drops every trace field except `ts`; no frame→color
mapping exists) and on deep research (sparkline markers, 4-category nominal
palette, two-clock decay).

## What

Render the zone scale's traces as a single time-axis sparkline beside the K₄:
one positioned marker per trace at the focused zone, ordered by `ts`, colored
by frame, sized by decay, aggregated when crowded. Ticks are **not** attached
to individual edges — traces are zone-scoped (`Trace.zone`), and the four K₄
vertices are generic kind labels (`['component','class','token','theme']`), so
there is no per-edge attribution to compute.

## Where

This is a **field-layer + render-layer** change, not a pure React component:

- `packages/field/src/layout.ts` — add `TickPrimitive`, widen `layoutZone`'s
  trace type, emit ticks, add frame→token mapping.
- `packages/field/src/index.ts` — re-export the new primitive + frame palette.
- `apps/loom/src/components/Instrument.tsx` — render ticks in the `draw()` loop.
- `packages/field/scripts/test-field-layout.mjs` — tick determinism tests.

## State (what exists today)

`Trace` (`index.ts:42`) already carries `frame: Frame` (`'structure' | 'connection' | 'rhythm' | 'creation'`), `ts`, `coherence`, `outcome`, `actor`. `layoutZone` currently takes `traces: readonly { ts: number }[]` and uses only `traces.length` (`layout.ts:205-208`). The `Frame` vocabulary exists; **no frame→color assignment exists anywhere.**

## Writes

None. This is render-only. The Instrument already receives `{ scene, reading, onFocus }` and dispatches callbacks only; ticks add no new write path.

## Design tokens

**Frame colors must be new, nominal, colorblind-safe, and OKLCH** — they cannot
reuse the hazard sequence (safe/amber/danger = green/gold/red) or the accent,
which already encode pressure/hazard/trust. Recommended: add four `--p31-frame-*`
tokens as semantic slots in `packages/canon/src/theming/theme-store.ts`
(`SEMANTIC_MAP`), then map them in `layout.ts` `PALETTE`.

Research constraints (colorarchive / SAS / palettecore):
- exactly **4 categories** (4 is the ceiling of legible categorical color)
- **≥ 15 OKLCH L units** of lightness difference between adjacent colors
- **temperature alternation** (cool / warm / cool / warm) so no gradient order is implied
- **nominal, not semantic** — no green-for-good / red-for-bad polarity

Palette — the Okabe-Ito colorblind-safe set (empirically validated for CVD, not
an invented ramp), converted to OKLCH. No separate audit needed: this IS the
published safe palette; the conversion is exact (sRGB → OKLab → OKLCH).

| Frame | Token | OKLCH (exact conversion) | Temp |
|---|---|---|---|
| structure | `--p31-frame-structure` | `oklch(73.5% 0.117 236.2)` | cool (sky blue `#56B4E9`) |
| connection | `--p31-frame-connection` | `oklch(75.3% 0.158 76.8)` | warm (orange `#E69F00`) |
| rhythm | `--p31-frame-rhythm` | `oklch(67.9% 0.118 346.3)` | cool (magenta `#CC79A7`) |
| creation | `--p31-frame-creation` | `oklch(62% 0.13 165.5)` | warm (green `#009E73`) |

Temperature alternates cool/warm/cool/warm. Two hues (orange ~77°, green ~165°)
sit near the hazard channel's green/gold, but on a different glyph (ticks, not
dot strokes) and position, so the channels stay separable.

Adding tokens flows through `pnpm gen:tokens` → `validate:contracts` →
`gen:dsds` (402 → 406 tokens) and `verify:parity`. All must stay green.
**Frame tokens are render metadata, not artifacts:** `gen-registry.mjs` keeps
`--p31-frame-*` out of `tokens` (in a separate `frames` array), so they do not
become field zones. The field's zone count stays 287; the adapters test asserts
*one-zone-per-artifact*, not an absolute count.

## Existing similar

The constellation's `DotPrimitive` — same "layout emits token name + numeric
encoding, render layer resolves" contract. Ticks follow it: a tick is a
sparkline **marker** (a positioned bullet), not a bar or a value label
(TIBCO/Oracle: "Markers are small bullets that mark the location of data points").

## Constraints

- **New primitive** — `Scene` gains `ticks: TickPrimitive[]`:
  ```ts
  interface TickPrimitive {
    t: number;                // position along the time axis ∈ [0,1], from trace.ts
    frame: Frame;             // → frame token
    size: number;             // ∈ [0,1], from decay
    traceSeq: number;         // future-use: click-to-drill (Move B option A)
  }
  ```
  The render layer decides the glyph (rect/circle/line); layout only emits
  position + frame + size.
- **Widen `layoutZone`** trace param from `{ ts: number }[]` to
  `Pick<Trace, 'ts' | 'frame'>[]` (structural — `useInstrument` already passes
  full `Trace` objects, so no call-site change).
- **Two-clock decay** (ANTON-SIFTA pulse + Ebbinghaus decay): a newly deposited
  tick pulses once (size × 1.5 over ~2 s), then decays to steady size via the
  field half-life. The pulse is render-layer; the half-life is already in the
  reading (`weight`).
- **Overlap aggregation** (QoderAI: 76% of marks drawn inside another mark's
  radius is a bug): when > 8 ticks land within any 40px window on the time axis
  at the current zoom, collapse them into a single cluster glyph labeled `[N]`
  at the centroid. Expanding the cluster on click drills to the trace scale. Not
  optional — the field is bursty.
- **Tokens, not colors** — `layout.ts` emits token names only; `test-field-layout.mjs`
  must still prove zero `var(`/`color-mix(`/`#`/`rgb(` in primitives.
- **No new libraries.** Canvas 2D + `resolveToken` (already in `Instrument.tsx`).

## Acceptance

- [ ] `layoutZone` emits ticks on a single time axis, positioned by `ts` mapped to [0,1]; no per-edge attribution.
- [ ] Tick `frame` maps to a `--p31-frame-*` token in `PALETTE`; no bare colors.
- [ ] `test-field-layout.mjs` gains tick cases: determinism (same input → same ticks, byte-for-byte), axis-position stability, tokens-not-colors.
- [ ] `Instrument.tsx` renders ticks via `resolveToken`; reduced-motion draws one static frame.
- [ ] A crowded axis (≥ 9 traces within 40px) renders `[N]` cluster, not overlapping marks.
- [ ] Frame tokens added to canon; `pnpm gen:tokens` + `validate:contracts` + `verify:parity` green; token count 402 → 406.
- [ ] `pnpm --filter @p31/field test` and `pnpm --filter @p31/loom typecheck` + `test` green.
- [ ] Click a tick/cluster → `TraceScale` opens for the zone (Move B option A); `traceSeq` is future-use only.
