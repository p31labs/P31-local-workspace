CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  did TEXT,
  tool_name TEXT NOT NULL,
  arguments TEXT,
  result TEXT,
  error TEXT,
  trust_tier TEXT,
  allowed BOOLEAN NOT NULL,
  timestamp INTEGER NOT NULL,
  upstream_status INTEGER
);

CREATE INDEX IF NOT EXISTS idx_audit_session ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_tool ON audit_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
