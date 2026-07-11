-- Migration 007: add PQC server-side seal column (ML-DSA-65).
-- Additive: existing Ed25519 client receipts in `signature` are unchanged.
-- ML-DSA-65 signature is ~3309 bytes raw / ~4400 base64, so TEXT is sufficient.
ALTER TABLE love_chain ADD COLUMN signature_pqc TEXT;
