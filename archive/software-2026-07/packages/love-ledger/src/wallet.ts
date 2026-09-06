/**
 * @module love-ledger/wallet
 * @description Two-pool LOVE wallet.
 *
 * Every LOVE earned splits 50/50 into Sovereignty and Performance.
 * Sovereignty is immutable — it's your permanent record of care.
 * Performance is modulated by Care Score — high care = liquid, low care = frozen.
 *
 * The wallet is a pure function of the transaction log. It can always
 * be reconstructed from scratch by replaying transactions.
 */

import type { LoveTransaction, LoveWallet, LedgerConfig } from "./types.js";
import { DEFAULT_LEDGER_CONFIG } from "./types.js";

/**
 * Compute wallet state from a transaction log.
 * Pure function — no side effects, fully deterministic.
 */
export function computeWallet(
  transactions: readonly LoveTransaction[],
  careScore: number,
  config: LedgerConfig = DEFAULT_LEDGER_CONFIG,
  totalSpent: number = 0
): LoveWallet {
  const totalEarned = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const sovereigntyPool = totalEarned * config.splitRatio;
  const performancePool = totalEarned * (1 - config.splitRatio);

  const effectiveCS = Math.max(0, Math.min(1, careScore));
  const liquidFraction = effectiveCS >= config.minimumCareScore ? effectiveCS : 0;
  const grossAvailable = performancePool * liquidFraction;
  const availableBalance = Math.max(0, grossAvailable - totalSpent);
  const frozenBalance = performancePool - grossAvailable;

  return {
    totalEarned,
    sovereigntyPool,
    performancePool,
    careScore: effectiveCS,
    availableBalance,
    frozenBalance,
    transactionCount: transactions.length,
    lastActivity: transactions.length > 0
      ? transactions[transactions.length - 1]!.timestamp
      : new Date(0).toISOString(),
  };
}

/**
 * Compute the LOVE-per-day rate over a trailing window.
 */
export function lovePerDay(
  transactions: readonly LoveTransaction[],
  windowDays: number = 7
): number {
  const cutoff = Date.now() - windowDays * 86400000;
  const recent = transactions.filter(tx => new Date(tx.timestamp).getTime() >= cutoff);
  const total = recent.reduce((sum, tx) => sum + tx.amount, 0);
  return total / windowDays;
}

/**
 * Compute the care ratio: what fraction of LOVE came from care
 * interactions (CARE_GIVEN + CARE_RECEIVED) vs. all transactions.
 */
export function careRatio(transactions: readonly LoveTransaction[]): number {
  if (transactions.length === 0) return 0;
  const careTypes = new Set(["CARE_GIVEN", "CARE_RECEIVED"]);
  const careTotal = transactions
    .filter(tx => careTypes.has(tx.type))
    .reduce((sum, tx) => sum + tx.amount, 0);
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  return total > 0 ? careTotal / total : 0;
}

/**
 * Compute bond strength: LOVE earned from bond-related transactions
 * with a specific peer, as a fraction of total LOVE earned.
 */
export function bondStrength(
  transactions: readonly LoveTransaction[],
  peerId: string
): number {
  if (transactions.length === 0) return 0;
  const bondTypes = new Set([
    "TETRAHEDRON_BOND", "CARE_GIVEN", "CARE_RECEIVED",
    "COHERENCE_GIFT", "MILESTONE_REACHED"
  ]);
  const peerTotal = transactions
    .filter(tx => bondTypes.has(tx.type) && tx.counterparty === peerId)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const total = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  return total > 0 ? peerTotal / total : 0;
}
