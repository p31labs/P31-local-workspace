# EUDI Wallet Certification — P31 Stack

**CWP:** CWP-2026-047 (Growth Frontier), Phase 2
**Date:** 2026-07-14
**Status:** Implementation complete & EUDI-aligned; **formal certification PENDING**
**Certification Body:** EBSI/ESSIF (not yet engaged)
**EUDI Wallet mandate:** each EU Member State must offer ≥1 certified wallet by **end 2026** (eIDAS 2.0)

---

## ✅ Passed (implementation + draft-17 / EBSI test vectors)

| Test | Result | Evidence |
|------|--------|----------|
| DID resolution | ✅ Pass | `https://federation.p31ca.org/actor` returns a DID Document with `service[]` |
| Credential issuance | ✅ Pass | `POST /credential/issue` → SD-JWT VC |
| Required claims | ✅ Pass | `vct`, `sub`, `iss`, `exp`, `cnf` (KB-JWT key binding) |
| Selective disclosure | ✅ Pass | Salted disclosures via `@sd-jwt/core`; reveal subset at `/credential/verify` |
| Revocation | ✅ Pass | `GET /credential/revocation/:id` (Status-List-2021-style) + `POST /credential/revoke/:id` |
| Verification | ✅ Pass | SD-JWT VC verifies (Ed25519 + ML-DSA-65 paths) |
| Post-Quantum | ✅ Pass | X-Wing KEM + ML-DSA-65 (FIPS 203/204) |

---

## ⏳ Known Gaps (must close before formal certification)

| Gap | Why it matters | Action |
|-----|------------------|--------|
| **`did:web` publication** | EUDI wallets resolve `did:web:p31ca.org` → `https://p31ca.org/.well-known/did.json`. Currently only `did:key`/`did:jwk` are published; the `p31ca.org` zone must serve the actor DID Document under `/.well-known/`. | Add a `.well-known/did.json` route on the `p31ca.org` worker (host must match the DID). |
| **Aggregated Status-List-2021 bitstring** | Current revocation is per-credential. EUDI expects a single bitstring list resource (e.g. `/credential/revocation/list`) referenced by `statusListIndex`/`statusListCredential`. | Add aggregated list endpoint over the `credentials` table. |
| **EBSI-specific credential types** | The `https://ec.europa.eu/eudi/credential-types/*` URIs are the interoperable EUDI profile; P31 currently uses its own `https://p31ca.org/credential-types/*`. | Map P31 types to the EBSI EUDI credential-type catalogue. |
| **Formal EBSI/ESSIF harness run** | No public conformance harness was executed; validation was against EBSI/ESSIF test vectors + draft-17 worked examples. | Engage the EBSI/ESSIF test harness when available; document results. |
| **Security audit** | eIDAS 2.0 certification requires a penetration test + key-management review. | Schedule a third-party audit (post-pilot). |

---

## Path to Certification

1. Close the three code gaps above (`did:web`, aggregated Status-List, EBSI types).
2. Run the EBSI/ESSIF conformance harness; record pass/fail.
3. Complete a security audit (pentest + key management).
4. Submit for EUDI Wallet certification via the relevant Member-State authority.

*See `docs/EUDI-READINESS.md` for the live-verification matrix and `docs/CRYPTOGRAPHIC-INVENTORY.md` for the PQC inventory.*
