# NGI TALER — Proposal Narrative (CWP-2026-031)

**Programme:** NGI TALER 14th Open Call
**Deadline:** 2026-08-01, 12:00 CEST
**Applicant:** P31 Labs
**Requested amount:** €15,000
**Status:** Final submission ready — live demo links, compliance evidence, 384 tests passing, Design Frontier complete.

---

## 1. Problem

Caregiving for neurodivergent families is invisible labour. There is no verifiable, privacy-preserving
record that a family *provided* consistent care — which matters for schools, clinicians, courts, and
grant reviewers. Existing systems either centralise sensitive data (privacy risk) or issue tokens that
extract value from caregivers (extractive economies).

## 2. Solution — the P31 Creation Economy

P31 builds a **co-creative, non-extractive care economy** where value is settled on *care created for
the user* (spoons saved, care generated), not value extracted. Three pillars:

- **Sovereign identity** — each user owns an Ed25519 `did:key` (plus a quantum-safe `did:jwk` /
  ML-DSA-65). No server password; keys stay in the user's browser. Supports `did:web` resolution
  per W3C DID Core v1.1 (Candidate Recommendation, 2026-03-05).
- **Court-admissible care records** — the LOVE ledger (`love-ledger`) keeps a SHA-256 hash chain
  (`love_chain`), anchored on-chain via `P31TransparencyAnchor` on Base Sepolia.
- **Privacy-preserving settlement** — GNU Taler **blind signatures** (CBS WASM, `BLIND_MODE='taler'`)
  issue LOVE care-credits without linking withdrawals to spends.
- **Post-quantum cryptography** — ML-DSA-65 (NIST FIPS 204) for signatures, composite
  (Ed25519 + ML-DSA-65) for defence-in-depth, SD-JWT VC draft-17 for credentials.
  NIST IR 8547 compliant — no deprecated algorithms. (CWP-2026-029/030)

## 3. What we will build with NGI TALER funding

| Work package | Outcome |
|--------------|---------|
| LOVE → Taler bridge hardening | Production-grade blind-sig issuance + spend path; load + chaos tests |
| Care SBT ↔ Taler mapping | Map `ProofOfCare` care scores to Taler income/value units |
| Pilot rollout | Onboard the 18 active pilot families; ≥5 mint a Care SBT |
| Audit & docs | Security review of the blind-sig path; open docs + demo video |

## 4. Live demonstration (already running)

- **PHOS** (sovereign UX): https://phos.p31ca.org
  - **Care Mint** surface: https://phos.p31ca.org/mint — sign a care proof, mint a `ProofOfCare` SBT
  - **PQC Keys** surface: https://phos.p31ca.org/pqc-keys — ML-KEM-768 / ML-DSA-44 / ML-DSA-65 + `did:jwk`
- **Pilot Dashboard** (operations): https://pilot.p31ca.org
  - Real-time pilot registry, care proof stats, SD-JWT issuance tracking
- **Sovereign Agent** (edge node): https://phos.p31ca.org/health — D1 + R2 health status
- **Ledger Bridge** (on-chain relay): https://ledger-bridge.trimtab-signal.workers.dev/health
- **On-chain contracts (Base Sepolia, 84532):**
  - `ProofOfCare` — `0x08263FdD50196F229C9C2ccD650056067b884538`
  - `LOVESBT` — `0x521cAD1b54CDDB2B6B53a30EBe050C429F9c6C55`
  - `P31TransparencyAnchor` — `0xd930Fc4d429BbE6B8CEcca9e4C77386dB528e267`
- **Post-quantum credentials:** ML-DSA-65 SD-JWT VC issuance via `POST /credential/issue`
  with `post_quantum: true`. NIST IR 8547 compliant.
- **Federation Bridge:** ActivityPub federation for care attestations (CWP-2026-031 Phase 3).
  HTTP Signatures (RFC 9421) + Object Integrity Proofs (FEP-8b32).
- **Unified Shell:** Single role-based interface merging PHOS + Pilot Dashboard + Sovereign Agent
  (CWP-2026-031 Phase 4). Family, Caregiver, Operator, Developer roles.
- **Post-Quantum Identity Surface:** DID management (rotate/revoke), composite signature
  visualisation, SD-JWT wallet (CWP-2026-031 Phase 5).
- **Pilot Onboarding Wizard:** 5-step flow: DID → PQC Keys → Register → Care Proof → SBT Mint.
  Spoon-aware, WCAG 2.2 AAA (CWP-2026-031 Phase 6).
- **Architecture:** `ledger-bridge` verifies the DID↔ETH binding (Ed25519, ML-DSA-65, or composite)
  before relaying `submitCareProofs` — open minting is removed.

## 7. Standards compliance (CWP-2026-029/030)

| Standard | Status | P31 Implementation |
|----------|--------|---------------------|
| RFC 9964 (AKP JWK) | Proposed Standard, 2026-05-19 | `kty:AKP`, `alg:ML-DSA-65`, JWK Thumbprint |
| W3C DID Core v1.1 | Candidate Recommendation, 2026-03-05 | `did:key`, `did:jwk`, `did:web` |
| SD-JWT VC draft-17 | IESG Publication Requested, 2026-07-06 | `typ:dc+sd-jwt`, KB-JWT key binding |
| NIST IR 8547 | RSA/ECC deprecated 2030 | ML-DSA-65 primary, no deprecated algorithms |
| WCAG 2.2 | W3C Recommendation | Crisis mode, spoon-aware, skip links, dyslexia mode |
| ActivityPub | W3C Recommendation | Federation Bridge, HTTP Signatures (RFC 9421) |
| **Test coverage** | **384 tests passing** | 361 PHOS + 23 ledger-bridge |

## 5. Why NGI TALER

Taler's blind signatures are the only mature primitive for **unlinkable, privacy-preserving
micropayments**. P31's care credits are exactly the use case Taler was built for: value issued by a
trusted mint, spent without surveillance. Funding accelerates the LOVE→Taler bridge from prototype
to a pilot-ready system serving real neurodivergent families.

## 6. References

- NGI TALER: https://nlnet.nl/taler/
- GNU Taler: https://taler.net
- Pilot onboarding: `docs/PILOT_ONBOARDING_GUIDE.md`
- Demo walkthrough: `docs/launch/CARE_SBT_DEMO.md`
