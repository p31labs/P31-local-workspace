-- LOVE Ledger — Hash Chain (court-admissible integrity)
-- Task 2 fix: this table was previously created out-of-band via a manual
-- `wrangler d1 execute`, so it was missing from version control and broke
-- reproducible redeploys. This migration makes it reproducible.
-- Matches the exact columns the deployed worker reads/writes
-- (see apps/phos/src/workers/love-ledger/index.ts INSERT at ~L257).
-- NOTE: `amount` is TEXT because the worker inserts String(body.amount).

CREATE TABLE IF NOT EXISTS love_chain (
  id TEXT PRIMARY KEY,
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  from_did TEXT NOT NULL,
  to_did TEXT NOT NULL,
  amount TEXT NOT NULL,
  type TEXT NOT NULL,
  signature TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_love_chain_from ON love_chain(from_did);
CREATE INDEX IF NOT EXISTS idx_love_chain_created ON love_chain(created_at DESC);
