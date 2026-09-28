-- Migration: 0006_odr_offers
-- Description: Create odr_offers table matching p31-justice-hub worker queries
-- The worker (src/index.ts) writes to `odr_offers (id, case_id, party_did, blinded_hash, round, status, created_at)`
-- Legacy migration 0005 created `offers` with a different shape (amount, no blinded_hash/status) — this is the table the live worker actually queries.

CREATE TABLE IF NOT EXISTS odr_offers (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    party_did TEXT NOT NULL,
    blinded_hash TEXT NOT NULL,
    round INTEGER DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_odr_offers_case ON odr_offers(case_id);