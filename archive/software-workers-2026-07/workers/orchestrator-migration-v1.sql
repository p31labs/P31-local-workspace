-- P31 Orchestrator D1 Database Schema
-- Migration v1: Initial tables for audit log and action queue

CREATE TABLE IF NOT EXISTS orchestrator_audit_log (
  id TEXT PRIMARY KEY,
  trigger_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  action TEXT NOT NULL,
  spoons_at_evaluation INTEGER NOT NULL,
  guardrail_level INTEGER NOT NULL,
  approved BOOLEAN NOT NULL,
  delay_ms INTEGER NOT NULL,
  requires_manual BOOLEAN NOT NULL,
  reason TEXT NOT NULL,
  executed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS orchestrator_queue (
  id TEXT PRIMARY KEY,
  trigger_id TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  scheduled_at INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orchestrator_audit_trigger ON orchestrator_audit_log(trigger_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_audit_created ON orchestrator_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orchestrator_queue_scheduled ON orchestrator_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_orchestrator_queue_priority ON orchestrator_queue(priority DESC);
