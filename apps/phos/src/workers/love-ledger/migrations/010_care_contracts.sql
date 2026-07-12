-- CWP-2026-014 — PQC Care Contracts.
-- ML-KEM-768 (FIPS 203) encrypted terms + ML-DSA-44 (FIPS 204) ledger seal.
-- A care contract commits a family to a long-term care action (guardianship,
-- 10-year support, shared-care agreement) that stays verifiable post-CRQC.
--
-- Author encrypts `terms` to the counterparty's ML-KEM public key; only the
-- counterparty (holding the ML-KEM private key) can decrypt. The ledger attests
-- integrity with its server-side ML-DSA-44 seal over the record's entry hash.

CREATE TABLE IF NOT EXISTS contract_keys (
  did              TEXT PRIMARY KEY,
  kem_public_key   TEXT NOT NULL,  -- base64 ML-KEM-768 ek (1184 bytes)
  dsa_public_key   TEXT NOT NULL,  -- base64 ML-DSA-44 pk (1312 bytes)
  created_at       INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS care_contracts (
  id               TEXT PRIMARY KEY,
  author_did       TEXT NOT NULL,
  counterparty_did TEXT NOT NULL,
  title            TEXT NOT NULL,
  terms_hash       TEXT NOT NULL,  -- SHA-256 of plaintext terms (commitment)
  encrypted_terms  TEXT NOT NULL,  -- base64 JSON { iv, ct } AES-256-GCM under ML-KEM shared secret
  kem_ciphertext   TEXT NOT NULL,  -- base64 ML-KEM-768 ciphertext (1088 bytes)
  pqc_seal         TEXT,           -- base64 ML-DSA-44 signature over entry_hash (ledger attestation)
  entry_hash       TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'proposed',  -- proposed|active|fulfilled|terminated
  created_at       INTEGER NOT NULL,
  activated_at     INTEGER
);

CREATE INDEX IF NOT EXISTS idx_care_contracts_author ON care_contracts(author_did);
CREATE INDEX IF NOT EXISTS idx_care_contracts_counterparty ON care_contracts(counterparty_did);
