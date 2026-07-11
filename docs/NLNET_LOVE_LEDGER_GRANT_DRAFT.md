# L.O.V.E. Ledger — Privacy-Preserving Accounting System for Neurodivergent Care Work

**Grant Application:** NLnet / GNU Taler — **14th Open Call**
**Amount:** €15,000
**Status:** Draft (updated July 2026) — consolidated version at `grants/NGI-2026-PROPOSALS-DRAFT.md` is authoritative
**Verified state (2026-07-11):** UIG Adaptive Exocortex shipped + tagged (`v1.0.0-uig-convergence`); TRIPER cert 12/12 suites (84 tests) green; WCAG 2.2 AAA automated axe-core audit 0 blocking violations across all 4 faces.

---

## 1. Executive Summary

We propose the **L.O.V.E. Ledger** — a privacy-preserving, soulbound care-accounting system built on GNU Taler blind signatures. The ledger enables neurodivergent families to:

- **Earn LOVE tokens** through verifiable acts of care (time-weighted proximity, HRV-aligned "Green Coherence").
- **Spend LOVE tokens** on care-related goods/services without revealing their financial history.
- **Produce court-admissible care artifacts** (hash-chained, WCD-46-style SHA-256 chains) that prove consistency of care while keeping private emotional state hidden from opposing counsel.

The system is already 80% prototyped (Cloudflare D1 + Durable Objects). This grant will complete the GNU Taler blind-signature integration and reconcile the on-chain ERC-5192 attestation layer.

## 2. Technical Overview

### 2.1 Architecture

| Layer | Component | Purpose |
|-------|-----------|---------|
| **User** | DID:key + WebAuthn | Cryptographic user binding (no device-only IDs). |
| **Client** | Bonding App + economyStore.ts | Single UI source of truth; syncs to cloud. |
| **Ledger** | love-ledger worker (D1 + DO) | LOVE balances, care_score, two-pool accounting, vesting. |
| **Privacy** | GNU Taler blind signatures | LOVE issuance is unlinkable; spend trails hidden. |
| **Attestation** | LOVESBT (ERC-5192) | On-chain soulbound badge mirroring high-value reputation milestones. |

### 2.2 GNU Taler Integration

LOVE tokens are issued as **blind-signed digital cash** via GNU Taler's exchange.

**Flow:**
1. User's care_score crosses a threshold.
2. Ledger worker requests a blind signature from the Taler exchange.
3. User receives a blinded LOVE token.
4. User can spend the token at any Taler-compatible merchant.
5. The exchange knows the token was issued but **cannot track where or how it is spent**.

This gives LOVE the privacy properties of cash while maintaining a verifiable issuance ledger for tax/court purposes.

### 2.3 Court-Admissible Artifacts

- Every LOVE mint and spend is recorded in a **hash chain** (SHA-256).
- The chain is anchored to a public timestamp (Cloudflare D1 or Ethereum).
- A family can produce a **WCD-46-style chain** showing consistent care over time.
- The chain **does not expose** the emotional content of care — only the fact that care occurred.

## 3. Budget

| Item | Cost (€) |
|------|----------|
| Taler exchange integration | 8,000 |
| DID:key + WebAuthn binding | 4,000 |
| D1 + DO worker hardening | 4,000 |
| Testing & documentation | 3,000 |
| Miscellaneous (hosting, audits) | 1,000 |
| **Total** | **20,000** |

## 4. Deliverables

1. GNU Taler blind-signature LOVE issuance (live on testnet).
2. DID:key + WebAuthn identity binding (replaces localStorage device ID).
3. Single UI counter + cloud sync (economyStore.ts).
4. Court-admissible artifact generation (hash-chained care records).
5. Updated documentation and developer onboarding.

## 5. Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Integration | 2 months | Taler blind-signature LOVE issuance |
| Identity | 1 month | DID:key + WebAuthn |
| Hardening | 2 months | Worker resilience, tests, docs |
| Pilot | 1 month | Family pilot with 10 users |
| **Total** | **6 months** | |

## 6. Contact

Will Johnson
P31 Labs
will@p31ca.org
https://p31ca.org
