-- Down migration for 003_add_ephemeralization.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops the purge_at column added to brain_dumps table.
ALTER TABLE brain_dumps DROP COLUMN purge_at;
