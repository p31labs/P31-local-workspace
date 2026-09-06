-- LOVE Ledger attestations table (003).
-- Tracks pairwise care interactions for DRRP (Diminishing Returns on Repeated Pairings).
-- Applied with:
--   wrangler d1 execute LOVE_DB --remote --file=workers/federation-bridge/migrations/003_attestations.sql

CREATE TABLE IF NOT EXISTS attestations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pair_id TEXT NOT NULL UNIQUE,
  giver_did TEXT NOT NULL,
  receiver_did TEXT NOT NULL,
  action TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  last_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_attestations_pair ON attestations (pair_id);
CREATE INDEX IF NOT EXISTS idx_attestations_giver ON attestations (giver_did);
CREATE INDEX IF NOT EXISTS idx_attestations_receiver ON attestations (receiver_did);
