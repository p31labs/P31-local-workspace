-- The music maker's committed composition log, D1-backed. Same shape as the
-- Loom's events table: one row per event, seq is the gate-assigned monotonic
-- id, `data` holds the full LoomEvent JSON so the canon's replay reconstructs
-- events exactly. prev_hash links each row to the one before it (SHA-256 of
-- the previous row's canonical preimage) — the composition's tamper-evidence
-- layer. The music maker's committed events (instrument.zone.place/clear/name)
-- share this gate and chain semantics with the Loom's log.
CREATE TABLE IF NOT EXISTS events (
  seq INTEGER PRIMARY KEY,
  ts  TEXT NOT NULL,
  data TEXT NOT NULL,
  prev_hash TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT 'shared'
);

CREATE INDEX IF NOT EXISTS events_ts ON events(ts);