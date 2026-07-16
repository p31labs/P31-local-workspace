-- Down migration for 009_llm_usage.sql — ROLLBACK
-- Rollback complexity: SIMPLE
-- Drops LLM metering audit trail table. Audit log data, non-critical.
DROP TABLE IF EXISTS llm_usage;
