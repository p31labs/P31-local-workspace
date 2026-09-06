-- D1 Schema — p31-auth
-- Worker: p31-auth
-- Purpose: User identity and credential management

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  pseudonym TEXT NOT NULL,
  did TEXT NOT NULL,
  last_login INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credentials (
  credential_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'ES256',
  sign_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_did ON users(did);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);

-- D1 Schema — love-ledger (shared)
-- Used by: 16+ workers
-- Pattern: append-only, hash-chained, court-admissible

CREATE TABLE IF NOT EXISTS love_chain (
  id TEXT PRIMARY KEY,
  prev_hash TEXT NOT NULL,
  entry_hash TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  signature TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS identity_registry (
  id TEXT PRIMARY KEY,
  did TEXT NOT NULL,
  eth_address TEXT,
  mldsa65_pub TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS care_proofs (
  id TEXT PRIMARY KEY,
  subject_did TEXT NOT NULL,
  calcium_value REAL,
  measurement_date TEXT NOT NULL,
  fhir_resource_id TEXT,
  ed25519_signature TEXT NOT NULL,
  on_chain_tx_hash TEXT,
  covenant_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  previous_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guardian_attestations (
  id TEXT PRIMARY KEY,
  care_proof_id TEXT NOT NULL,
  guardian_did TEXT NOT NULL,
  attestation_text TEXT,
  signature TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (care_proof_id) REFERENCES care_proofs(id)
);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  proof_id TEXT NOT NULL,
  signer_did TEXT NOT NULL,
  ed25519_signature TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS governance_proposals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  proposer_did TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  vote_start TEXT,
  vote_end TEXT,
  executed_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS governance_votes (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  voter_did TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no', 'abstain')),
  signature TEXT NOT NULL,
  cast_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (proposal_id) REFERENCES governance_proposals(id),
  UNIQUE(proposal_id, voter_did)
);

CREATE INDEX IF NOT EXISTS idx_love_chain_created ON love_chain(created_at);
CREATE INDEX IF NOT EXISTS idx_care_proofs_subject ON care_proofs(subject_did);
CREATE INDEX IF NOT EXISTS idx_receipts_proof ON receipts(proof_id);
CREATE INDEX IF NOT EXISTS idx_governance_proposals_status ON governance_proposals(status);
CREATE INDEX IF NOT EXISTS idx_governance_votes_proposal ON governance_votes(proposal_id);
