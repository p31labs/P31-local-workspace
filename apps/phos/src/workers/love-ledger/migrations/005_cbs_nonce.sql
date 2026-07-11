-- 005_cbs_nonce.sql — Axis-1 single-use nonces (closes the nonce-reuse
-- private-key-leak). Each /blind-sign consumes one `t`; reusing `t`
-- (same ephemeral n across two challenges) leaks x, so `t` is unique.
CREATE TABLE IF NOT EXISTS cbs_nonce (
  t       TEXT PRIMARY KEY,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_cbs_nonce_expires ON cbs_nonce (expires);
