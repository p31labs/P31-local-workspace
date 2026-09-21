# ADR-002-the-artifact-is-a-button-not-a-preview-image

## Status

**Status**: Accepted

## Context

Chapter 5 ("Look what we made") shows the child the artifact they created with
Lumi. Two renderings were possible: a preview image (a snapshot of the made
thing) or a live button that responds to a tap. The chapter's promise, from
the master prompt, is that the artifact is *alive* — "proves it works." A
preview proves it rendered; a button proves it exists.

## Decision

The artifact is a **button** (`made-artifact-btn`), styled with the family
tokens, that commits a `focus` event when tapped and celebrates with a pulse
driven by `animationend`. The tap is the proof: it writes to the log, so the
artifact is real because it acted, not because it was drawn.

## Consequences

- The artifact is verifiable through the log: `artifact.tap` appears as a human
  `focus` event on `artifact`, which a reviewer can see in `/provenance`.
- The companion view derives "what we made" from the log, not from a rendered
  preview — the elder sees the artifact the child actually made.
- A preview would have been a dead end: it could not write to the log, and it
  would have made the child's tap decorative.

## Considered alternatives

- **Preview image (snapshot)** — rejected. Static, non-interactive, cannot
  prove it works. A snapshot of a button is not a button.
- **Preview with a separate "tap me" affordance** — considered. Adds a second
  control to prove what the first one already could; the extra step is exactly
  the cognitive load the family floor exists to avoid.
- **Animation on load (no tap)** — rejected. Auto-advancing breaks the
  "nothing moves without a tap" rule and the reduced-motion phase machine.