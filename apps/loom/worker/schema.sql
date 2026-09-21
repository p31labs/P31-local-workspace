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
  prev_hash TEXT NOT NULL DEFAULT '',
  scope TEXT NOT NULL DEFAULT 'shared'
);

CREATE INDEX IF NOT EXISTS events_ts ON events(ts);

-- SBT anchors: the QPJ portal's client-side SBT hash chain, witnessed by the
-- Loom. Each row stores one anchored block per DID, with the block's own hash
-- (QPJ's convention) as the witness value and the block linkage so a walk can
-- prove no anchored block was rewritten. entry_hash is the LOVE-format
-- LOOM_SBT commitment. (did, block_number) is the per-DID chain cursor.
CREATE TABLE IF NOT EXISTS sbt_anchors (
  did TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  block_hash TEXT NOT NULL,
  prev_block_hash TEXT,
  payload TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (did, block_number)
);

CREATE INDEX IF NOT EXISTS sbt_anchors_did ON sbt_anchors(did, block_number);