-- LOVE Token Ledger — D1 Schema
CREATE TABLE IF NOT EXISTS love_accounts (
  did TEXT PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  staked INTEGER NOT NULL DEFAULT 0,
  earned INTEGER NOT NULL DEFAULT 0,
  reputation INTEGER NOT NULL DEFAULT 50,
  total_contracts INTEGER NOT NULL DEFAULT 0,
  fulfilled_contracts INTEGER NOT NULL DEFAULT 0,
  breached_contracts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS love_transactions (
  id TEXT PRIMARY KEY,
  from_did TEXT NOT NULL,
  to_did TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('transfer', 'stake', 'reward', 'penalty', 'vesting_release')),
  contract_id TEXT,
  signature TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  block_hash TEXT,
  FOREIGN KEY (from_did) REFERENCES love_accounts(did),
  FOREIGN KEY (to_did) REFERENCES love_accounts(did)
);

CREATE TABLE IF NOT EXISTS love_stakes (
  contract_id TEXT PRIMARY KEY,
  staker_did TEXT NOT NULL,
  amount INTEGER NOT NULL,
  vested INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('locked', 'vesting', 'unlocked', 'forfeited')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_love_transactions_from ON love_transactions(from_did);
CREATE INDEX idx_love_transactions_to ON love_transactions(to_did);
CREATE INDEX idx_love_transactions_contract ON love_transactions(contract_id);
CREATE INDEX idx_love_stakes_staker ON love_stakes(staker_did);
CREATE INDEX idx_love_stakes_status ON love_stakes(status);

INSERT OR IGNORE INTO love_accounts (did, balance, reputation) VALUES ('system:genesis', 1000000000, 100);
