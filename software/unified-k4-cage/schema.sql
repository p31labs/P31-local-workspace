-- D1: unified k4-cage mesh telemetry (SHA-256 chain columns)
-- Database name in Cloudflare must match wrangler.toml (e.g. p31-telemetry).
-- Create DB if needed: npx wrangler d1 create p31-telemetry
-- Apply: npx wrangler d1 execute <DATABASE_NAME> --remote --file=04_SOFTWARE/unified-k4-cage/schema.sql

CREATE TABLE IF NOT EXISTS telemetry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id TEXT NOT NULL,
  node_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload TEXT,
  ts INTEGER NOT NULL,
  hash TEXT,
  prev_hash TEXT,
  flushed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_room_ts ON telemetry(room_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_node ON telemetry(node_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_kind ON telemetry(kind, ts DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_hash ON telemetry(hash);
