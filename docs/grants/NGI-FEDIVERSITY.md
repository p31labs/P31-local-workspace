# NGI Fediversity — Proposal Narrative (CWP-2026-026)

**Programme:** NGI Fediversity 12th Open Call
**Deadline:** 2026-08-01, 12:00 CEST
**Applicant:** P31 Labs
**Requested amount:** €25,000
**Status:** Draft ready for final submission — live demo links included below.

---

## 1. Problem

Mainstream platforms for neurodivergent users are centralised, surveillance-driven, and inaccessible.
Families cannot own their assistive tooling or their data. The "fortune 1" gap — making powerful,
sovereign assistive tech usable by real families — is unmet.

## 2. Solution — PHOS-Sovereign

**PHOS** is an ambient, spoon-aware workspace (neurodivergent-first UX: GPU-starfield, glassmorphism,
crisis-mode, `data-spoons` motion scaling). **PHOS-Sovereign** makes it decentralised and self-hostable:

- **ActivityPub bridge** — PHOS publishes/subscribes to the fediverse so families can share care
  artefacts (with selective disclosure) without a central platform.
- **NixOS module** — one-command, reproducible self-hosting of the full P31 stack
  (PHOS + love-ledger + ledger-bridge + contracts), so a school or co-op can run their own instance.
- **Sovereign identity** — Ed25519 `did:key` + quantum-safe `did:jwk` (ML-DSA-65); keys never leave
  the browser.

## 3. What we will build with NGI Fediversity funding

| Work package | Outcome |
|--------------|---------|
| ActivityPub bridge | Federated care-artefact sharing with selective disclosure |
| NixOS module | Reproducible, auditable self-host packaging of the P31 stack |
| Fediversity pilot | Deploy an instance for a pilot family cohort / partner org |
| Accessibility audit | WCAG 2.2 AAA pass + spoon-aware UX verification |

## 4. Live demonstration (already running)

- **PHOS:** https://phos.p31ca.org
  - **Care Mint:** https://phos.p31ca.org/mint
  - **PQC Keys (quantum-safe DIDs):** https://phos.p31ca.org/pqc-keys
  - **Passport (sovereign identity):** https://phos.p31ca.org/passport
- **On-chain (Base Sepolia 84532):** `ProofOfCare` `0x08263FdD…`, `LOVESBT` `0x521cAD1b…`,
  `P31TransparencyAnchor` `0xd930Fc4d…`
- **Decentralised care mesh:** `care-mesh` (Laplace DP + Ed25519-signed) — privacy-preserving care data.

## 5. Why NGI Fediversity

Fediversity's mission — a federated, user-owned internet — is exactly PHOS-Sovereign's thesis.
Funding lets us ship a self-hostable, fediverse-connected assistive workspace that families and
institutions can run *themselves*, removing P31 as a single point of control.

## 6. References

- NGI Fediversity: https://nlnet.nl/fediversity/
- Pilot onboarding: `docs/PILOT_ONBOARDING_GUIDE.md`
- Demo walkthrough: `docs/launch/CARE_SBT_DEMO.md`
- NGI TALER (companion proposal): `docs/grants/NGI-TALER.md`
