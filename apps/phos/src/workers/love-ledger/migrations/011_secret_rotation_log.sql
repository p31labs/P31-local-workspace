-- 011_secret_rotation_log.sql
-- Audit trail for LOVE_AUTH_SECRET (and future) rotations managed by the
-- secret-rotator Worker (CWP-2026-014 / Secret Vault). Reuses the love-ledger
-- D1 so we stay within the Free Plan 10-DB cap (no new database).
--
-- Apply with: wrangler d1 execute love-ledger --remote --file=./migrations/011_secret_rotation_log.sql
-- (the love-ledger migration tracking table is stale, so the migrations runner
--  cannot apply new files — use `d1 execute --file` directly, idempotent).

CREATE TABLE IF NOT EXISTS secret_rotation_log (
  id              TEXT PRIMARY KEY,
  secret_name     TEXT NOT NULL,
  old_secret_hash TEXT,
  new_secret_hash TEXT,
  rotated_by      TEXT NOT NULL,
  rotated_at      INTEGER NOT NULL,
  status          TEXT NOT NULL,
  error           TEXT
);

CREATE INDEX IF NOT EXISTS idx_secret_rotation_log_name
  ON secret_rotation_log (secret_name);
CREATE INDEX IF NOT EXISTS idx_secret_rotation_log_at
  ON secret_rotation_log (rotated_at);
