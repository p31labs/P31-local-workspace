-- Migration: 0003_escrow_engine
-- Description: Three-pool escrow engine with conditional release and multi-sig
-- Extends love-ledger pattern for binding dispute resolution

CREATE TABLE IF NOT EXISTS escrow_accounts (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    party_a_did TEXT NOT NULL,
    party_b_did TEXT NOT NULL,
    arbitrator_did TEXT,
    pool_type TEXT NOT NULL CHECK(pool_type IN ('escrow', 'sovereignty', 'performance')),
    balance INTEGER NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'LOVE',
    status TEXT NOT NULL DEFAULT 'locked' CHECK(status IN ('locked', 'arbitrating', 'ready_to_release', 'released', 'refunded', 'disputed')),
    conditions_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_escrow_case_id ON escrow_accounts(case_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_accounts(status);
CREATE INDEX IF NOT EXISTS idx_escrow_party_a ON escrow_accounts(party_a_did);
CREATE INDEX IF NOT EXISTS idx_escrow_party_b ON escrow_accounts(party_b_did);

CREATE TABLE IF NOT EXISTS escrow_transactions (
    id TEXT PRIMARY KEY,
    escrow_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('deposit', 'release', 'refund', 'lock', 'unlock', 'approve')),
    amount INTEGER NOT NULL DEFAULT 0,
    actor_did TEXT NOT NULL,
    signature TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (escrow_id) REFERENCES escrow_accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_escrow_tx_escrow_id ON escrow_transactions(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_actor ON escrow_transactions(actor_did);
CREATE INDEX IF NOT EXISTS idx_escrow_tx_created ON escrow_transactions(created_at);

CREATE TABLE IF NOT EXISTS escrow_approvals (
    id TEXT PRIMARY KEY,
    escrow_id TEXT NOT NULL,
    signer_did TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    signature TEXT,
    signed_at TEXT,
    metadata TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (escrow_id) REFERENCES escrow_accounts(id),
    UNIQUE(escrow_id, signer_did)
);

CREATE INDEX IF NOT EXISTS idx_escrow_approval_escrow ON escrow_approvals(escrow_id);
CREATE INDEX IF NOT EXISTS idx_escrow_approval_signer ON escrow_approvals(signer_did);
