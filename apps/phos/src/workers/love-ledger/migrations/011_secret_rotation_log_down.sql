-- Down migration for 011_secret_rotation_log.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops secret rotation audit trail table. Non-critical audit log.
DROP TABLE IF EXISTS secret_rotation_log;
