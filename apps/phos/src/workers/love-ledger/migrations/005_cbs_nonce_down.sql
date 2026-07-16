-- Down migration for 005_cbs_nonce.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops Clause Blind Schnorr nonce table. Ephemeral nonces with TTL expiry.
DROP TABLE IF EXISTS cbs_nonce;
