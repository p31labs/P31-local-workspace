-- Migration 012: sovereign identity registry for the minting layer (CWP-2026-025).
-- Binds a did:key (Ed25519, optional ML-DSA-65) to the Ethereum address that
-- receives care SBTs. Registration is SELF-SIGNED: the client proves control of
-- the DID by signing the payload, so no server secret is required.
CREATE TABLE IF NOT EXISTS identity_registry (
  did TEXT PRIMARY KEY,
  ed25519_pub TEXT NOT NULL,
  mldsa65_pub TEXT,
  eth_address TEXT NOT NULL,
  registered_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_identity_registry_eth ON identity_registry (eth_address);
