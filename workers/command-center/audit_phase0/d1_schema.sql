-- EPCP D1 Schema — Phase 0 Audit Output
-- Designed for Cloudflare D1 (SQLite at edge)

-- ==========================================
-- TABLE: events (append-only audit trail)
-- ==========================================
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,                -- ISO 8601 timestamp
  actor TEXT,                        -- operator ID or system
  action TEXT NOT NULL,                -- deploy, panic, rollback, status_update, etc.
  target TEXT,                         -- worker / page / route
  diff_uri TEXT,                       -- R2 URI for JSON patch diff
  req_uri TEXT,                        -- R2 URI for captured request (masked PII)
  resp_uri TEXT,                       -- R2 URI for captured response (masked PII)
  sig TEXT,                            -- HMAC signature for tamper evidence
  legal_hold BOOLEAN DEFAULT 0,       -- frozen during discovery / litigation
  meta TEXT                            -- JSON blob for extra context
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_action ON events(action);
CREATE INDEX IF NOT EXISTS idx_events_target ON events(target);

-- ==========================================
-- TABLE: budgets (dual-track: USD + stablecoin)
-- ==========================================
CREATE TABLE IF NOT EXISTS budgets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE,
  limit_usd REAL,                      -- traditional infra (CF, Twilio, OpenAI)
  limit_stablecoin REAL,               -- x402 agent micro-transactions (USDC)
  spent_usd DEFAULT 0,
  spent_stablecoin DEFAULT 0,
  alert_pct INTEGER DEFAULT 90,
  last_checked TEXT,
  meta TEXT                            -- JSON blob for extra context
);

-- ==========================================
-- TABLE: fleet_status (cached KV replacement)
-- ==========================================
CREATE TABLE IF NOT EXISTS fleet_status (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated TEXT NOT NULL
);

-- ==========================================
-- TABLE: forensic_artifacts (R2 object registry)
-- ==========================================
CREATE TABLE IF NOT EXISTS forensic_artifacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,                     -- FK to events.id
  r2_uri TEXT NOT NULL,
  content_type TEXT,                     -- 'diff', 'request', 'response', 'artifact'
  size_bytes INTEGER,
  hmac_sig TEXT,
  retention_cold TEXT,                 -- ISO date when to move to Glacier
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE INDEX IF NOT EXISTS idx_forensic_event ON forensic_artifacts(event_id);
