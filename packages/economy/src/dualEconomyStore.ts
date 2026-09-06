// ═══════════════════════════════════════════════════════
// @p31/shared — Dual-Currency Economy Store (Spoons + Karma)
//
// Spoons  = metabolic energy. 12/day gross budget, borrow at
//          1.5x tomorrow-penalty, penalties from the morning
//          assessment (medication / pain / legal / emotional).
// Karma   = monotonic, peer-awarded reputation. Never decreases.
//
// Transactions are append-only and SHA-256 hash-chained (each
// record carries the hash of the previous + itself). Persistence
// is wired by the host app through connectLedgerAppender(), which
// writes rows to a PGLite `ledger` table — the store itself stays
// free of a hard PGLite import so it remains testable in isolation.
// ═══════════════════════════════════════════════════════

import { create } from 'zustand';
import type {
  KarmaAward,
  KarmaSource,
  SpoonBudget,
  SpoonTransaction,
} from './rulesTypes';

export const GROSS_SPOONS = 12;
export const BORROW_INTEREST = 1.5;

// ── Ledger appender (host-app wired, e.g. shell/src/lib/db.ts) ──

export interface LedgerEntry {
  id: string;
  actor_did: string;
  entry_type: string;
  payload: string;
  created_at: number;
}

let _appendLedger: ((entry: LedgerEntry) => Promise<void>) | null = null;

export function connectLedgerAppender(
  fn: ((entry: LedgerEntry) => Promise<void>) | null,
): void {
  _appendLedger = fn;
}

// Convenience wrapper — replays ledger rows into the store (host-app boot path).
export function hydrateFromLedger(entries: LedgerEntry[]): void {
  useDualEconomyStore.getState().hydrateFromLedger(entries);
}

// ── Hash chain ──

const GENESIS_HASH = 'genesis';

async function sha256(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function chainHash(prev: string, payload: string): Promise<string> {
  return sha256(`${prev}\n${payload}`);
}

function uid(): string {
  return typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `tx-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Budget computation ──

export interface MorningAssessmentInput {
  medicationTaken: boolean;  // -2 if not taken
  painLevel: number;         // 0-10, -2 if > 5
  courtDay: boolean;         // -3 if true
  fragile: boolean;          // -1 if true
}

export function computeBudget(
  assessment: MorningAssessmentInput,
  carriedOver: { spent: number; borrowed: number },
): SpoonBudget {
  const medicationPenalty = assessment.medicationTaken ? 0 : -2;
  const painPenalty = assessment.painLevel > 5 ? -2 : 0;
  const legalPenalty = assessment.courtDay ? -3 : 0;
  const emotionalPenalty = assessment.fragile ? -1 : 0;

  const grossBudget = GROSS_SPOONS;
  const netBudget = grossBudget + medicationPenalty + painPenalty + legalPenalty + emotionalPenalty;
  const remaining = netBudget - carriedOver.spent;

  const tier: SpoonBudget['tier'] =
    remaining >= 10 ? 'FULL' : remaining >= 6 ? 'MEDIUM' : remaining >= 3 ? 'LOW' : 'STAND_DOWN';

  return {
    grossBudget,
    medicationPenalty,
    painPenalty,
    legalPenalty,
    emotionalPenalty,
    netBudget,
    spent: carriedOver.spent,
    borrowed: carriedOver.borrowed,
    remaining,
    tier,
    lastResetTimestamp: startOfDay(),
    tomorrowPenalty: Math.round(carriedOver.borrowed * BORROW_INTEREST),
  };
}

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isNewDay(lastReset: number): boolean {
  return lastReset < startOfDay();
}

// ── Store ──

interface DualEconomyState {
  _hasHydrated: boolean;
  did: string;
  budget: SpoonBudget;
  lifetimeKarma: number;
  spoonTransactions: SpoonTransaction[];
  karmaAwards: KarmaAward[];
  _lastHash: string;

  hydrate: (did: string) => void;
  hydrateFromLedger: (entries: LedgerEntry[]) => void;
  runMorningAssessment: (assessment: MorningAssessmentInput) => Promise<void>;
  spendSpoons: (amount: number, source: string, description: string) => Promise<boolean>;
  borrowSpoons: (amount: number, source: string, description: string) => Promise<boolean>;
  regenerateSpoons: (amount: number, source: string, description: string) => Promise<void>;
  awardKarma: (fromUserId: string, toUserId: string, amount: number, source: KarmaSource) => Promise<void>;
}

function defaultBudget(): SpoonBudget {
  return computeBudget(
    { medicationTaken: true, painLevel: 0, courtDay: false, fragile: false },
    { spent: 0, borrowed: 0 },
  );
}

export const useDualEconomyStore = create<DualEconomyState>()((set, get) => ({
  _hasHydrated: false,
  did: '',
  budget: defaultBudget(),
  lifetimeKarma: 0,
  spoonTransactions: [],
  karmaAwards: [],
  _lastHash: GENESIS_HASH,

  hydrate: (did) => {
    const s = get();
    // New calendar day → recompute budget from today's penalties, carry no
    // spent/borrowed (the borrowed 1.5x penalty already landed yesterday).
    if (isNewDay(s.budget.lastResetTimestamp)) {
      set({ did, budget: defaultBudget(), _lastHash: GENESIS_HASH });
    } else {
      set({ did });
    }
  },

  hydrateFromLedger: (entries) => {
    const s = get();
    const did = entries.find((e) => e.actor_did)?.actor_did || s.did;
    const ordered = [...entries].sort((a, b) => a.created_at - b.created_at);

    let spent = 0;
    let borrowed = 0;
    let remaining: number | null = null;
    let lifetimeKarma = 0;
    let sawRelevant = false;
    const spoonTransactions: SpoonTransaction[] = [];
    const karmaAwards: KarmaAward[] = [];
    let lastHash = GENESIS_HASH;

    for (const entry of ordered) {
      if (!entry.entry_type.startsWith('SPOON_') && entry.entry_type !== 'KARMA_AWARD') continue;
      let payload: unknown;
      try { payload = JSON.parse(entry.payload); } catch { continue; }

      if (entry.entry_type === 'KARMA_AWARD') {
        const award = payload as KarmaAward;
        if (award && typeof award.amount === 'number' && award.amount > 0) {
          sawRelevant = true;
          karmaAwards.push(award);
          lifetimeKarma += award.amount;
          if (award.hash) lastHash = award.hash;
        }
        continue;
      }

      const tx = payload as SpoonTransaction;
      if (!tx || typeof tx.amount !== 'number' || typeof tx.balanceAfter !== 'number') continue;
      sawRelevant = true;
      spoonTransactions.push(tx);
      if (tx.hash) lastHash = tx.hash;
      if (entry.entry_type === 'SPOON_SPEND') spent += tx.amount;
      if (entry.entry_type === 'SPOON_BORROW') borrowed += tx.amount;
      remaining = tx.balanceAfter;
    }

    if (!sawRelevant) {
      set({ did, budget: defaultBudget(), _hasHydrated: true });
      return;
    }

    const rem = remaining ?? GROSS_SPOONS;
    const netBudget = rem + spent;
    const tier: SpoonBudget['tier'] =
      rem >= 10 ? 'FULL' : rem >= 6 ? 'MEDIUM' : rem >= 3 ? 'LOW' : 'STAND_DOWN';

    set({
      did,
      lifetimeKarma,
      spoonTransactions,
      karmaAwards,
      _lastHash: lastHash,
      _hasHydrated: true,
      budget: {
        grossBudget: GROSS_SPOONS,
        medicationPenalty: 0,
        painPenalty: 0,
        legalPenalty: 0,
        emotionalPenalty: 0,
        netBudget,
        spent,
        borrowed,
        remaining: rem,
        tier,
        lastResetTimestamp: startOfDay(),
        tomorrowPenalty: Math.round(borrowed * BORROW_INTEREST),
      },
    });
  },

  runMorningAssessment: async (assessment) => {
    const s = get();
    const budget = computeBudget(assessment, {
      spent: s.budget.spent,
      borrowed: s.budget.borrowed,
    });
    set({ budget });

    const tx: SpoonTransaction = {
      id: uid(),
      timestamp: Date.now(),
      type: 'PENALTY',
      amount: budget.netBudget - budget.grossBudget + Math.round(budget.borrowed * BORROW_INTEREST),
      source: 'morning_assessment',
      description: `Morning assessment — net ${budget.netBudget}/${budget.grossBudget} (${budget.tier})`,
      balanceAfter: budget.remaining,
      hash: '',
    };
    const hash = await chainHash(s._lastHash, JSON.stringify(tx));
    tx.hash = hash;
    const spoonTransactions = [...s.spoonTransactions, tx];
    set({ spoonTransactions, budget: { ...budget }, _lastHash: hash });
    await appendTx('SPOON_PENALTY', s.did, tx);
  },

  spendSpoons: async (amount, source, description) => {
    const s = get();
    if (amount <= 0 || amount > s.budget.remaining) return false;

    const balanceAfter = s.budget.remaining - amount;
    const tx: SpoonTransaction = {
      id: uid(),
      timestamp: Date.now(),
      type: 'SPEND',
      amount,
      source,
      description,
      balanceAfter,
      hash: '',
    };
    const hash = await chainHash(s._lastHash, JSON.stringify(tx));
    tx.hash = hash;

    set({
      budget: { ...s.budget, spent: s.budget.spent + amount, remaining: balanceAfter },
      spoonTransactions: [...s.spoonTransactions, tx],
      _lastHash: hash,
    });
    await appendTx('SPOON_SPEND', s.did, tx);
    return true;
  },

  borrowSpoons: async (amount, source, description) => {
    const s = get();
    if (amount <= 0) return false;

    const borrowed = s.budget.borrowed + amount;
    const tomorrowPenalty = Math.round(borrowed * BORROW_INTEREST);
    const remaining = s.budget.remaining + amount;

    const tx: SpoonTransaction = {
      id: uid(),
      timestamp: Date.now(),
      type: 'BORROW',
      amount,
      source,
      description: `${description} (tomorrow -${tomorrowPenalty})`,
      balanceAfter: remaining,
      hash: '',
    };
    const hash = await chainHash(s._lastHash, JSON.stringify(tx));
    tx.hash = hash;

    set({
      budget: { ...s.budget, borrowed, remaining, tomorrowPenalty },
      spoonTransactions: [...s.spoonTransactions, tx],
      _lastHash: hash,
    });
    await appendTx('SPOON_BORROW', s.did, tx);
    return true;
  },

  regenerateSpoons: async (amount, source, description) => {
    const s = get();
    const remaining = Math.min(s.budget.netBudget, s.budget.remaining + amount);
    const tx: SpoonTransaction = {
      id: uid(),
      timestamp: Date.now(),
      type: 'REGENERATE',
      amount,
      source,
      description,
      balanceAfter: remaining,
      hash: '',
    };
    const hash = await chainHash(s._lastHash, JSON.stringify(tx));
    tx.hash = hash;

    set({
      budget: { ...s.budget, remaining },
      spoonTransactions: [...s.spoonTransactions, tx],
      _lastHash: hash,
    });
    await appendTx('SPOON_REGENERATE', s.did, tx);
  },

  awardKarma: async (fromUserId, toUserId, amount, source) => {
    const s = get();
    if (fromUserId === toUserId || amount <= 0) return;

    const award: KarmaAward = {
      id: uid(),
      timestamp: Date.now(),
      fromUserId,
      toUserId,
      amount,
      source,
      hash: '',
    };
    const hash = await chainHash(s._lastHash, JSON.stringify(award));
    award.hash = hash;

    set({
      lifetimeKarma: s.lifetimeKarma + amount,
      karmaAwards: [...s.karmaAwards, award],
      _lastHash: hash,
    });
    await appendTx('KARMA_AWARD', s.did, award);
  },
}));

async function appendTx(
  entryType: string,
  actorDid: string,
  tx: SpoonTransaction | KarmaAward,
): Promise<void> {
  if (!_appendLedger) return;
  await _appendLedger({
    id: tx.id,
    actor_did: actorDid || 'local',
    entry_type: entryType,
    payload: JSON.stringify(tx),
    created_at: tx.timestamp,
  }).catch(() => {});
}
