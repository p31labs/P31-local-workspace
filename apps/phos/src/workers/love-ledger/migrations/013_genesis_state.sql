-- 013_genesis_state.sql
-- Genesis activation state: first Node Zero ping unlocks the Reunion Protocol.
-- Single-row table (id=1) — only the first successful care-proof sets this.

CREATE TABLE IF NOT EXISTS genesis_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  unlocked INTEGER DEFAULT 0,
  timestamp INTEGER,
  did TEXT,
  entry_hash TEXT,
  tx_hash TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Seed with locked state
INSERT OR IGNORE INTO genesis_state (id, unlocked) VALUES (1, 0);
