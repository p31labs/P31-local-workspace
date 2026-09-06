-- Identity enhancement migration for production-grade sovereign identity
-- Adds: did_verified flag, guardians (social recovery), key_rotation_log
-- Applied to shared love-ledger D1 (592e3e2e-3203-4e0a-8342-9e85215ec8a6)

-- 004_add_did_verified: add verification status column to identity_registry
ALTER TABLE identity_registry ADD COLUMN did_verified INTEGER DEFAULT 0;

-- 004_add_guardians: social recovery via N-of-M guardian quorum
CREATE TABLE IF NOT EXISTS recovery_guardians (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_did TEXT NOT NULL,         -- the DID being guarded
  guardian_did TEXT NOT NULL,        -- the guardian's DID
  share_hash TEXT NOT NULL,          -- base64url SHA-256 of the encrypted share
  threshold INTEGER NOT NULL DEFAULT 3, -- minimum guardians needed for recovery
  total_guardians INTEGER NOT NULL DEFAULT 5,
  created_at INTEGER NOT NULL,
  UNIQUE(subject_did, guardian_did)
);

CREATE INDEX IF NOT EXISTS idx_guardians_subject ON recovery_guardians(subject_did);

-- 004_add_key_rotation: audit trail of key rotations per DID
CREATE TABLE IF NOT EXISTS key_rotation_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  did TEXT NOT NULL,
  previous_key_id TEXT NOT NULL,     -- old verificationMethod id (e.g. #main-key)
  new_key_id TEXT NOT NULL,          -- new verificationMethod id
  previous_key_pub TEXT NOT NULL,    -- old public key multibase/base64url
  new_key_pub TEXT NOT NULL,         -- new public key multibase/base64url
  rotated_at INTEGER NOT NULL,
  proof TEXT                         -- signed rotation proof
);

CREATE INDEX IF NOT EXISTS idx_rotation_did ON key_rotation_log(did);

-- 004_add_didcomm_sessions: tracked encrypted messaging sessions
CREATE TABLE IF NOT EXISTS didcomm_sessions (
  session_id TEXT PRIMARY KEY,
  sender_did TEXT NOT NULL,
  recipient_did TEXT NOT NULL,
  envelope TEXT NOT NULL,            -- JSON-serialized DIDComm envelope
  status TEXT DEFAULT 'sent',        -- sent, delivered, read
  created_at INTEGER NOT NULL,
  delivered_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_didcomm_recipient ON didcomm_sessions(recipient_did);
CREATE INDEX IF NOT EXISTS idx_didcomm_sender ON didcomm_sessions(sender_did);
