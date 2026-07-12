-- CWP-2026-016 (B): privacy-preserving care-mesh aggregates.
-- Reuses the shared love-ledger D1. Applied with:
--   wrangler d1 execute love-ledger --remote --file=migrations/001_care_mesh_aggregates.sql
CREATE TABLE IF NOT EXISTS care_mesh_aggregates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  family_did TEXT NOT NULL,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  avg_spoons REAL NOT NULL,
  care_event_count INTEGER NOT NULL,
  care_score REAL NOT NULL,
  noise_epsilon REAL NOT NULL,
  signature TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_care_mesh_family ON care_mesh_aggregates (family_did, period_start);
