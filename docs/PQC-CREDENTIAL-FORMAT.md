# PQC Credential Format

## Overview

P31 issues post-quantum W3C Verifiable Credentials signed with ML-DSA-65 (FIPS 204,
NIST Category 3). These credentials are designed to be verifiable by external parties
without requiring Ed25519 fallback, though composite (Ed25519 + ML-DSA-65) verification
is supported for defense-in-depth.

## Issuance

```http
POST https://ledger-bridge.trimtab-signal.workers.dev/credential/issue-pqc
Content-Type: application/json

{
  "did": "did:key:z6Mk...",
  "publicKey": [/* ML-DSA-65 public key as number array */],
  "secretKey": [/* ML-DSA-65 secret key as number array */],
  "claims": {
    "displayName": "Alice",
    "type": "CognitivePassportCredential"
  }
}
```

### Response

```json
{
  "ok": true,
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "P31PQCIdentityCredential"],
    "issuer": "did:key:z6Mk...",
    "issuanceDate": "2026-07-18T...",
    "credentialSubject": {
      "id": "did:key:z6Mk...",
      "displayName": "Alice",
      "type": "CognitivePassportCredential"
    },
    "proof": {
      "type": "MLDSA65Proof2026",
      "created": "2026-07-18T...",
      "proofPurpose": "assertionMethod",
      "verificationMethod": "did:key:z6Mk...#ml-dsa-65",
      "proofValue": "<base64 ML-DSA-65 signature>"
    }
  }
}
```

## Verification

### Single (ML-DSA-65 only)

```http
POST https://ledger-bridge.trimtab-signal.workers.dev/credential/verify-pqc
Content-Type: application/json

{
  "credential": { /* full VC */ },
  "publicKey": [/* ML-DSA-65 public key as number array */]
}
```

### Composite (Ed25519 + ML-DSA-65)

```http
POST https://ledger-bridge.trimtab-signal.workers.dev/credential/verify-pqc
Content-Type: application/json

{
  "credential": { /* full VC */ },
  "publicKey": [/* ML-DSA-65 public key */],
  "ed25519PublicKey": [/* Ed25519 public key as number array */],
  "ed25519Signature": "<base64 Ed25519 signature>"
}
```

### Response

```json
{
  "valid": true,
  "composite": true,
  "algorithms": ["ML-DSA-65", "Ed25519"],
  "mlDsa65": true,
  "ed25519": true,
  "credentialSubject": { "id": "did:key:z6Mk...", ... }
}
```

## Revocation

```http
POST https://ledger-bridge.trimtab-signal.workers.dev/credential/revoke
Content-Type: application/json

{
  "did": "did:key:z6Mk..."
}
```

Status list (Status List 2021):

```http
GET https://ledger-bridge.trimtab-signal.workers.dev/status-list/1
```

## Renewal

```http
POST https://ledger-bridge.trimtab-signal.workers.dev/credential/renew-pqc
Content-Type: application/json

{
  "credential": { /* existing VC */ },
  "publicKey": [/* new ML-DSA-65 public key */],
  "secretKey": [/* new ML-DSA-65 secret key */]
}
```

## Federation Bridge Presentation Verification

```http
POST https://federation.p31ca.org/credential/verify-presentation
Content-Type: application/json

{
  "payload": { ... },
  "signature": "<base64 Ed25519 signature>"
}
```

## Standards

- **FIPS 204** — ML-DSA-65 (Module-Lattice-Based Digital Signature)
- **FIPS 203** — ML-KEM-768 (Module-Lattice-Based Key Encapsulation)
- **W3C VC Data Model 1.1** — Verifiable Credential format
- **Status List 2021** — Credential revocation tracking
- **OID4VP** — OpenID for Verifiable Presentations

## Key Properties

| Property | Value |
|----------|-------|
| Algorithm | ML-DSA-65 (FIPS 204) |
| Signature size | 3309 bytes |
| Public key size | 1952 bytes |
| Secret key size | 4864 bytes |
| Security level | NIST Category 3 (AES-256 equivalent) |
| Quantum safe | Yes (lattice-based) |
