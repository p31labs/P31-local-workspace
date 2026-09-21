# ADR-005-the-phase-machine-is-animationend-driven-never-settimeout

## Status

**Status**: Accepted

## Context

Every chapter runs a phase machine: `waiting → celebrating → celebrated`. The
celebrating phase must land and hand off to the next surface. Two ways to know
a celebration ended: a JS timer (`setTimeout`) or the CSS animation's
`animationend` event. The trap is subtle: `prefers-reduced-motion: reduce`
must not stall the arc. If reduced motion is "fixed" with `animation: none`,
the `animationend` event stops firing and every chapter stalls at celebrating.
If the fix is instead a timer, the timer runs regardless of motion — which is
fine for correctness but adds a second clock to sync.

## Decision

The phase machine is **driven by `animationend`**, and reduced motion is
handled by collapsing the animation duration (`--motion-scale: 0.01`), never
by `animation: none`. A collapsed animation resolves in ~12ms and fires
`animationend` almost instantly, so the celebrated phase lands with no
separate code path. The e2e reduced-motion spec proves every phase still
advances under `prefers-reduced-motion: reduce`.

## Consequences

- One clock: the CSS animation is the source of truth for "the celebration
  ended." No timer to drift or cancel.
- Reduced motion is a duration change, not a feature toggle — the machine is
  motion-agnostic.
- The invariant is load-bearing: `animation: none` anywhere in the family
  surface is a bug, and the reduced-motion e2e is the guard that catches it.

## Considered alternatives

- **setTimeout for the phase transition** — rejected. Introduces a second
  clock that must be canceled on unmount and kept in sync with the CSS. The
  reduced-motion collapse would still need its own handling.
- **`animation: none` under reduced motion** — rejected. Breaks the machine
  by stopping `animationend`; every chapter would stall at celebrating. This
  is the failure the e2e exists to catch.
- **matchMedia listener to switch timers** — rejected. More state, more paths;
  the collapse approach removes the need entirely.