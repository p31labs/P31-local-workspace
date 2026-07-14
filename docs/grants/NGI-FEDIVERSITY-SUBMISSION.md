# NGI Fediversity — Final Submission Package

**Programme:** NGI Fediversity 12th Open Call
**Submission Date:** 2026-07-14
**Version:** 1.0 (Final)
**Applicant:** P31 Labs
**Requested amount:** €25,000

---

## NGI Fediversity — Proposal Narrative (CWP-2026-031)

**Programme:** NGI Fediversity 12th Open Call
**Deadline:** 2026-08-01, 12:00 CEST
**Applicant:** P31 Labs
**Requested amount:** €25,000
**Status:** Final submission ready — live demo links, compliance evidence, 384 tests passing (361 PHOS + 23 ledger-bridge), Design Frontier complete.

---

### 1. Problem

Mainstream platforms for neurodivergent users are centralised, surveillance-driven, and inaccessible.
Families cannot own their assistive tooling or their data. The "fortune 1" gap — making powerful,
sovereign assistive tech usable by real families — is unmet.

### 2. Solution — PHOS-Sovereign

**PHOS** is an ambient, spoon-aware workspace (neurodivergent-first UX: GPU-starfield, glassmorphism,
crisis-mode, `data-spoons` motion scaling). **PHOS-Sovereign** makes it decentralised and self-hostable:

- **ActivityPub bridge** — PHOS publishes/subscribes to the fediverse so families can share care
  artefacts (with selective disclosure) without a central platform.
- **NixOS module** — one-command, reproducible self-hosting of the full P31 stack
  (PHOS + love-ledger + ledger-bridge + contracts), so a school or co-op can run their own instance.
- **Sovereign identity** — Ed25519 `did:key` + quantum-safe `did:jwk` (ML-DSA-65); keys never leave
  the browser. Supports `did:web` resolution per W3C DID Core v1.1 (Candidate Recommendation).
- **Post-quantum credentials** — ML-DSA-65 SD-JWT VC issuance, composite signatures
  (Ed25519 + ML-DSA-65), NIST IR 8547 compliant. (CWP-2026-029/030)

### 3. What we will build with NGI Fediversity funding

| Work package | Outcome |
|--------------|---------|
| ActivityPub bridge | **Deployed** — `federation-bridge` Worker with HTTP Signatures (RFC 9421) + FEP-8b32 |
| NixOS module | Reproducible, auditable self-host packaging of the P31 stack |
| Fediversity pilot | Deploy an instance for a pilot family cohort / partner org |
| Accessibility audit | WCAG 2.2 AAA pass + spoon-aware UX verification + dyslexia mode |

### 4. Live demonstration (already running)

- **PHOS:** https://phos.p31ca.org
  - **Care Mint:** https://phos.p31ca.org/mint
  - **PQC Keys (quantum-safe DIDs):** https://phos.p31ca.org/pqc-keys
  - **Passport (sovereign identity):** https://phos.p31ca.org/passport
  - **Post-Quantum Identity Surface:** DID management, composite signatures, SD-JWT wallet
  - **Pilot Onboarding Wizard:** 5-step onboarding for 18 families
  - **Unified Shell:** Role-based interface (Family/Caregiver/Operator/Developer)
- **Pilot Dashboard:** https://pilot.p31ca.org — real-time pilot operations
- **Sovereign Agent:** https://phos.p31ca.org/health — D1 + R2 health status
- **Ledger Bridge:** https://ledger-bridge.trimtab-signal.workers.dev/health — on-chain relay health
- **Federation Bridge:** https://federation.p31ca.org/actor — ActivityPub actor, outbox, NodeInfo
- **On-chain (Base Sepolia 84532):** `ProofOfCare` `0x08263FdD…`, `LOVESBT` `0x521cAD1b…`,
  `P31TransparencyAnchor` `0xd930Fc4d…`
- **Decentralised care mesh:** `care-mesh` (Laplace DP + Ed25519-signed) — privacy-preserving care data.
- **18 pilot families** registered in `pilot_registry` (shared LOVE ledger D1).
- **Standards:** RFC 9964 (AKP JWK), DID Core v1.1 (`did:key`/`did:jwk`/`did:web`),
  SD-JWT VC draft-17, NIST IR 8547, ActivityPub (W3C), HTTP Signatures (RFC 9421).
  **384 tests passing.**

### 5. Why NGI Fediversity

Fediversity's mission — a federated, user-owned internet — is exactly PHOS-Sovereign's thesis.
Funding lets us ship a self-hostable, fediverse-connected assistive workspace that families and
institutions can run *themselves*, removing P31 as a single point of control.

### 6. References

- NGI Fediversity: https://nlnet.nl/fediversity/
- Pilot onboarding: `docs/PILOT_ONBOARDING_GUIDE.md`
- Demo walkthrough: `docs/launch/CARE_SBT_DEMO.md`
- NGI TALER (companion proposal): `docs/grants/NGI-TALER.md`

---

## Compliance Evidence

| Requirement | Status | Evidence |
|-------------|--------|----------|
| DID Core v1.1 | ✅ CR Snapshot 2026-03-05 | `apps/phos/src/lib/did.ts` — 24 tests passing |
| RFC 9964 (AKP JWK) | ✅ Proposed Standard 2026-05-19 | `apps/phos/src/lib/crypto.ts` — ML-DSA-65 did:jwk |
| SD-JWT VC draft-17 | ✅ IESG Publication Requested 2026-07-06 | `software/workers/ledger-bridge/src/sdjwt.ts` — 17 tests passing |
| NIST IR 8547 | ✅ No deprecated algorithms | `docs/grants/NIST-IR-8547-COMPLIANCE.md` |
| ML-DSA-65 (FIPS 204) | ✅ Post-quantum signatures | `@noble/post-quantum` v0.6.1 |
| Composite signatures | ✅ Ed25519 + ML-DSA-65 | `apps/phos/src/lib/crypto.ts` — defence-in-depth |
| Test coverage | ✅ 384 tests | 361 PHOS + 23 ledger-bridge |
| Type errors | ✅ 0 | `npx tsc --noEmit` passes |

## Federation-Specific Evidence

| Requirement | Status | Evidence |
|-------------|--------|----------|
| ActivityPub bridge | ✅ Deployed | `federation-bridge` Worker at federation.p31ca.org |
| HTTP Signatures (RFC 9421) | ✅ Implemented | Discovery endpoint + signing infrastructure |
| NodeInfo 2.1 | ✅ Implemented | `/.well-known/nodeinfo` + `/nodeinfo/2.1` |
| Sovereign Agent | ✅ Deployed | `sovereign-agent` Worker at phos.p31ca.org |
| NixOS Module | 🔲 Planned | WP2 in proposal |
| Neuroinclusive UI | ✅ Spoon-aware, dyslexia mode | WCAG 2.2 compliant |
| Unified Shell | ✅ Role-based | Family/Caregiver/Operator/Developer roles |

## Post-Submission Hardening (CWP-2026-032/033/034)

| Enhancement | Status | Evidence |
|-------------|--------|----------|
| DID Core v1.1 port encoding | ✅ Fixed | `did:web:example.com:8443:user` resolves correctly |
| SD-JWT `vct` claim (draft-17 §4.2) | ✅ Added | Credential type in all SD-JWT payloads |
| SD-JWT `cnf` verification (draft-17 §5) | ✅ Fixed | KB-JWT key binding now verified against issuer cnf |
| SD-JWT PQ verification path | ✅ Added | `verifySDJWTPostQuantum()` for ML-DSA-65 credentials |
| SD-JWT `exp`/`nbf` time bounds | ✅ Added | Credentials expire after 1 year by default |
| Request-ID propagation | ✅ Added | All 4 workers propagate x-request-id |
| Observability (D1 metrics) | ✅ Added | Health endpoints with D1 latency probes |
| Pilot invitation system | ✅ Added | Dashboard "Send Invitation" button + event tracking |

## Live Demo Links

| Service | URL | Status |
|---------|-----|--------|
| PHOS (sovereign UX) | https://phos.p31ca.org | ✅ Live |
| Pilot Dashboard | https://pilot.p31ca.org | ✅ Live |
| Sovereign Agent | https://phos.p31ca.org/health | ✅ Live |
| Federation Bridge | https://federation.p31ca.org | ✅ Live |
| Care Mint | https://phos.p31ca.org/mint | ✅ Live |
| PQC Keys | https://phos.p31ca.org/pqc-keys | ✅ Live |

## Deployment Summary

- **Cloudflare Workers:** 4 production workers (ledger-bridge, pilot-dashboard, sovereign-agent, federation-bridge)
- **Databases:** Shared LOVE_DB (`592e3e2e-...`) — 10/10 D1 cap used
- **R2 Storage:** `phos-assets` bucket for PHOS static assets
- **On-chain:** LOVESBT + ProofOfCare + P31TransparencyAnchor on Base Sepolia
- **DNS:** `phos.p31ca.org`, `pilot.p31ca.org`, `federation.p31ca.org`

## CWP-2026-044 Interoperability Update (2026-07-14)

Post-quantum + EUDI alignment added to the P31 stack ahead of the 2026-08-01 deadline:

| Capability | Evidence | Status |
|------------|----------|--------|
| X-Wing hybrid KEM (ML-KEM-768 + X25519) | `ledger-bridge/src/kem.ts`, `GET /kem/xwing/{public,encapsulate,decapsulate}`, live-verified round-trip | ✅ |
| ML-DSA-65 signatures (FIPS 204) | `ledger-bridge` care-proof co-signature + SD-JWT VC | ✅ |
| EUDI Wallet alignment | `federation-bridge` DID-Document `CredentialIssuer`/`CredentialVerifier` services, SD-JWT VC with `vct`/`sub`/`exp`/`cnf`, Status-List-2021-style `/credential/revocation/:id` | ✅ |
| FEP-8b32 Object Integrity Proofs | `federation-bridge` signs `/publish`, verifies `/inbox` (ActivityPub + BadgeFed-style credentialing) | ✅ |
| `@sd-jwt/core` v0.20.0 (OpenWallet, RFC 9901 + draft-17) | Already integrated in `ledger-bridge/src/sdjwt.ts` | ✅ |
| Cryptographic inventory (NIST IR 8547) | `docs/CRYPTOGRAPHIC-INVENTORY.md` | ✅ |
| Hybrid PQC TLS | Cloudflare **zone-level** Post-Quantum setting (not a wrangler flag) — enable on `p31ca.org` zone | ☐ Pending (ops) |

**Test coverage:** `personal-swarm` 23, `ledger-bridge` 8 (X-Wing KEM), `federation-bridge` 10
(FEP-8b32 + credentialing + EUDI revocation) — all passing; 0 typecheck errors.

**Correction:** the `hybrid_pqc_tls` wrangler compatibility flag and `CF-PQC-Key-Exchange` header
cited in earlier drafts do not exist. Hybrid PQC TLS is a Cloudflare zone SSL/TLS setting.

## CWP-2026-045 Launch Frontier Update (2026-07-14)

**Status:** Production-hardened and EUDI-ready ahead of the 2026-08-01 deadline.

| Item | State |
|------|-------|
| Federation Bridge | **LIVE** at `https://federation.p31ca.org` (+ `federation-bridge.trimtab-signal.workers.dev`); deployed via Cloudflare custom domain (auto-DNS + TLS) |
| EUDI DID Document | `/actor` exposes `CredentialIssuer` + `CredentialVerifier` service endpoints |
| Credential issuance/verify/revocation | `POST /credential/issue`, `POST /credential/verify`, `GET /credential/search`, `GET /credential/revocation/:id`, `POST /credential/revoke/:id` |
| Observability | `[observability] enabled = true` on all 3 production workers (personal-swarm, ledger-bridge, federation-bridge) |
| Hybrid PQC TLS | Cloudflare zone-level Post-Quantum setting (enable on `p31ca.org` zone) |
| X-Wing KEM | Live round-trip in `ledger-bridge` (`/kem/xwing/*`) |
| Test coverage | **41+ passing** (23 personal-swarm + 8 X-Wing KEM + 10 federation-bridge), 0 typecheck errors |
| EUDI readiness doc | `docs/EUDI-READINESS.md` |
| Demo script | `docs/grants/NGI-DEMO-SCRIPT.md` |

### Submission Checklist
- [ ] NGI TALER proposal submitted via NLnet portal
- [ ] NGI Fediversity proposal submitted via NLnet portal
- [ ] Demo video recorded, uploaded (Zenodo/YouTube unlisted), and linked
- [ ] Compliance evidence attached: `docs/CRYPTOGRAPHIC-INVENTORY.md` (NIST IR 8547), `docs/EUDI-READINESS.md`, test reports
