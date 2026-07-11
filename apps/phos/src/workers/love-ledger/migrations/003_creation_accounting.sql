-- L5 Creation Economy: LOVE withdrawal + creation-accounting tables.
-- Shares the love-ledger D1 (the CreationAccountant + mcp-x402
-- workers bind the SAME database_id). Apply with `wrangler d1 migrations apply`.

-- 1. Add a metadata column to the existing court-admissible hash chain
--    (carries the creation-receipt payload: intent_id, spoons_saved,
--     care_value, settlement_unit, artifacts, quote_met).
ALTER TABLE love_chain ADD COLUMN metadata TEXT;

-- 2. Worker-reputation penalties for failed intents (the "Failed
--    Intent" rollback state — L5-CREATION-ECONOMY.md §6).
CREATE TABLE IF NOT EXISTS creation_penalties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_did TEXT NOT NULL,
  actual_spoons INTEGER DEFAULT 0,
  quoted_spoons INTEGER DEFAULT 0,
  reason TEXT,
  severity TEXT CHECK (severity IN ('minor', 'major', 'critical')),
  created_at TEXT DEFAULT datetime('now')
);
