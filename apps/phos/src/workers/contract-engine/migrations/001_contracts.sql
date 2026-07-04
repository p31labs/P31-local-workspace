-- Contracts table — replaces DO storage for persistent state
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  party_a_did TEXT NOT NULL,
  party_b_did TEXT NOT NULL,
  party_a_signature TEXT,
  party_b_signature TEXT,
  terms_json TEXT NOT NULL,
  stakes_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  hash_chain_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  activated_at INTEGER,
  fulfilled_at INTEGER,
  dissolved_at INTEGER
);

CREATE TABLE IF NOT EXISTS contract_events (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data_json TEXT NOT NULL,
  signature TEXT NOT NULL,
  timestamp INTEGER NOT NULL
);

CREATE INDEX idx_contracts_party_a ON contracts(party_a_did);
CREATE INDEX idx_contracts_party_b ON contracts(party_b_did);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contract_events_contract ON contract_events(contract_id);
