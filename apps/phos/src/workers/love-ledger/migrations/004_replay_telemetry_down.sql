-- Down migration for 004_replay_telemetry.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops replay protection and telemetry tables. Ephemeral data, no court-admissible content.
DROP TABLE IF EXISTS consumed_nonces;
DROP TABLE IF EXISTS quote_signals;
