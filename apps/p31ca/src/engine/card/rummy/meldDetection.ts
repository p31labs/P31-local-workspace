import { Card } from '../core/types.ts';
import { CARD_POINTS } from '../core/types.ts';

export interface Meld {
  readonly type: 'set' | 'run';
  readonly cards: Card[];
}

export interface MeldResult {
  readonly melds: Meld[];
  readonly deadwood: Card[];
  readonly deadwoodPoints: number;
  readonly isGin: boolean;
  readonly canKnock: boolean;
}

export function detectMelds(cards: Card[]): MeldResult {
  const candidates = enumerateCandidates(cards);
  const best = solveOptimal(candidates, cards.length);
  const bestMelds = candidates.filter((_, i) => best[i]);
  const deadwood = computeDeadwood(cards, bestMelds);
  const deadwoodPoints = deadwood.reduce((s, c) => s + CARD_POINTS[c.rank], 0);
  return {
    melds: bestMelds,
    deadwood,
    deadwoodPoints,
    isGin: deadwood.length === 0,
    canKnock: deadwoodPoints <= 10,
  };
}

interface Candidate {
  cards: Card[];
  mask: number;
  weight: number;
}

function enumerateCandidates(cards: Card[]): Candidate[] {
  const n = cards.length;
  const byRank = new Map<number, Card[]>();
  const bySuit = new Map<string, Card[]>();
  const idToIdx = new Map<string, number>();
  cards.forEach((c, i) => {
    idToIdx.set(c.id, i);
    const rankList = byRank.get(c.rank) || [];
    rankList.push(c);
    byRank.set(c.rank, rankList);
    const suitKey = c.suit;
    const suitList = bySuit.get(suitKey) || [];
    suitList.push(c);
    bySuit.set(suitKey, suitList);
  });

  const candidates: Candidate[] = [];

  for (const [_, group] of byRank) {
    if (group.length >= 3) {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          for (let k = j + 1; k < group.length; k++) {
            const meldCards = [group[i], group[j], group[k]];
            const mask = meldCards.reduce((m, c) => m | (1 << idToIdx.get(c.id)!), 0);
            const weight = meldCards.reduce((s, c) => s + CARD_POINTS[c.rank], 0);
            candidates.push({ cards: meldCards, mask, weight });
          }
        }
      }
      if (group.length === 4) {
        const allFour = [...group];
        const mask = allFour.reduce((m, c) => m | (1 << idToIdx.get(c.id)!), 0);
        const weight = allFour.reduce((s, c) => s + CARD_POINTS[c.rank], 0);
        candidates.push({ cards: allFour, mask, weight });
      }
    }
  }

  for (const [_, suitCards] of bySuit) {
    const sorted = [...suitCards].sort((a, b) => a.rank - b.rank);
    for (let start = 0; start < sorted.length; start++) {
      for (let end = start + 2; end < sorted.length; end++) {
        const slice = sorted.slice(start, end + 1);
        if (isConsecutiveRun(slice)) {
          const mask = slice.reduce((m, c) => m | (1 << idToIdx.get(c.id)!), 0);
          const weight = slice.reduce((s, c) => s + CARD_POINTS[c.rank], 0);
          candidates.push({ cards: slice, mask, weight });
        }
      }
    }
  }

  candidates.sort((a, b) => b.weight - a.weight);
  return candidates;
}

function isConsecutiveRun(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  const suit = cards[0].suit;
  for (let i = 1; i < cards.length; i++) {
    if (cards[i].suit !== suit) return false;
    if (cards[i].rank !== cards[i - 1].rank + 1) return false;
  }
  return true;
}

function solveOptimal(candidates: Candidate[], handSize: number): boolean[] {
  const n = candidates.length;
  const taken = new Array(n).fill(false);
  let bestWeight = 0;
  let bestTaken = new Array(n).fill(false);
  const fullMask = (1 << handSize) - 1;

  function backtrack(idx: number, currentMask: number, currentWeight: number) {
    if (currentWeight > bestWeight) {
      bestWeight = currentWeight;
      bestTaken = [...taken];
    }
    for (let i = idx; i < n; i++) {
      if (!(candidates[i].mask & currentMask)) {
        taken[i] = true;
        backtrack(i + 1, currentMask | candidates[i].mask, currentWeight + candidates[i].weight);
        taken[i] = false;
      }
    }
  }

  backtrack(0, 0, 0);
  return bestTaken;
}

function computeDeadwood(allCards: Card[], melds: Meld[]): Card[] {
  const inMeld = new Set<string>();
  for (const m of melds) {
    for (const c of m.cards) {
      inMeld.add(c.id);
    }
  }
  return allCards.filter(c => !inMeld.has(c.id));
}

export function calculateDeadwood(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + CARD_POINTS[c.rank], 0);
}

export function evaluateKnock(meldResult: MeldResult, handSize = 10): {
  isValid: boolean;
  deadwoodPoints: number;
  isGin: boolean;
} {
  return {
    isValid: meldResult.canKnock || meldResult.isGin,
    deadwoodPoints: meldResult.deadwoodPoints,
    isGin: meldResult.isGin,
  };
}
