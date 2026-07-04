-- P31 Passkey Worker — D1 schema
-- Apply remote prod: wrangler d1 execute p31-passkey-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS credentials (
  id            TEXT PRIMARY KEY,          -- base64url credential ID
  user_id       TEXT NOT NULL,             -- base64url random user ID (no PII)
  public_key    TEXT NOT NULL,             -- JSON-serialized StoredKey {alg, jwk}
  alg           TEXT NOT NULL DEFAULT 'ES256', -- 'ES256' | 'RS256'
  sign_count    INTEGER NOT NULL DEFAULT 0,
  aaguid        TEXT,
  transports    TEXT,                      -- JSON array e.g. ["internal","hybrid"]
  backed_up     INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,          -- Unix ms
  last_used_at  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);

-- Education E3+ portal — progress keyed by opaque p31_subject_id (u_* or guest_*)
-- Apply: wrangler d1 execute p31-passkey-db --file=schema.sql [--env production]

CREATE TABLE IF NOT EXISTS education_progress (
  subject_id    TEXT PRIMARY KEY,   -- from localStorage p31_subject_id — no PII
  payload_json  TEXT NOT NULL,      -- p31.educationProgress/0.1.0 JSON
  updated_at    INTEGER NOT NULL    -- Unix ms
);

-- Node Zero Phase 4 — paired hardware keys (never stores operator Passkey material)
CREATE TABLE IF NOT EXISTS hardware_pairings (
  id                     TEXT PRIMARY KEY,
  subject_id             TEXT NOT NULL,
  ed25519_pubkey_b64url  TEXT NOT NULL,
  device_label           TEXT,
  created_at             INTEGER NOT NULL,
  revoked_at             INTEGER
);

CREATE INDEX IF NOT EXISTS idx_hardware_pair_subject ON hardware_pairings(subject_id);
