-- LOVE ledger court-admissible hash chain (002).
-- Appended to the love-ledger D1 schema. Applied with:
--   wrangler d1 execute love-ledger --remote --file=software/workers/migrations/002_love_chain.sql
CREATE TABLE IF NOT EXISTS love_chain (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_type TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  prev_hash TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_love_chain_prev ON love_chain (prev_hash);
CREATE INDEX IF NOT EXISTS idx_love_chain_created ON love_chain (created_at DESC);
