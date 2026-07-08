# L.O.V.E. Economy — Corrected Reference Architecture

*Version: 1.0 (Post-Audit Reconciliation)*
*Date: July 7, 2026*

---

## 1. Executive Summary

The L.O.V.E. economy has been fragmented across three incompatible on-chain LOVE token implementations, a dead-on-arrival ProofOfCare reward path, and two colliding off-chain workers. This document reconciles all components into a single, coherent architecture:

- **LOVE is an off-chain D1 + Durable Objects ledger** (GNU Taler blind signatures for privacy).
- **On-chain presence is limited to ERC-5192 soulbound badges** (LOVESBT) and a ceremonial SBT (GenesisSpark).
- **LOVEToken.sol is retired** — no on-chain ERC20 LOVE token.

---

## 2. Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Single source of truth** | LOVE balances are stored exclusively in the D1 ledger (`love-ledger` worker). No on-chain ERC20. |
| **Privacy by design** | LOVE issuance and spend are blind-signed via GNU Taler. The exchange cannot track how or where tokens are spent. |
| **Soulbound by default** | LOVE cannot be bought, sold, or transferred. It is earned through verifiable care and spent on care-related goods/services. |
| **Agent-native** | The LOVE ledger is discoverable via `/.well-known/agents.json` and accessible via MCP tools. |
| **Court-admissible** | Care records are hash-chained (SHA-256) and timestamped, producing verifiable artifacts for family court while keeping emotional state private. |

---

## 3. Architecture Components

### 3.1 Off-Chain LOVE Ledger (Canonical)

| Component | Path | Purpose |
|-----------|------|---------|
| **D1 Worker** | `software/workers/love-ledger.ts` | Handles LOVE balances, care_score, two-pool accounting, vesting, and Taler blind-signature issuance. |
| **Durable Objects** | `LOVE_TRANSACTION` | Atomic spend/sync operations. |
| **D1 Database** | `love-ledger` | Stores balances, care_scores, vesting schedules, and transaction history. |
| **Shared Store** | `software/packages/shared/src/economy/economyStore.ts` | Single UI source of truth (IndexedDB + cloud sync). |
| **Identity** | DID:key + WebAuthn passkeys | Binds LOVE to a person, not a device. |

**The two-pool model:**
- 50% of each LOVE mint goes to the **Sovereignty Pool** (non-liquid, age-vested).
- 50% goes to the **Performance Pool** (liquid, but modulated by care_score: available = performance_pool × care_score).
- care_score range: 0.0 – 1.0, decayed over time if no care is logged.

### 3.2 On-Chain Attestation (ERC-5192 Badges)

| Contract | Path | Purpose |
|----------|------|---------|
| **LOVESBT** | `bonding-soup/packages/p31-sovereign-chain/src/LOVESBT.sol` | ERC-5192 soulbound badge. Mirrors high-value reputation milestones (not the liquid economy). Emits `Locked` event; blocks `setApprovalForAll`; fixed tokenURI indexing. |
| **GenesisSpark** | `bonding-soup/packages/p31-sovereign-chain/src/GenesisSpark.sol` | Ceremonial SBT. One-time mint to the Genesis Gate trigger wallet. Made soulbound. |
| **ProofOfCare** | `bonding-soup/packages/p31-sovereign-chain/src/ProofOfCare.sol` | **Re-scoped**: removed dead `suggest*` mint path. Now an off-chain care-score oracle that optionally writes an SBT attestation to LOVESBT. No on-chain LOVE minting. |

### 3.3 Retired / Archived

| File | Action |
|------|--------|
| `bonding-soup/.../LOVEToken.sol` | Archived to `archived/LOVEToken.sol`. Removed from Foundry build. |
| `p31-surrogate-backend/contracts/GODConstitution.sol` (5b) | `loveLedger` mapping removed. The contract is retained only if it holds non-LOVE governance; otherwise archived. |
| `contracts/GODConstitution.sol` (5a) | Kept as-is (no LOVE). |

---

## 4. Data Flow

```
[User] → (DID:key + WebAuthn) → [Bonding App]
                                    ↓
                          [economyStore.ts] (single UI counter)
                                    ↓
                        [love-ledger worker] (D1 + DO)
                                    ↓
              ┌─────────────────────┼─────────────────────┐
              ↓                     ↓                     ↓
       [Taler blind sig]    [care_score update]    [vesting schedule]
              ↓                     ↓                     ↓
        [LOVE balance]      [SBT attestation?]    [Growth Rings treasury]
```

**Reward path (fixed):**
1. User logs a care event (e.g., `care-api` → proof of care).
2. `love-ledger` worker computes care_score delta.
3. If care_score crosses a threshold, worker:
   - Mints LOVE to the user's D1 balance (split 50/50 Sovereignty/Performance).
   - Optionally calls `LOVESBT.mintSBT` with the new trustTier.
4. LOVE balance is immediately available (modulo vesting for Sovereignty pool).
5. No on-chain ERC20 LOVE is minted — the D1 balance is the token.

---

## 5. Phase-by-Phase Implementation Plan

| Phase | Work | Concrete Targets | Acceptance |
|-------|------|------------------|------------|
| **0** | ASSETS email + NLnet grant | Email `poster-demo-assets26@acm.org`; draft from `grants/GNU_TALER_LOVE_LEDGER_2026.md` | Both ready to send/submit |
| **1** | Archive LOVEToken.sol | Move to `archived/LOVEToken.sol`; remove from `foundry.toml`/build; strip `loveLedger` from GODConstitution (5b) | No on-chain LOVE ERC20; no more fragmentation |
| **2** | Off-chain hardening | Single UI counter (`economyStore.ts` only); DID:key+WebAuthn; `VITE_LOVE_LEDGER_URL` default; bonding→worker wiring | LOVE syncs to cloud by default; identity is cryptographic |
| **3** | On-chain attestation | LOVESBT→ERC-5192 (+Locked, block approvals, fix tokenURI); GenesisSpark soulbound; ProofOfCare→off-chain oracle | SBTs are fully soulbound; tokenURI indexing fixed |
| **4** | Agent-native | Create `apps/p31ca/public/.well-known/agents.json` with `love:ledger` capability; add `andromeda love status` MCP tool | Agents discover LOVE ledger; `andromeda love status` works |
| **5** | Tests | Off-chain reward path; GenesisSpark; LOVESBT ERC-5192 compliance | CI catches regressions; no dead code paths |

---

## 6. Open Questions (to be resolved during implementation)

| Question | Decision Point |
|----------|----------------|
| **Burn policy for LOVESBT** | Should burn be holder-controlled (ERC-5192 permits) or onlyOwner? Recommend **holder-controlled** for sovereignty. |
| **Genesis Spark transferability** | Keep it soulbound, or explicitly document as transferable? Recommend **soulbound** (consistent with ecosystem). |
| **Taler integration timeline** | Should be part of Phase 2 (off-chain) — GNU Taler Donau is production-ready. |
| **contracts/GODConstitution.sol (5a)** | Keep as governance artifact, or archive? Recommend **keep** as non-LOVE governance. |

---

## 7. References

- [ERC-5192](https://eips.ethereum.org/EIPS/eip-5192) — Minimal Soulbound NFT
- [GNU Taler](https://taler.net) — Blind-signature payment system
- [DID:key](https://w3c-ccg.github.io/did-method-key/) — Decentralized Identifier
- [PAPER-XXV](https://p31ca.org/papers/XXV) — Resonance Trust / Genesis Gate

---

*This document is the source of truth for the L.O.V.E. economy reconciliation. All implementation work must align with this spec.*
