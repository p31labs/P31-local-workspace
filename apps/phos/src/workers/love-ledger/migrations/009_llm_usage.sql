-- Phase 4 (CWP-2026-013): LLM Usage Meter — Reserve & Refund ledger.
-- 1 LOVE = 1000 tokens; GLM-4.7-Flash cost is charged to the user in LOVE
-- upfront (reserve), then the unspent difference is refunded on settle.
-- This table is the audit/reconciliation source of truth for GLM billing.

CREATE TABLE IF NOT EXISTS llm_usage (
  id              TEXT PRIMARY KEY,
  did             TEXT NOT NULL,
  model           TEXT NOT NULL,
  reservation_id  TEXT NOT NULL,
  reserved_love   REAL NOT NULL,   -- LOVE debited upfront (max_tokens / 1000)
  actual_love     REAL NOT NULL DEFAULT 0,
  max_tokens      INTEGER NOT NULL,
  actual_tokens   INTEGER NOT NULL DEFAULT 0,
  refunded_love   REAL NOT NULL DEFAULT 0,  -- reserved_love - actual_love
  status          TEXT NOT NULL,   -- 'reserved' | 'settled'
  created_at      INTEGER NOT NULL,
  settled_at      INTEGER
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_did ON llm_usage(did, created_at);
