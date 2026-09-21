-- The Loom's log, D1-backed. One row per event; seq is the gate-assigned
-- monotonic id. The full event JSON lives in `data` so the canon's replay can
-- reconstruct LoomEvent objects exactly. The gate (writer-per-kind, duplicate
-- proposal detection) is replayed over the existing rows before appending.
-- prev_hash links each row to the one before it (SHA-256 of the previous
-- row's canonical preimage) — the log's tamper-evidence layer. The genesis
-- row carries ''.
CREATE TABLE IF NOT EXISTS events (
  seq INTEGER PRIMARY KEY,
  ts  TEXT NOT NULL,
  data TEXT NOT NULL,
  prev_hash TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS events_ts ON events(ts);