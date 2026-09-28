-- env-proxy / env-meta D1 schema (Phase 1)
CREATE TABLE IF NOT EXISTS env_audit (
  id TEXT PRIMARY KEY,
  key_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor TEXT NOT NULL,
  environment TEXT NOT NULL,
  worker_name TEXT,
  result TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS env_metadata (
  key_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT,
  purpose TEXT,
  created_at INTEGER NOT NULL,
  last_rotated_at INTEGER,
  rotation_grace_days INTEGER DEFAULT 7
);