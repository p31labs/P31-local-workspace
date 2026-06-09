# @p31/love-ledger

**L.O.V.E. — Ledger of Ontological Volume and Entropy**

The economic layer for the P31 assistive technology protocol. Translates [@p31/node-zero](https://www.npmjs.com/package/@p31/node-zero) protocol events into LOVE transactions, maintains a two-pool wallet, and tracks age-gated vesting for founding nodes.

LOVE is not a cryptocurrency. It is an accounting unit for care.

Built by [P31 Labs](https://phosphorus31.org), a Georgia 501(c)(3) nonprofit developing open-source assistive technology.

## Install

```bash
npm install @p31/love-ledger
```

## What It Does

**10 Transaction Types** — Every protocol interaction has a fixed LOVE value. Forming a bond earns 15 LOVE. Receiving care earns 3. Placing a block in the game world earns 1. Reaching a trust milestone earns 25.

**Two-Pool Wallet** — Every LOVE earned splits 50/50:
- **Sovereignty Pool** — Immutable. Cannot be spent. Represents the permanent record of care given and received. Vests to founding nodes on schedule.
- **Performance Pool** — Modulated by Care Score. High care = liquid. Low care = frozen. At CS=0, the pool is locked. At CS=1.0, fully available.

**Age-Gated Vesting** — Founding nodes (children) have sovereignty pools that unlock at developmental milestones: 10% at 13 (first device), 25% at 16, 50% at 18 (legal majority), 75% at 21, 100% at 25 (prefrontal cortex maturation).

**Event-Driven** — The ledger doesn't poll. It listens. Wire it to a Node Zero instance and every bond, state broadcast, vault creation, and trust promotion automatically generates the correct LOVE transaction.

## Quick Start

```typescript
import { LedgerEngine } from "@p31/love-ledger";

const ledger = new LedgerEngine("my-node-id");

// Wire to Node Zero events (one line per event, or use auto-forwarder)
node.on("BOND_FORMED", (e) => ledger.ingest("BOND_FORMED", e));
node.on("CARE_SCORE_UPDATED", (e) => ledger.ingest("CARE_SCORE_UPDATED", e));
node.on("REMOTE_STATE_RECEIVED", (e) => ledger.ingest("REMOTE_STATE_RECEIVED", e));

// Check wallet
console.log(ledger.wallet.totalEarned);     // LOVE earned
console.log(ledger.wallet.sovereigntyPool); // 50% immutable
console.log(ledger.wallet.availableBalance); // Performance × Care Score

// Check vesting
ledger.vesting.forEach(v =>
  console.log(`${v.node.name}: ${v.vestedPercent}% vested, ${v.daysUntilNext} days to next milestone`)
);

// Listen for new transactions
ledger.on("LOVE_EARNED", (tx) => console.log(`+${tx.amount} LOVE (${tx.type})`));

// Snapshot for encrypted storage
const snapshot = ledger.export();
// Later: ledger.import(snapshot);
```

## Transaction Catalog

| Type | LOVE | Triggered By |
|------|------|-------------|
| `BLOCK_PLACED` | 1.0 | Game engine block placement |
| `PING` | 1.0 | Peer discovered on mesh |
| `CARE_GIVEN` | 2.0 | Encrypted state transmitted |
| `VOLTAGE_CALMED` | 2.0 | Voltage drops below safe threshold |
| `CARE_RECEIVED` | 3.0 | Encrypted state received from peer |
| `COHERENCE_GIFT` | 5.0 | Q coherence crosses ≥ 0.65 |
| `ARTIFACT_CREATED` | 10.0 | Vault layer created |
| `TETRAHEDRON_BOND` | 15.0 | Bond formed (5-phase handshake) |
| `MILESTONE_REACHED` | 25.0 | Trust tier promotion |
| `DONATION` | variable | External crypto/fiat donation |

## Event → Transaction Mapping

```
Node Zero Event              →  LOVE Transaction
─────────────────────────────────────────────────
BOND_FORMED                  →  TETRAHEDRON_BOND (15)
VAULT_LAYER_CREATED          →  ARTIFACT_CREATED (10)
REMOTE_STATE_RECEIVED        →  CARE_RECEIVED (3)
TRANSMIT_COMPLETE            →  CARE_GIVEN (2)
PEER_DISCOVERED              →  PING (1)
COHERENCE_CHANGED (≥0.65)    →  COHERENCE_GIFT (5)
BOND_TRUST_CHANGED (↑)       →  MILESTONE_REACHED (25)
STATE_CHANGED (voltage↓)     →  VOLTAGE_CALMED (2)
CARE_SCORE_UPDATED           →  Pool rebalance (no LOVE)
```

## Wallet Architecture

```
        ┌──────────────────────────────┐
        │       Total LOVE Earned      │
        ├──────────────┬───────────────┤
        │  Sovereignty │  Performance  │
        │    Pool      │    Pool       │
        │   (50%)      │   (50%)      │
        │              │              │
        │  Immutable.  │  Modulated   │
        │  Vests to    │  by Care     │
        │  founding    │  Score.      │
        │  nodes.      │              │
        │              │  ┌─────────┐ │
        │              │  │Available│ │ ← CS × Pool
        │              │  ├─────────┤ │
        │              │  │ Frozen  │ │ ← (1-CS) × Pool
        │              │  └─────────┘ │
        └──────────────┴───────────────┘
```

## Vesting Schedule

| Age | Cumulative % | Milestone |
|-----|-------------|-----------|
| 13 | 10% | First device · first identity |
| 16 | 25% | Expanded autonomy |
| 18 | 50% | Legal majority |
| 21 | 75% | Full adult |
| 25 | 100% | Full sovereignty |

## API

### `LedgerEngine`

```typescript
new LedgerEngine(owner: string, config?: Partial<LedgerConfig>)

ledger.ingest(eventType: string, payload: object): LoveTransaction | null
ledger.donate(amount: number, meta?: object): LoveTransaction
ledger.blockPlaced(meta?: object): LoveTransaction

ledger.wallet: LoveWallet           // Derived from transaction log
ledger.transactions: LoveTransaction[] // Append-only log
ledger.vesting: VestingStatus[]      // Founding node status
ledger.careRatio: number             // Care tx fraction
ledger.lovePerDay: number            // 7-day trailing rate
ledger.bondStrength(peerId): number  // Per-peer LOVE fraction

ledger.export(): LedgerSnapshot      // Serialize for vault storage
ledger.import(snapshot): void        // Restore from snapshot

ledger.on("LOVE_EARNED", handler)
ledger.on("POOL_REBALANCED", handler)
ledger.on("VESTING_MILESTONE", handler)
ledger.on("LEDGER_RESTORED", handler)
```

## Stats

- **115 tests** passing
- **14.2 kB** packed
- **0** runtime dependencies
- **ES2022** module output
- **Pure functions** — wallet is always derived, never stored

## Related Packages

- [@p31/node-zero](https://www.npmjs.com/package/@p31/node-zero) — Protocol layer. Identity, bonds, vault, state.

## License

MIT — P31 Labs, a Georgia 501(c)(3) nonprofit.
