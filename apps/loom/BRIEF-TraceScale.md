# UI Brief: TraceScale

**Status:** Move B of the field-frontend rebuild. Grounded on the §11 redline
(`layoutTrace` is a placeholder, `layout.ts:273-286`) and on deep research
(waterfall-not-flame, real-time axis, virtualization ≥200 rows, actor lanes).

## What

A DOM waterfall (not canvas) listing every trace that touched the focused
edge, one row per trace, on a real time axis — the atomic end of the zoom.

## Where

- `apps/loom/src/components/TraceScale.tsx` — new DOM component (no canvas).
- `apps/loom/src/App.tsx` — new `focusedEdge` state + render `TraceScale`.
- `apps/loom/src/components/Instrument.tsx` — emit an `onEdgeFocus` callback on edge click.
- `packages/field/src/layout.ts` — `layoutTrace` stays a placeholder (the trace
  scale reads `Trace[]` directly, not Scene primitives; it is text).

## State — decision (settled)

**Traces are zone-scoped, not edge-scoped.** `Trace.zone` (`index.ts:42`) names
a zone; nothing in the model attaches a trace to a specific K₄ *edge*. The zone
scale's four vertices are also generic (`['component','class','token','theme']`),
not the zone's real `vertices` (`index.ts:64`). So "traces touching this edge"
has no current data-source definition.

Two options were considered; **A is decided**:

- **(A) Minimal correct cut:** the trace scale lists **all traces
  at the focused zone**, regardless of which edge was clicked. The edge click
  is the *entry gesture*, not a filter. Correct today, no new model.
- **(B) Edge-granular (deferred):** invent a `frame` (or `kind`) → edge mapping
  (e.g. `structure` → component↔class edge) and filter by it. Requires agreement
  on the mapping and a substrate change.

This brief specifies the UI against option A. B is a deferred follow-up, not built.

## Writes

None. Read-only. Traces already flow through `useInstrument` (`tracesFromWarp` +
`tracesFromWeft`); the component reads them, never writes.

## Existing similar

`EventOverlay` (`apps/loom/src/components/EventOverlay.tsx`) — the existing
read-only sidebar list. Mirror its callback-only, token-only structure. But
TraceScale is **time-positioned** (waterfall), not a flat `<ul>`.

## Design tokens

- `--p31-frame-*` (from Move A) — the colored pill per trace.
- `--p31-text` / `--p31-text-secondary` / `--p31-text-tertiary` — row text, metadata, axis.
- `--p31-accent` — the "now" cursor.
- `--p31-surface`, `--p31-glass-border` — row hover + lane dividers.

## Constraints (from the research)

- **Waterfall, not flame.** One row per trace, time-ordered, no nesting — the
  Loom's traces are events, not nested spans (Logz.io: "waterfall = one row per
  span, in time order — what happened, and when").
- **Real time axis, not ordinal.** X position is `trace.ts` on a wall-clock
  axis. This is the exact bug the QoderAI spec names: an ordinal axis "showed no
  waiting" for a 3.9 h session. A 4-hour gap renders as space, not adjacency.
- **Zoom-to-fit on mount.** The time axis fits its content; not fixed-density
  horizontal scroll ("only 29% of the chart was on screen at once" was a rejection).
- **Virtualize with a hand-rolled windowing hook** above ~200 rows (a busy zone
  accumulates hundreds of traces). Below 200, plain render is fine. No
  `@tanstack/react-virtual` — the list is fixed-row-height, so a ~40-line
  windowing hook (render only the visible slice + overscan, `onScroll` +
  `requestAnimationFrame` throttle) is sufficient and avoids a new dependency
  (the UI rules require written approval for new libraries; a hand-rolled hook
  needs none, and the codebase already favors hand-rolled hooks: `useLoomState`,
  `useInstrument`).
- **Overlap detection** at the current zoom: aggregate traces within a minimum
  pixel distance into one clustered row labeled `[N]`; expanding shows them.
- **Group by day** (Cloudscape agent-timeline): a divider + label (`Today` /
  `Yesterday` / absolute date) when activity spans dates.
- **Row content:** actor · frame (colored pill from Move A) · coherence
  (`in-lane` / `out-of-lane`) · outcome (`success` / `failure` / `—`) · `ts` in
  locale. No payload, no preImage/postImage in the list (those are a detail
  drill-down, out of scope).
- **No new libraries.** Hand-rolled windowing hook only; React + `resolveToken` as elsewhere.

## Acceptance

- [ ] `TraceScale` renders a time-positioned waterfall, one row per trace, grouped by day.
- [ ] X axis is wall-clock time; a multi-hour gap renders as horizontal space (test with two traces 4 h apart).
- [ ] Virtualizes at > 200 rows via a hand-rolled windowing hook; < 200 renders plainly.
- [ ] Overlapping traces at a zoom aggregate to `[N]`; expanding shows individuals.
- [ ] Frame pill uses `--p31-frame-*` (no bare colors).
- [ ] Clicking a K₄ edge in the Instrument opens `TraceScale` for the focused zone (option A).
- [ ] `pnpm --filter @p31/loom typecheck` + `test` green; no new write paths (grep `fetch|localStorage` clean).
- [ ] Reduced-motion: no animation; the list is static text.
- [ ] Edge-granularity (option B) is recorded as a follow-up in the brief, not built.
