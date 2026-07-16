-- Down migration for 006_cbs_coin.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops blind-sig coin cache table. Ephemeral, single-use coin store with TTL.
DROP TABLE IF EXISTS cbs_coin;
