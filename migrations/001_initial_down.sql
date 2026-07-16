-- Down migration for 001_initial.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops initial jitterbug-db tables. Brain-dump decomposition artifacts, re-buildable.
DROP TABLE IF EXISTS status_entries;
DROP TABLE IF EXISTS brain_dumps;
