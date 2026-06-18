# Architecture: Data Layer

## State Representation

State is split into two append-only layers plus a structured document:

- `health.jsonl` — append-only event log (sensor readings, scram events, CANARY status); one object per line
- `health-summary.json` — materialized rollup derived from `health.jsonl` (windowed aggregates)
- `cognitive-passport/` — directory of `*.json` documents (promises, commitments, relationships)

All local state lives under `~/.p31/`. No database server is required for local-first operation.

## CRDT Strategy

LWW-Register (Last-Writer-Wins Register) per entry:

```json
{
  "node-id": "hostname-uuid",
  "ts": "2026-01-01T00:00:00Z",
  "value": { ... }
}
```

- `node-id` identifies the originating node (hostname + short UUID).
- `ts` is UTC ISO-8601; monotonic within a node.
- Merge rule: highest `(ts, node-id)` pair wins lexicographically.

This is sufficient for the current single-writer local filesystem case and scales to multi-node without requiring vector clocks or DAG metadata.

## Sync Protocol

- Gate: `scripts/redboard-scram.sh check` runs before any outbound sync.
- If clear: `rsync` copies `cognitive-passport/` and `health.jsonl` to the peer target.
- If Red Board is active: sync is refused to prevent state overwrite during a scram or recovery window.

No DHT, no gossip layer, no DAG. Sync is explicit, push-only, and scheduled.

## Conflict Resolution

- **Local always wins.** The local copy is the source of truth during merge.
- Remote state is treated as a bookmark/replica only.
- Given LWW-Register ordering, any divergent entry will resolve to the highest `(ts, node-id)` — which will be the node with the most recent local clock, i.e., local if it is the writer.

## Current Implementation

Local filesystem only in this version. Peer sync via rsync is available but no automated peer is configured by default. Manual invocation of `scripts/sync-passport.sh` is required until relay infrastructure is added.

## Future

- **Yjs CRDT** — replace LWW-Register with Yjs for structured, JSON-aware conflict-free state. Allows concurrent edits to nested fields without full-document LWW collisions.
- **PGlite** — browser-side local-first persistence via SQLite compiled to WASM. Enables offline-first sync from the PWA tier without an IndexedDB bridge shim.
