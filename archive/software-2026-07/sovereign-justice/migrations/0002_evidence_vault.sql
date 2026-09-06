-- Migration: 0002_evidence_vault
-- Description: Dual-signed evidence vault with chain-of-custody
-- Ed25519 + ML-DSA-65 signatures for Daubert compliance

CREATE TABLE IF NOT EXISTS evidence_items (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    submitted_by_did TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    sha256_hash TEXT NOT NULL,
    ipfs_cid TEXT,
    r2_key TEXT,
    ed25519_signature TEXT NOT NULL,
    mldsa65_signature TEXT NOT NULL,
    signing_key_id TEXT,
    chain_prev_hash TEXT,
    chain_hash TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived', 'expunged')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence_items(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_submitted_by ON evidence_items(submitted_by_did);
CREATE INDEX IF NOT EXISTS idx_evidence_ipfs_cid ON evidence_items(ipfs_cid);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence_items(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_chain_hash ON evidence_items(chain_hash);

CREATE TABLE IF NOT EXISTS evidence_chain (
    id TEXT PRIMARY KEY,
    evidence_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('upload', 'view', 'verify', 'archive', 'expunge', 'present')),
    actor_did TEXT NOT NULL,
    prev_hash TEXT,
    chain_hash TEXT NOT NULL,
    signature TEXT NOT NULL,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (evidence_id) REFERENCES evidence_items(id)
);

CREATE INDEX IF NOT EXISTS idx_ev_chain_evidence_id ON evidence_chain(evidence_id);
CREATE INDEX IF NOT EXISTS idx_ev_chain_actor ON evidence_chain(actor_did);
CREATE INDEX IF NOT EXISTS idx_ev_chain_created ON evidence_chain(created_at);

CREATE TABLE IF NOT EXISTS evidence_cases (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    arbitrator_did TEXT,
    party_a_did TEXT NOT NULL,
    party_b_did TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'arbitrating', 'resolved', 'closed')),
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ev_cases_status ON evidence_cases(status);
CREATE INDEX IF NOT EXISTS idx_ev_cases_arbitrator ON evidence_cases(arbitrator_did);
