-- Down migration for 014_arcade_scores.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops arcade game scores table. Non-critical game data.
DROP TABLE IF EXISTS arcade_scores;
