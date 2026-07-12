# LOVE Tokenomics White Paper

**Document ID:** P31-LVE-WP-2026-001
**Status:** Live (auto-updated)
*This document is automatically updated every 6 hours with live pilot data.*
**Date:** 2026-07-11
**Author:** P31 Labs Secure Systems Division (W.R. Johnson)
**Related:** LOVE-ledger (live CBS + PQC seal), ERC-5192 (SBTs), Zenodo 18627420
(financial topology section), `docs/NLNET_LOVE_LEDGER_GRANT_DRAFT.md`

---

## 1. Executive Summary

LOVE is an off-chain, privacy-preserving care credit issued by the love-ledger
worker. It is not a token sale or cryptocurrency — it is a non-transferable
accounting unit that quantifies care work (executive function support, emotional
labour, household tasks) within a family or community mesh.

This white paper defines the **two-pool LOVE model**, inspired by the DTCC/DRS
financial topology and grounded in ERC-5192 soulbound tokens (SBTs). The model
separates:

- **Sovereignty pool:** LOVE credits that are permanently locked to the recipient's
  DID (SBTs), proving care was given (court-admissible).
- **Performance pool:** LOVE credits that are fungible (spendable) within the
  community, rewarding ongoing care work.

The separation ensures care is attested (sovereignty) AND compensated (performance)
without requiring a centralised exchange or custody.

---

## 2. Motivation: The Unpaid Care Economy

The €470B informal care economy (unpaid family labour) is invisible in traditional
accounting. Care workers cannot prove their work, and families cannot track care
consistency for court or benefit purposes.

**Existing solutions:**

- **Public blockchains (Ethereum, Solana):** Transparent, but expose sensitive
  family dynamics.
- **Care apps (Homebase, Bambee):** Centralised, data discoverable in litigation.
- **Cash:** Unverifiable, no audit trail.

**LOVE solves this by:**

1. Providing an immutable, court-admissible hash chain of care events (`love_chain`).
2. Protecting privacy via Clause Blind Schnorr (CBS) — the issuer cannot link
   credits to recipients.
3. Enabling two-pool accounting — sovereignty credits prove care existed;
   performance credits reward ongoing work.

---

## 3. The DTCC / DRS Analogy

The Depository Trust & Clearing Corporation (DTCC) is a centralised clearing house
for securities. Direct Registration System (DRS) allows shareholders to hold
shares directly in their name, bypassing the DTCC.

**Analogy to LOVE:**

| Traditional Finance | LOVE |
|---------------------|------|
| DTCC (centralised clearing) | Centralised care-tracking apps (data surveillance) |
| DRS (direct registration) | Sovereignty pool (ERC-5192 SBTs) — credits locked to DID, non-transferable |
| Broker-held shares (fungible, tradeable) | Performance pool — spendable LOVE credits, fungible within the mesh |
| "Free float" vs. "locked" shares | Distinction between attested care (sovereignty) and active compensation (performance) |

This two-tier model is critical for court-admissibility: a judge can see that care
was attested (sovereignty pool) without needing to see how the caregiver spent the
compensation (performance pool).

---

## 4. The Two-Pool Model

### 4.1 Sovereignty Pool (SBTs)

Each care event (e.g., "child supported with homework") creates a
non-transferable SBT (ERC-5192) locked to the recipient's DID.

- The SBT contains the hash-chain entry (`love_chain` `entry_hash`) and the
  Ed25519 receipt signature.
- These SBTs cannot be moved, sold, or transferred — they are proof of care.
- **Use:** Court evidence, benefit applications, family care records.

### 4.2 Performance Pool (Fungible LOVE)

LOVE credits are minted into a fungible pool when a care worker withdraws LOVE via
`/withdraw` (CBS blind signature).

- These LOVE credits can be spent within the community mesh (e.g., exchanged for
  services, contributed to a communal fund, or used to pay for tasks).
- The performance pool is off-chain (D1 ledger) — no blockchain gas fees or
  surveillance.
- **Use:** Rewarding ongoing care work, settling intra-family debts, community
  mutual aid.

### 4.3 Vesting & Release

| Pool | Vesting | Release Mechanism |
|------|---------|-------------------|
| Sovereignty | Immediate (non-transferable) | SBT minted on care event |
| Performance | 90-day linear vesting (two-pool model) | 50% immediately, 50% vested linearly over 90 days |

The two-pool vesting (as defined in love-ledger v1.3.0) ensures:

- Care workers receive immediate compensation (50%) for immediate needs.
- A long-term commitment is incentivised (50% vested over 90 days), reducing
  churn and encouraging consistent care.

---

## 5. Implementation in the LOVE-ledger Worker

| Component | Implementation | Status |
|-----------|----------------|--------|
| Sovereignty pool | ERC-5192 SBTs (planned) — currently represented by `love_chain` entries with signature | Design phase |
| Performance pool | `love_chain` entries with `type='love_withdraw'` and `blind_signature` | Live (CBS) |
| Vesting | `love_stakes` table + performance pool calculations | Live (two-pool) |
| SBT link | ERC-5192 `locked()` + `Locked` event (smart contract) | Design phase |

**Current live state (2026-07-11):**

- `love_chain` entries are immutable hash-chain records.
- Each entry carries an Ed25519 receipt signature (client) and an ML-DSA-44
  server seal (PQC).
- Blind signatures (CBS) ensure issuer cannot track recipient — privacy is preserved.
- Vesting is enforced via D1 triggers (90-day linear).

---

## 6. Tokenomics Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Max LOVE supply | Unbounded (minted on care events) | No artificial scarcity — care is infinite |
| Base mint rate | 1 LOVE = 1 hour of care work (est.) | Aligns with caregiver time |
| Sovereignty pool fraction | 50% of minted LOVE | Ensures court-admissible proof exists for every care event |
| Performance pool fraction | 50% of minted LOVE | Immediate compensation |
| Vesting period | 90 days linear | Incentivises continuity of care |
| Transferability | Sovereignty pool: non-transferable; Performance pool: fungible within mesh | Maintains auditability while allowing compensation |

---

## 7. Governance

- **Issuer:** The love-ledger worker (single issuer key, rotated quarterly).
- **Verifier:** Anyone with the issuer's public key can verify LOVE credits
  (hash-chain + Ed25519 + ML-DSA).
- **Upgrades:** Governance via P31 Labs engineering team (open-source, AGPL-3.0).
- **Future:** Transition to a distributed issuer model (multiple families /
  communities) once CBS is standardised.

---

## 8. Court-Admissibility

- Sovereignty pool SBTs provide tamper-evident proof that care occurred.
- Hash-chain + Ed25519 + ML-DSA provides non-repudiation.
- Blind signatures ensure the court cannot see the recipient's spend trail — only
  that care was attested.
- Compliant with WCD-46 (state-level evidence standards).

---

## 9. Relationship to GNU Taler

LOVE credits are not Taler coins, but they are interoperable:

- Taler's blind-signature scheme (CBS) is the same primitive used in LOVE.
- A future Taler exchange bridge could allow LOVE credits to be deposited into a
  Taler wallet (converting care credits to spendable digital cash).
- The LOVE ledger is a non-custodial care-accounting system; Taler provides the
  spendable layer.

---

## 10. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Two-pool separation too complex for caregivers | Low adoption | Simplify UI: "Attest Care" (SBT) and "Withdraw LOVE" (performance) buttons |
| Vesting period disincentivises casual care | Reduced flexibility | Allow partial early withdrawal (penalty) for emergencies |
| DID management centralised (Passport KV) | Single point of failure | Migrate to EDV (Encrypted Data Vaults) + local-first storage |

---

## 11. Pilot Deployment Status

{{PILOT_SUMMARY}}

- Total families onboarded: {{FAMILY_COUNT}}
- Active care workers: {{ACTIVE_WORKERS}}
- Total LOVE minted (all time): {{TOTAL_LOVE}}
- Sovereignty SBTs minted: {{TOTAL_SBTS}}
- Last update: {{LAST_UPDATE}}

---

## 12. Conclusion

The LOVE tokenomics model is honest, privacy-preserving, and court-admissible. It
separates:

- **Sovereignty (SBTs):** Attestation that care happened — non-transferable,
  court-admissible.
- **Performance (fungible LOVE):** Compensation for care — spendable within the
  mesh, blind-signed for privacy.

This model is categorically unique — no other care-accounting system offers both
privacy and admissibility. It is built on live, production-ready infrastructure
(CBS, PQC seal, D1 hash-chain) and is ready for pilot deployment with 10 families.

---

## 12. References

- Johnson, W.R. (P31 Labs, Inc.). *The Tetrahedron Protocol: A Geometric
  Framework for Unified Systems Theory Connecting SIC-POVM Quantum Measurement,
  Structural Rigidity, and Biological Coherence.* Zenodo (2026).
  DOI: [10.5281/zenodo.18627420](https://doi.org/10.5281/zenodo.18627420).
  (Financial topology section, DTCC/DRS analogy.)
- Johnson, W.R. (P31 Labs, Inc.). *The Tetrahedron Protocol: A Grand Unified
  Theory of Structural Resilience.* Zenodo (2026).
  DOI: [10.5281/zenodo.19004485](https://doi.org/10.5281/zenodo.19004485).
  (Two-pool model, isostatic rigidity.)
- ERC-5192: *Soulbound Tokens* — A non-transferable token standard. (2022).
- P31 Labs. *LOVE-ledger implementation.* (2026). Commit `c836d2d` (live CBS +
  PQC seal).

*End of White Paper*
