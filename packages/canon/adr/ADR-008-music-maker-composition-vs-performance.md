# ADR-008-the-music-maker-splits-composition-and-performance

## Status

**Status**: Accepted

## Context

A collaborative spatial instrument has two kinds of state that must not be
confused. The score — which zones exist, where they are, what they're called —
is a shared artifact the family builds together and wants to revisit. The
performance — who touched which zone, right now — is a live act that is gone
the instant it happens. The collaborative-music literature (Yjs awareness vs.
document; MusicColab/VHV's kern-document-vs-activity split) converges on this
separation. The canon already provides a tamper-evident append-only log with a
gate; the music maker inherits it.

## Decision

- **Composition is COMMITTED.** `instrument.zone.place` / `clear` / `name`
  are canon `LoomEvent` kinds, gate-validated, seq-stamped, hash-chained,
  written to D1. Replayable and provenance-tracked like every other log entry.
- **Performance is EPHEMERAL.** The live act of a zone sounding when touched
  is broadcast over the WebSocket and never reaches the log — no seq, no
  hash, no persistence.

This is the log/presence split (build prompt §6, Option B): committed events
through the gate + D1, ephemeral presence through the Durable Object's
WebSocket fan-out.

## Consequences

- The composition replays deterministically — reload the same committed log
  and the same sphere appears.
- There is no audit trail of "who played what when" by default. Adding one is
  a deliberate scope decision (privacy + storage shape), not an accident to
  backfill.
- No CRDTs are needed: the log is append-only and single-writer-per-event, so
  the concurrent-edit problem CRDTs solve does not exist here.

## Considered alternatives

- **Persist every trigger** — rejected. The performance is high-frequency,
  privacy-sensitive (who played what when), and not the artifact. Persisting
  it would change the storage and privacy shape of the whole feature.
- **Use Yjs for both** — rejected. The log already gives composition its
  correctness; Yjs would add a second consensus mechanism for a problem the
  append-only log does not have.