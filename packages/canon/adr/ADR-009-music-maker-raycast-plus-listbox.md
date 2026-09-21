# ADR-009-the-music-maker-triggers-zones-by-canvas-raycast-plus-hidden-listbox

## Status

**Status**: Accepted

## Context

Zones are THREE.Points in a WebGL scene — no DOM element to click or focus.
The AAF contract needs every action discoverable (`data-agent-action`), and a
family instrument must be playable without a pointer: a 70-year-old using a
screen reader, or anyone on a keyboard, must be able to reach a zone. The
accessible-spatial-audio research (Hodr Engine, SoundSpace, Cosmic Sonar)
converges on keyboard navigation + announcement as first-class interaction, not
an afterthought.

## Decision

Two trigger paths, both calling the same `onZoneTrigger`:

1. **Canvas raycast tap.** A pointerup with <8px movement raycasts the zone
   under the cursor and triggers it. Each zone also has a clipped, non-
   interactive `<span>` with the AAF attributes (`instrument.zone.trigger`) —
   discoverable to agents and tests, never swallowing a drag.
2. **Hidden `role="listbox"`** of zones. Tab reaches it, arrow keys move
   selection (`aria-activedescendant` + `aria-selected`), Home/End jump,
   Enter/Space triggers. The live region announces the selected zone (name +
   height band) and the trigger.

The keyboard path is the accessible twin of the tap — same callback, same
announcement channel.

## Consequences

- Every zone is reachable by pointer, keyboard, screen reader, and agent.
- The hidden listbox is visually clipped like the agent spans, so it never
  covers the canvas.
- The selection announce (name + height) gives a non-visual user the spatial
  information a sighted user gets from looking.

## Considered alternatives

- **Per-zone tabbable `<button>`s** — rejected. With 8–16 zones, Tab would
  cycle through every one (many keystrokes, noisy tab order); the listbox
  concentrates them into one Tab stop with arrow-key movement.
- **Canvas tap only** — rejected. No keyboard equivalent; a screen-reader user
  cannot play the instrument at all.