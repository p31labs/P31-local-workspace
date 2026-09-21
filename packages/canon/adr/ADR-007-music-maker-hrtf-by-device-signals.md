# ADR-007-the-music-maker-picks-HRTF-by-device-signals-never-by-probe

## Status

**Status**: Accepted

## Context

The IEEE 2025 WebXR study is the strongest evidence available: PannerNode with
HRTF significantly outperforms equalpower for sound localization, especially
for back-positioned sources, with no penalty in cognitive workload or
simulator sickness. But HRTF is the most processor-intensive node in the Web
Audio graph, and Mobile Safari has limited HRTF/ConvolverNode support. The
first proposal measured HRTF cost with a runtime probe (create N panners, time
it). It was wrong: creating a PannerNode does not load the HRTF database —
that happens on the first audio sample it processes, too late to switch. A
"probe" that times panner creation returns ~0ms on every device and caches a
fake result.

## Decision

The panning model is chosen by **device signals, never by a runtime probe**:

1. Forced/opt-in equalpower → equalpower.
2. Mobile Safari (UA) → equalpower (limited HRTF/ConvolverNode; also the
   browser without Web MIDI — one family-browser gate).
3. Low-end signal (`hardwareConcurrency ≤ 4` or `outputLatency > 50ms`) →
   equalpower.
4. Otherwise → HRTF, cached in sessionStorage for the session.

No panner is created to "measure" HRTF. The real cost is only measurable on
first audible output, which is after the decision must be made.

## Consequences

- A low-end Android phone and any Safari device get equalpower silently —
  interaction identical, fidelity lower, no "degraded quality" messaging.
- Capable non-Safari devices keep HRTF, which the research says is the
  localization winner.
- The decision is stable within a session (sessionStorage) so a toggle-off /
  toggle-on doesn't re-decide.

## Considered alternatives

- **Runtime HRTF probe (create + time panners)** — rejected. Measures
  nothing (the DB loads on first audio, not creation), caches a fake result.
- **Default equalpower everywhere** — rejected. The research shows HRTF wins;
  the family instrument should use it where the device can afford it.
- **Always HRTF** — rejected. Mobile Safari and low-end Android would jank on
  the first note.