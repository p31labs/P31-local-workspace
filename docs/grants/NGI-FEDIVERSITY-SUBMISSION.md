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
**Status:** Final submission ready — live demo links, compliance evidence, 108+ tests passing, Design Frontier complete.

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
  **108+ tests passing.**

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
| Test coverage | ✅ 370+ tests | 354 PHOS + 16 ledger-bridge |
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
