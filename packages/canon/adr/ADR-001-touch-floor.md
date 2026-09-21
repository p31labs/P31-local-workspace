# ADR-001-the-family-touch-floor-is-48px

## Status

**Status**: Accepted

## Context

The master prompt fixes three audiences: a 7-year-old, a 10-year-old, and a
70-year-old. WCAG 2.2 sets the AA target-size minimum at 24×24px and the AAA
enhanced floor at 44×44px; Apple's HIG and Material's 48dp both land near 48.
The Web Content Accessibility Guidelines Working Group polled in March 2026 on
raising the AA minimum — the direction of the standard is up, not down. A
design system built for a family needs one number that the entire surface
holds to, not a menu of floors.

## Decision

`--p31-touch-min` is **48px** (the family floor), with `--p31-touch-recommended`
at 56px and `--p31-touch-large` at 64px for the child and elder surfaces. Any
control a child or elder touches is at least 48×48px. The instrument chrome
(the fourth audience — the developer) may hold a 44px floor, but nothing the
three humans touch goes below 48.

## Consequences

- Exceeds WCAG 2.2 AAA (44px) and Material (48dp) for the family surfaces.
- The chapter buttons, the launchpad Start, the elder's door, and every
  `[data-agent-action]` element are audited against 48px in the human
  walkthrough e2e — a regression fails the build, not a review.
- Density is capped: a 48px floor means fewer controls per screen. This is a
  feature for the three humans, and the trade the instrument accepts.

## Considered alternatives

- **24px (WCAG AA minimum)** — rejected. Legally sufficient, wrong for a
  child and an elder. A compliance floor is not a family floor.
- **44px (WCAG AAA / Apple)** — considered. Above AA but below the point where
  a 70-year-old's hand lands comfortably. The research on older-adult web use
  names "reduced cognitive load and intuitive navigation" as the real
  barriers; target size is part of that, and 48 is the researched number.
- **No floor (per-component)** — rejected. Per-component floors drift; a
  system floor is auditable in one place.