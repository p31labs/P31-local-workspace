-- L5 Creation Economy: replay protection + quote telemetry (migration 004).
-- Shares the love-ledger D1 (the CreationAccountant + mcp-x402
-- workers bind the SAME database_id). Apply with:
--   wrangler d1 migrations apply --remote love-ledger

-- 1. Nonce-consumption store (Axis-3 trustless-oracle hardening).
-- Prevents a renderer from replaying an already-settled spoon delta.
CREATE TABLE IF NOT EXISTS consumed_nonces (
  nonce TEXT PRIMARY KEY,
  consumed_at INTEGER NOT NULL,
  intent_id TEXT,
  worker_did TEXT
);
CREATE INDEX IF NOT EXISTS idx_consumed_nonces_at ON consumed_nonces (consumed_at);

-- 2. Quote telemetry (Axis-4 calibration hook).
-- Records intent -> generated quote so the heuristic coefficients in
-- quote-generator.ts can be tuned against real staging data.
-- Non-blocking: never on the settlement critical path.
CREATE TABLE IF NOT EXISTS quote_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  intent_hash TEXT NOT NULL,
  raw_intent TEXT NOT NULL,
  generated_quote TEXT NOT NULL,
  settlement_unit TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quote_signals_hash ON quote_signals (intent_hash);
CREATE INDEX IF NOT EXISTS idx_quote_signals_created ON quote_signals (created_at);
