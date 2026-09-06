-- Phase 3.3: Behavioral baselines — add indexes for per-DID pattern queries

CREATE INDEX IF NOT EXISTS idx_audit_did_tool ON audit_logs (did, tool_name, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_did_error ON audit_logs (did, error, timestamp);

-- Tool call events table for real-time pattern analysis
CREATE TABLE IF NOT EXISTS tool_patterns (
  id TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  session_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  duration_ms INTEGER DEFAULT 0,
  trust_tier TEXT DEFAULT '',
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_patterns_did_ts ON tool_patterns (did, timestamp);
CREATE INDEX IF NOT EXISTS idx_patterns_tool ON tool_patterns (tool_name, timestamp);
