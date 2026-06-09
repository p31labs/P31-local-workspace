# P31 LOVE Economy — Implementation Analysis

## Executive Summary

This document provides a comprehensive technical analysis of the P31 LOVE economy as implemented across the ecosystem. The LOVE token serves as the dual-currency cognitive economy's primary instrument, tracking engagement, care, and contribution across BONDING, Spaceship Earth, and the love-ledger worker.

---

## 1. Tokenomics

### 1.1 Dual-Currency Model

| Currency | Purpose | Mechanism |
|----------|---------|-----------|
| **LOVE** | Earned through care, creation, consistency | Syntropy side of entropy equation |
| **Spoons** | Spent on cognitive/physical energy | From spoon theory (Christine Miserandino) |

### 1.2 LOVE Sources & Values

| Source | Value | Cloud Transaction Type |
|--------|-------|----------------------|
| `molecule_complete` | 10 | `ARTIFACT_CREATED` |
| `ping_sent` | 5 | `CARE_GIVEN` |
| `ping_received` | 5 | `CARE_RECEIVED` |
| `quest_complete` | 50 | `MILESTONE_REACHED` |
| `buffer_processed` | 3 | `COHERENCE_GIFT` |
| `fawn_guard_ack` | 10 | `VOLTAGE_CALMED` |
| `calcium_logged` | 15 | `VOLTAGE_CALMED` |
| `wcd_complete` | 25 | `MILESTONE_REACHED` |
| `meditation_session` | 20 | `COHERENCE_GIFT` |
| `atom_placed` | 1 | `BLOCK_PLACED` |

### 1.3 Two-Pool Wallet Model

Every earn splits 50/50:

- **Sovereignty Pool**: Long-term, non-liquid. Represents persistent engagement.
- **Performance Pool**: Liquid, modulated by `care_score` (0.0–1.0). Spend limited by `performance_pool * care_score`.

```
available_balance = min(
  performance_pool * care_score,
  frozen_balance
)
```

---

## 2. Consensus Mechanism

### 2.1 Architecture

The system does not use traditional blockchain consensus. Instead:

- **Local-First**: IndexedDB in browser is source of truth
- **Cloud Sync**: Fire-and-forget POST to love-ledger worker
- **Durable Object Serialization**: `LoveTransactionDO` ensures atomic spend

### 2.2 Race Condition Mitigation

TOCTOU (Time-of-Check-Time-of-Use) is prevented via:

1. **DO-based serialization**: Each user gets a DO instance via `idFromName(userId)`
2. **Atomic SQL**: Spend uses single WHERE clause with balance check
3. **Optimistic UI**: Local IDB updates immediately, cloud retries silently

---

## 3. Smart Contract Architecture

### 3.1 Worker Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/love/register` | POST | Initialize user in D1 |
| `/api/love/earn` | POST | Add LOVE (transaction type) |
| `/api/love/spend` | POST | Atomic spend via DO |
| `/api/love/balance/:userId` | GET | Full wallet state |
| `/api/love/care-score` | POST | Update care score |

### 3.2 Durable Objects

- `LoveTransactionDO`: Atomic spend execution
- `GameRoomDO`: Multiplayer relay state (existing)
- `RoomStateDO`: Spatial chat state (existing)

### 3.3 Database Schema (D1)

```sql
CREATE TABLE balances (
  user_id TEXT PRIMARY KEY,
  total_earned REAL DEFAULT 0,
  sovereignty_pool REAL DEFAULT 0,
  performance_pool REAL DEFAULT 0,
  care_score REAL DEFAULT 0.5,
  frozen_balance REAL DEFAULT 0,
  last_updated INTEGER
);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  transaction_type TEXT,
  amount REAL,
  description TEXT,
  created_at INTEGER
);
```

---

## 4. Decentralization Metrics

### 4.1 Current State

| Dimension | Score | Notes |
|-----------|-------|-------|
| **State Storage** | Centralized | D1 (Cloudflare) |
| **Key Management** | Centralized | Worker-bound |
| **Client Identity** | Semi-decentralized | localStorage device ID |
| **Event Log** | Centralized | D1 transactions table |

### 4.2 Target Architecture (from cognitive passport)

- **PGLite + Mesh Sync**: Local-first, CRDT-based sync
- **Lit Protocol**: 2/3 threshold signature scheme (TSS)
- **Mathematical Sovereignty**: No reliance on external validation

### 4.3 Gap Analysis

| Current | Target | Gap |
|---------|--------|-----|
| D1 central DB | PGLite local DB | Medium |
| Worker key management | Lit Protocol TSS | High |
| localStorage device ID | Cryptographic identity | Medium |

---

## 5. Economic Incentives

### 5.1 Earn Channels

1. **BONDING gameplay**: Atoms, molecules, achievements, pings
2. **Buffer processing**: Coherence gift for cognitive work
3. **Calcium logging**: Medical compliance reward
4. **WCD completion**: Development milestone reward
5. **Meditation sessions**: Mindfulness practice reward

### 5.2 Spend Channels

1. **Performance pool modulation**: Available spend = `performance_pool * care_score`
2. **Vesting schedules**: Time-locked LOVE (future feature)
3. **Care score decay**: Requires ongoing engagement to maintain liquidity

### 5.3 Node Count System

Milestones tied to physics constants:

| Milestone | Count | Symbolism |
|-----------|-------|-----------|
| First tetrahedron | 4 | Maxwell rigidity |
| Posner number | 39 | Ca₉(PO₄)₆ |
| Dunbar's number | 150 | Social cognitive limit |
| Larmor frequency | 863 | ³¹P resonance |
| Abdication | 1776 | Independence |

---

## 6. Governance Structure

### 6.1 Current Model

- **P31 Labs**: 501(c)(3) nonprofit (in formation)
- **Operator**: Single point of coordination (Will Johnson)
- **Board**: Brenda (medical oversight), Ashley (Secretary), Carrie (Treasurer)

### 6.2 Algorithmic Governance

- **Care Score**: Peer-assigned credibility (future)
- **WCD Authorization**: SOULSAFE protocol for critical changes
- **OQE (Objective Quality Evidence)**: Proof-it-works requirement

---

## 7. Transaction Flow

### 7.1 BONDING → Cloud

```
User Action (atom placed)
       ↓
eventBus.emit(ATOM_PLACED)
       ↓
economyStore._onAtomPlaced()
       ↓
Local IDB update + syncEarn('BLOCK_PLACED')
       ↓
fetch(POST /api/love/earn) [fire-and-forget]
       ↓
Worker → D1 insert (earnings split 50/50)
```

### 7.2 Spend Flow

```
User requests spend
       ↓
fetch(POST /api/love/spend)
       ↓
LoveTransactionDO.fetch() [serialized per user]
       ↓
Atomic SQL: UPDATE balances SET performance_pool = ... 
            WHERE performance_pool * care_score >= amount
       ↓
Response to client
```

---

## 8. Liquidity Mechanisms

### 8.1 Performance Pool Liquidity

- Base: 50% of all earned LOVE
- Multiplier: `care_score` (0.0–1.0)
- Formula: `available = performance_pool * care_score`

### 8.2 Care Score Modulation

- **Initial**: 0.5
- **Increases**: Consistent engagement over time
- **Decreases**: Inactivity period
- **Range**: 0.0 (locked) to 1.0 (fully liquid)

### 8.3 Sovereignty Pool

- 50% of all earned LOVE
- Time-locked with age-based vesting to founding nodes (S.J. + W.J.)
- Vesting schedule: 10% at age 13, 25% at age 16, 50% at age 18, 75% at age 21, 100% at age 25
- Cannot be spent before vesting — only vests to individuals, not transferrable

---

## 9. Integration Points

### 9.1 BONDING

- **Local IDB**: Source of truth for game state
- **Cloud sync**: `initLoveSync({ workerUrl, userId })`
- **Transaction types**: BLOCK_PLACED, ARTIFACT_CREATED, CARE_GIVEN, CARE_RECEIVED, MILESTONE_REACHED

### 9.2 Spaceship Earth

- **useProtocolLoveSync**: Existing cloud sync hook
- **BridgeRoom**: LOVE wallet UI with pool breakdown
- **Rooms**: Observatory, Collider, Bonding (iframe), Bridge

### 9.3 Future Integrations

- **Buffer Dashboard**: Cognitive load tracking → LOVE
- **Node One Hardware**: Haptic feedback for LOVE events
- **Whale Channel**: Low-frequency communication → LOVE

---

## 10. Long-Term Sustainability

### 10.1 Economic Stability

- **Dual-currency**: LOVE (syntropy) vs Spoons (entropy)
- **Care score**: Prevents rapid drain, encourages consistency
- **50/50 split**: Sovereignty pool provides long-term store of value

### 10.2 Technical Sustainability

- **Local-first**: Works offline, syncs when connected
- **D1 + Durable Objects**: Serverless, auto-scaling
- **PGLite migration path**: Reduces cloud dependency

### 10.3 Legal/Compliance

- **501(c)(3)**: Tax-exempt nonprofit structure
- **ADA Title II**: Access-to-courts protections
- **Daubert-ready**: Forensic timestamping of engagement

---

## 11. Appendix: File Inventory

| File | Purpose |
|------|---------|
| [`economyStore.ts`](software/packages/shared/src/economy/economyStore.ts) | Local IDB store + cloud sync |
| [`love-ledger.ts`](software/workers/love-ledger.ts) | Cloudflare Worker |
| [`genesis.ts`](software/bonding/src/genesis/genesis.ts) | BONDING init + event wiring |
| [`wrangler.toml`](software/workers/wrangler.toml) | Worker config + DO bindings |
| [`D1_MIGRATION.md`](software/workers/D1_MIGRATION.md) | Schema migration script |
| [`LOVE_TRANSACTION_DO.md`](software/workers/LOVE_TRANSACTION_DO.md) | DO design doc |
| [`TWO_POOL_WORKER.md`](software/workers/TWO_POOL_WORKER.md) | Two-pool model doc |

---

*Document generated 2026-03-27*
*Part of P31 Labs — Open-source assistive technology for neurodivergent individuals*