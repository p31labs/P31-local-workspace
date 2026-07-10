-- Jitterbug user-testing dashboard tables (reuse shared love-ledger D1)
CREATE TABLE IF NOT EXISTS ut_participants (
  id INTEGER PRIMARY KEY,
  pseudonym TEXT UNIQUE NOT NULL,
  neurotype TEXT,
  cohort TEXT CHECK(cohort IN ('A','B','C')),
  age_band TEXT,
  access_needs_json TEXT,
  payment_method TEXT,
  consent_given INTEGER DEFAULT 0,
  caregiver_assent INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ut_sessions (
  id INTEGER PRIMARY KEY,
  participant_id INTEGER NOT NULL,
  phase INTEGER CHECK(phase BETWEEN 1 AND 5),
  session_date TEXT,
  format TEXT CHECK(format IN ('remote','in-person','async')),
  spoons_start INTEGER CHECK(spoons_start BETWEEN 1 AND 5),
  spoons_end INTEGER CHECK(spoons_end BETWEEN 1 AND 5),
  wcag_json TEXT,
  payment_amount INTEGER,
  paid INTEGER DEFAULT 0,
  paid_at TEXT,
  notes TEXT,
  FOREIGN KEY (participant_id) REFERENCES ut_participants(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ut_findings (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL,
  severity INTEGER CHECK(severity BETWEEN 1 AND 5),
  category TEXT,
  description TEXT,
  suggested_fix TEXT,
  FOREIGN KEY (session_id) REFERENCES ut_sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ut_deadlines (
  id INTEGER PRIMARY KEY,
  label TEXT UNIQUE NOT NULL,
  due_date TEXT,
  owner TEXT,
  met INTEGER DEFAULT 0
);
