/**
 * @module love-ledger/types
 * @description L.O.V.E. — Ledger of Ontological Volume and Entropy
 *
 * Type definitions for the P31 economy layer. Every interaction in the
 * Node Zero protocol generates economic value measured in LOVE. The
 * ledger translates protocol events into transactions, maintains a
 * two-pool wallet (Sovereignty + Performance), and tracks vesting
 * schedules for founding nodes.
 *
 * LOVE is not a cryptocurrency. It is an accounting unit for care.
 */

// ─── Transaction Types ──────────────────────────────────────────────

/**
 * The 10 canonical transaction types in the L.O.V.E. economy.
 * Each maps to one or more Node Zero protocol events.
 */
export type TransactionType =
  | "BLOCK_PLACED"       // Building in the game world
  | "COHERENCE_GIFT"     // Q coherence crosses threshold
  | "ARTIFACT_CREATED"   // Vault layer created
  | "CARE_RECEIVED"      // Encrypted state received from peer
  | "CARE_GIVEN"         // Encrypted state sent to peer
  | "TETRAHEDRON_BOND"   // Bond formed (5-phase handshake complete)
  | "VOLTAGE_CALMED"     // Voltage drops below safe threshold
  | "MILESTONE_REACHED"  // Trust tier promotion
  | "PING"               // Discovery beacon acknowledged
  | "DONATION";          // External crypto donation

/**
 * Fixed LOVE amounts for each transaction type.
 * These are protocol constants — changing them changes the economy.
 */
export const LOVE_AMOUNTS: Readonly<Record<TransactionType, number>> = {
  BLOCK_PLACED:      1.0,
  COHERENCE_GIFT:    5.0,
  ARTIFACT_CREATED: 10.0,
  CARE_RECEIVED:     3.0,
  CARE_GIVEN:        2.0,
  TETRAHEDRON_BOND: 15.0,
  VOLTAGE_CALMED:    2.0,
  MILESTONE_REACHED: 25.0,
  PING:              1.0,
  DONATION:          0.0,
} as const;

// ─── Spend Types ────────────────────────────────────────────────────

export type SpendType =
  | "PANEL_UNLOCK"
  | "FOUNDING_GIFT"
  | "SPOON_BOOST"
  | "DONATION";

export interface LoveSpend {
  readonly id: number;
  readonly type: SpendType;
  readonly amount: number;
  readonly owner: string;
  readonly recipient?: string;
  readonly timestamp: string;
  readonly meta?: Record<string, unknown>;
}

export const SPEND_COSTS: Readonly<Record<Exclude<SpendType, 'DONATION'>, number>> = {
  PANEL_UNLOCK: 5,
  FOUNDING_GIFT: 10,
  SPOON_BOOST: 3,
} as const;

// ─── Transaction Record ─────────────────────────────────────────────

/**
 * A single LOVE transaction in the ledger.
 * Immutable once created. Forms an append-only log.
 */
export interface LoveTransaction {
  readonly id: number;
  readonly type: TransactionType;
  readonly amount: number;
  readonly owner: string;
  readonly counterparty?: string;
  readonly trigger: string;
  readonly timestamp: string;
  readonly meta?: Record<string, unknown>;
}

// ─── Wallet Structure ───────────────────────────────────────────────

/**
 * The two-pool wallet. Every LOVE earned is split 50/50:
 *
 * - **Sovereignty Pool**: Immutable. Cannot be spent, traded, or
 *   transferred. Represents the intrinsic value of care given and
 *   received. Vests to founding nodes (children) on schedule.
 *
 * - **Performance Pool**: Modulated by Care Score. Higher care scores
 *   unlock more of this pool for in-game spending, donations, and
 *   peer-to-peer gifts. At CS=0, the performance pool is frozen.
 *   At CS=1.0, fully liquid.
 */
export interface LoveWallet {
  readonly totalEarned: number;
  readonly sovereigntyPool: number;
  readonly performancePool: number;
  readonly careScore: number;
  readonly availableBalance: number;
  readonly frozenBalance: number;
  readonly transactionCount: number;
  readonly lastActivity: string;
}

// ─── Vesting ────────────────────────────────────────────────────────

export interface FoundingNode {
  readonly name: string;
  readonly initials: string;
  readonly birthYear: number;
  readonly nodeId?: string;
}

export interface VestingMilestone {
  readonly ageYears: number;
  readonly cumulativePercent: number;
  readonly description: string;
}

/**
 * Age 13: 10%  — First device, first identity
 * Age 16: 25%  — Expanded autonomy
 * Age 18: 50%  — Legal majority
 * Age 21: 75%  — Full adult
 * Age 25: 100% — Prefrontal cortex maturation
 */
export const DEFAULT_VESTING_SCHEDULE: readonly VestingMilestone[] = [
  { ageYears: 13, cumulativePercent: 10,  description: "First device · first identity" },
  { ageYears: 16, cumulativePercent: 25,  description: "Expanded autonomy" },
  { ageYears: 18, cumulativePercent: 50,  description: "Legal majority" },
  { ageYears: 21, cumulativePercent: 75,  description: "Full adult" },
  { ageYears: 25, cumulativePercent: 100, description: "Full sovereignty" },
] as const;

export const FOUNDING_NODES: readonly FoundingNode[] = [
  { name: "Bashium", initials: "S.J.", birthYear: 2016 },
  { name: "Willium", initials: "W.J.", birthYear: 2019 },
] as const;

// ─── Ledger Configuration ───────────────────────────────────────────

export interface LedgerConfig {
  readonly splitRatio: number;
  readonly minimumCareScore: number;
  readonly coherenceGiftThreshold: number;
  readonly coherenceGiftCooldownMs: number;
  readonly voltageCalmThreshold: number;
  readonly voltageCalmCooldownMs: number;
  readonly vestingSchedule: readonly VestingMilestone[];
  readonly foundingNodes: readonly FoundingNode[];
}

export const DEFAULT_LEDGER_CONFIG: Readonly<LedgerConfig> = {
  splitRatio: 0.5,
  minimumCareScore: 0.1,
  coherenceGiftThreshold: 0.65,
  coherenceGiftCooldownMs: 60_000,
  voltageCalmThreshold: 0.3,
  voltageCalmCooldownMs: 300_000,
  vestingSchedule: DEFAULT_VESTING_SCHEDULE,
  foundingNodes: FOUNDING_NODES,
} as const;

// ─── Ledger Events ──────────────────────────────────────────────────

export interface LedgerEventMap {
  "LOVE_EARNED": LoveTransaction;
  "LOVE_SPENT": LoveSpend;
  "POOL_REBALANCED": {
    readonly careScore: number;
    readonly availableBalance: number;
    readonly frozenBalance: number;
  };
  "VESTING_MILESTONE": {
    readonly node: FoundingNode;
    readonly milestone: VestingMilestone;
    readonly unlockedAmount: number;
  };
  "LEDGER_RESTORED": {
    readonly transactionCount: number;
    readonly totalEarned: number;
  };
}

// ─── Snapshot ───────────────────────────────────────────────────────

export interface LedgerSnapshot {
  readonly version: 1;
  readonly owner: string;
  readonly transactions: readonly LoveTransaction[];
  readonly spends: readonly LoveSpend[];
  readonly wallet: LoveWallet;
  readonly snapshotAt: string;
}
