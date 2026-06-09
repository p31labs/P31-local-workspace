-- P31 FHIR Calcium Monitoring Worker — D1 schema
-- HIPAA audit trail: all reads/writes logged with accessor identity
-- PHI stored only in this database; access controlled by Worker secrets

-- OAuth token store (access + refresh tokens for Epic SMART on FHIR)
CREATE TABLE IF NOT EXISTS fhir_tokens (
  id          TEXT PRIMARY KEY DEFAULT 'singleton',
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at    INTEGER NOT NULL,  -- Unix ms
  patient_id    TEXT NOT NULL,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Serum calcium lab results pulled from FHIR (LOINC 2000-8)
CREATE TABLE IF NOT EXISTS calcium_readings (
  id              TEXT PRIMARY KEY,  -- FHIR Observation.id
  observation_ts  INTEGER NOT NULL,  -- effective datetime as Unix ms
  value_mgdl      REAL NOT NULL,
  reference_low   REAL NOT NULL DEFAULT 8.5,
  reference_high  REAL NOT NULL DEFAULT 10.5,
  status          TEXT NOT NULL,     -- 'final' | 'preliminary' | 'amended'
  pulled_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE INDEX IF NOT EXISTS idx_ca_ts ON calcium_readings(observation_ts DESC);

-- Medication timing log (calcitriol + calcium carbonate)
-- Populated by client via POST /fhir/medication-log
CREATE TABLE IF NOT EXISTS medication_log (
  id          TEXT PRIMARY KEY,
  logged_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  medication  TEXT NOT NULL,  -- 'calcitriol' | 'calcium_carbonate'
  dose_mg     REAL,
  taken       INTEGER NOT NULL DEFAULT 1,  -- 1 = taken, 0 = skipped
  device_id   TEXT
);

CREATE INDEX IF NOT EXISTS idx_med_ts ON medication_log(logged_at DESC);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
  id            TEXT PRIMARY KEY,
  fired_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  alert_type    TEXT NOT NULL,  -- 'critical' | 'warning' | 'forecast'
  calcium_value REAL NOT NULL,
  threshold     REAL NOT NULL,
  ha_triggered  INTEGER NOT NULL DEFAULT 0,  -- 1 = HA webhook fired
  ha_response   INTEGER,                     -- HTTP status from HA
  resolved_at   INTEGER                      -- null = still active
);

-- HIPAA audit log — every PHI access must be recorded
CREATE TABLE IF NOT EXISTS audit_log (
  id          TEXT PRIMARY KEY,
  event_ts    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  actor       TEXT NOT NULL,  -- 'cron' | 'operator' | 'system'
  action      TEXT NOT NULL,  -- 'token_refresh' | 'lab_pull' | 'alert_fire' | 'export'
  resource    TEXT,           -- FHIR resource type accessed
  record_id   TEXT,           -- Observation.id or null
  result      TEXT NOT NULL,  -- 'success' | 'error'
  detail      TEXT            -- error message or metadata (no PHI)
);

CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(event_ts DESC);
