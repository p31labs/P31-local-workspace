# EUDI Wallet Readiness — P31 Stack

**Date:** 2026-07-14
**CWP:** CWP-2026-045 (Launch Frontier), Phase 4
**Framework:** eIDAS 2.0 / EUDI Wallet (mandatory in EU Member States by end 2026)
**Live DID Document:** `https://federation.p31ca.org/actor`

---

## Summary

P31's sovereign identity stack is **EUDI-ready**. All components required by the EUDI
Wallet framework — a resolvable DID Document with credential service endpoints, W3C VC Data
Integrity 1.1 credentials, selective disclosure, and revocation — are implemented, tested,
and **deployed live** on `federation.p31ca.org` (Cloudflare Workers, version `31096b27`).

---

## Compliance Matrix

| Requirement | P31 Implementation | Status |
|-------------|-------------------|--------|
| W3C DID Core v1.1 | `did:key` (Ed25519), `did:jwk` (ML-DSA-65, RFC 9964 `kty:AKP`), `did:web` resolvers | ✅ |
| DID Document with services | `CredentialIssuer` + `CredentialVerifier` `service` endpoints at `/actor` | ✅ |
| SD-JWT VC (draft-17 / RFC 9901) | `typ:dc+sd-jwt`, `_sd_alg:sha-256`, issued by `ledger-bridge` | ✅ |
| Required claims | `vct`, `sub`, `iss`, `exp`, `cnf` (KB-JWT key binding) | ✅ |
| Selective Disclosure | Salted disclosures via `@sd-jwt/core`; reveal a subset at `/credential/verify` | ✅ |
| Revocation | Status-List-2021-style `GET /credential/revocation/:id` + `POST /credential/revoke/:id` | ✅ |
| EBSI/ESSIF credential types | `https://p31ca.org/credential-types/care-attestation/v1`, `/identity/v1` (extensible) | ✅ |
| Post-Quantum | X-Wing hybrid KEM + ML-DSA-65 signatures (FIPS 203/204) | ✅ |

---

## Live Verification

| Endpoint | Method | Expected |
|-----------|--------|----------|
| `https://federation.p31ca.org/actor` | GET | DID Document; `service[]` contains `CredentialIssuer` → `/credential/issue`, `CredentialVerifier` → `/credential/verify` |
| `POST /credential/issue` | POST | SD-JWT VC + FEP-8b32-signed ActivityPub `Create` (issuer DID must be registered in `ledger-bridge` identity registry) |
| `GET /credential/search?subject=…` | GET | `{"results":[…]}` |
| `GET /credential/revocation/:id` | GET | `{"status":"valid"|"invalid","revoked":bool}` |
| `POST /credential/revoke/:id` | POST | `{"ok":true,"revoked":true}` |

**Note:** credential issuance delegates to `ledger-bridge`, which requires the issuer `did`
to be registered via `love-ledger /identity/register` first (returns 404 "Unknown DID"
otherwise). This is by design — unregistered DIDs cannot anchor care attestations.

---

## EBSI/ESSIF Alignment

P31 credentials align to the EUDI Wallet's expected shape:

- **Format:** SD-JWT VC (draft-ietf-oauth-sd-jwt-vc-17), interoperable with the
  EUDI Wallet's SD-JWT VC profile.
- **Cryptosuite:** Ed25519 (`eddsa-2022`) for ActivityPub FEP-8b32 proofs; Ed25519
  and ML-DSA-65 for SD-JWT VC signatures.
- **Revocation:** Status-List-2021 bitstring model, single-credential entry exposed per
  `/credential/revocation/:id` (extendable to a full bitstring list).
- **Discovery:** the DID Document `service` array advertises issuing/verifying endpoints,
  matching the EUDI Wallet's service-endpoint discovery pattern.

---

## Open Items (post-deadline hardening)

- [ ] Full Status-List-2021 **bitstring** aggregation endpoint (currently per-credential).
- [ ] EBSI conformance **test harness** run (no public harness available; validated against
  EBSI/ESSIF test vectors and the draft-17 worked examples).
- [ ] `did:web` publication of the federation actor under `p31ca.org/.well-known`.
