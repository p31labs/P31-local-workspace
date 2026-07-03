-- Key rotation history
CREATE TABLE IF NOT EXISTS key_rotations (
  did TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  previous_public_key TEXT,
  rotated_at INTEGER NOT NULL,
  signature TEXT NOT NULL
);

-- Revocation list
CREATE TABLE IF NOT EXISTS key_revocations (
  did TEXT PRIMARY KEY,
  revoked_at INTEGER NOT NULL,
  reason TEXT
);

-- Vote delegation (liquid democracy)
CREATE TABLE IF NOT EXISTS vote_delegations (
  delegator_did TEXT PRIMARY KEY,
  delegate_did TEXT NOT NULL,
  delegated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  signature TEXT NOT NULL,
  revoked BOOLEAN DEFAULT 0
);

CREATE INDEX idx_delegations_delegate ON vote_delegations(delegate_did);
CREATE INDEX idx_delegations_expires ON vote_delegations(expires_at);

-- Proposals
CREATE TABLE IF NOT EXISTS proposals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at INTEGER NOT NULL,
  voting_ends_at INTEGER NOT NULL,
  votes_for INTEGER NOT NULL DEFAULT 0,
  votes_against INTEGER NOT NULL DEFAULT 0,
  votes_abstain INTEGER NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  quorum REAL NOT NULL,
  supermajority REAL NOT NULL,
  action_type TEXT NOT NULL,
  action_target TEXT NOT NULL,
  action_value TEXT,
  action_description TEXT NOT NULL,
  execution_hash TEXT,
  executed_at INTEGER
);

CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_author ON proposals(author);

-- Votes
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  voter_did TEXT NOT NULL,
  choice TEXT NOT NULL,
  signature TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id)
);

CREATE INDEX idx_votes_proposal ON votes(proposal_id);
CREATE INDEX idx_votes_voter ON votes(voter_did);

-- Active voters registry
CREATE TABLE IF NOT EXISTS active_voters (
  did TEXT PRIMARY KEY,
  added_at INTEGER NOT NULL,
  last_active INTEGER NOT NULL
);

-- Constitution (singleton row)
CREATE TABLE IF NOT EXISTS constitution (
  id TEXT PRIMARY KEY DEFAULT 'current',
  version TEXT NOT NULL DEFAULT '1.0.0',
  quorum REAL NOT NULL DEFAULT 0.20,
  supermajority REAL NOT NULL DEFAULT 0.66,
  voting_period_days INTEGER NOT NULL DEFAULT 7,
  min_membership_days INTEGER NOT NULL DEFAULT 30,
  amendment_history_json TEXT NOT NULL DEFAULT '[]'
);

INSERT OR IGNORE INTO constitution (id) VALUES ('current');

-- Proposal executions (audit trail for executed proposals)
CREATE TABLE IF NOT EXISTS proposal_executions (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_target TEXT NOT NULL,
  action_value TEXT,
  action_description TEXT NOT NULL,
  executed_at INTEGER NOT NULL,
  executed_by TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT 1,
  result_json TEXT,
  FOREIGN KEY (proposal_id) REFERENCES proposals(id)
);

CREATE INDEX idx_executions_proposal ON proposal_executions(proposal_id);
CREATE INDEX idx_executions_executed_at ON proposal_executions(executed_at);
