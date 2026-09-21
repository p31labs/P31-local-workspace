# ADR-003-color-is-oklch-not-oklab-or-hsl

## Status

**Status**: Accepted

## Context

The canon stores every color as OKLCH — `oklch(l c h)` — and transforms colors
(sensory `muted` / `warmLight` modes, glass tints, theme accents) with OKLCH
math. Two alternatives were on the table: OKLab (a perceptual space with the
same colorimetry, but a Cartesian `L a b` shape) and HSL/hex (the legacy
default in most design systems). The question is not "which is prettier" — it
is which space makes the sensory transforms and the wide-gamut rendering
correct without hand-tuning.

## Decision

All new tokens are **OKLCH** (`--p31-bg`, `--p31-accent`, `--p31-text-*`, the
glass and surface slots). Perceptual uniformity is load-bearing: the `muted`
mode scales chroma; `warmLight` blends hue toward amber; a theme accent swap
must preserve perceived lightness. OKLCH makes those transformations
arithmetic on a perceptually-uniform space instead of guesses on hex. The
token generation emits hex fallbacks automatically for legacy browsers; the
source of truth is OKLCH.

## Consequences

- Contrast is measurable: WCAG/APCA checks run against the OKLCH-derived
  values, not against the hex fallback, so the perceptual math is what the
  audit sees.
- Wide-gamut P3 rendering works: OKLCH covers the P3 gamut natively; hex
  fallbacks cover sRGB-only displays.
- One cost: OKLCH is newer than HSL, so tooling and hand-readability take a
  moment. The token store centralizes it, so nobody hand-writes OKLCH except
  the store.

## Considered alternatives

- **OKLab** — rejected for the store. Same colorimetry, Cartesian shape; fine
  for computation but the `h` (hue) axis of OKLCH reads as a design intent
  ("accent at hue 195") while OKLab's `a/b` does not. The transforms we need
  are chroma-and-hue operations, which OKLCH expresses directly.
- **HSL/hex** — rejected. Non-uniform: changing hue or chroma by a fixed
  amount changes perceived lightness unpredictably. The sensory modes would
  have required per-color hand-tuning in every theme.
- **Hex everywhere + manual fallbacks** — rejected. A hex token is a dead
  value; it cannot be transformed at runtime. The whole point of the sensory
  layer is runtime transformation.