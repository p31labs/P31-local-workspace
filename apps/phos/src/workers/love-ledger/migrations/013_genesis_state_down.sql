-- Down migration for 013_genesis_state.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops genesis state singleton table. Single-row state; re-migration restores locked state.
DROP TABLE IF EXISTS genesis_state;
