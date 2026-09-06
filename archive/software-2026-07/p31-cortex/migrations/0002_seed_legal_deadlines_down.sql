-- Down migration for 0002_seed_legal_deadlines.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Deletes the seed deadline and alert rows added by this migration.
-- Seed rows are deterministic; remigration re-inserts them.
DELETE FROM alerts WHERE deadline_id LIKE 'seed-%';
DELETE FROM deadlines WHERE id LIKE 'seed-%';
