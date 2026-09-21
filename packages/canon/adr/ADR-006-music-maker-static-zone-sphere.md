# ADR-006-the-music-maker-uses-a-static-zone-sphere-with-a-moving-listener

## Status

**Status**: Accepted

## Context

The spatial music maker places sounds in a 3D field. Two shapes were
considered: the zones move and the listener stays fixed, or the zones stay
fixed and the listener moves. For a family instrument — a 7-year-old, a
10-year-old, and a 70-year-old hearing each other play live across devices —
the interaction must be legible with one finger, on a phone, with no VR
headset and no gyroscope permissions.

## Decision

The zones sit on a **static sphere** (phyllotaxis placement by default;
human-placed positions win). The **listener moves** via a one-finger drag
("one finger is you"). The camera orbits with two fingers or a mouse drag.
This maps directly onto `AudioListener.setPosition()`/`setOrientation()` —
the Web Audio spatialization model is the coordinate system, so the audio and
the visuals never disagree.

## Consequences

- The listener's position is the only thing that changes in the audio graph
  per frame, throttled to animation-frame rate.
- Device-orientation (gyroscope) navigation is deferred — it would add
  permission complexity and an accessibility surface the touch model does not.
- The "planetarium you can hear" metaphor holds: you walk around a fixed
  constellation of sounds.

## Considered alternatives

- **Moving zones, fixed listener** — rejected. The zones ARE the composition
  (placed, committed, replayable); moving them per listener-frame would blur
  the score and the performance. Committed vs. ephemeral (ADR-008) depends on
  zones being stable.
- **Device-orientation listener control** — rejected for v1. Permissions,
  uneven browser support, and no keyboard equivalent; the drag model is
  pointer- and keyboard-reachable.