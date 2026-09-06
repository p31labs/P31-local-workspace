-- Migration: Create events table
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  actor TEXT,
  action TEXT NOT NULL,
  target TEXT,
  diff_uri TEXT,
  req_uri TEXT,
  resp_uri TEXT,
  sig TEXT,
  legal_hold BOOLEAN DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
CREATE INDEX IF NOT EXISTS idx_events_target ON events(target);

-- Migration: Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  limit_usd REAL,
  limit_stablecoin REAL,
  spent_usd DEFAULT 0,
  spent_stablecoin REAL DEFAULT 0,
  alert_pct INTEGER DEFAULT 90,
  last_checked TEXT
);

-- Migration: Create fleet_status table
CREATE TABLE IF NOT EXISTS fleet_status (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated TEXT NOT NULL
);

-- Migration: Create forensic_artifacts table
CREATE TABLE IF NOT EXISTS forensic_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  r2_uri TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  hmac_sig TEXT,
  retention_cold TEXT,
  FOREIGN KEY (event_id) REFERENCES events(id)
);

-- Migration tracking table
CREATE TABLE IF NOT EXISTS _migrations (
  version INTEGER PRIMARY KEY,
  name TEXT,
  applied_at TEXT
);
