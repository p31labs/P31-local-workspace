-- Down migration for 002_auth_registry.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops auth registry table. Small registry; re-insertion on remigration.
DROP TABLE IF EXISTS auth_registry;
