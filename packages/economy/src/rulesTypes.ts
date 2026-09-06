// ═══════════════════════════════════════════════════════
// @p31/economy — Local re-export of rules types needed
// by dualEconomyStore (SpoonBudget, SpoonTransaction,
// KarmaAward, KarmaSource).
// ═══════════════════════════════════════════════════════

export interface SpoonBudget {
  grossBudget: number;
  medicationPenalty: number;
  painPenalty: number;
  legalPenalty: number;
  emotionalPenalty: number;
  netBudget: number;
  spent: number;
  borrowed: number;
  remaining: number;
  tier: 'FULL' | 'MEDIUM' | 'LOW' | 'STAND_DOWN';
  lastResetTimestamp: number;
  tomorrowPenalty: number;
}

export interface SpoonTransaction {
  id: string;
  timestamp: number;
  type: 'SPEND' | 'BORROW' | 'REGENERATE' | 'PENALTY';
  amount: number;
  source: string;
  description: string;
  balanceAfter: number;
  hash: string;
}

export interface KarmaAward {
  id: string;
  timestamp: number;
  fromUserId: string;
  toUserId: string;
  amount: number;
  source: KarmaSource;
  workPackageId?: string;
  hash: string;
}

export type KarmaSource =
  | 'MOLECULE_COMPLETE'
  | 'PING_REACTION'
  | 'BUFFER_PROCESSED'
  | 'FAWN_GUARD_ACK'
  | 'CALCIUM_LOGGED'
  | 'WCD_COMPLETE'
  | 'MEDITATION_SESSION'
  | 'QUEST_CHAIN'
  | 'HELP_BOARD_COMPLETE'
  | 'PEER_AWARD';
