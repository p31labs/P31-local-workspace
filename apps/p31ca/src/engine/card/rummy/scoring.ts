import { Card } from '../core/types.ts';
import { CARD_POINTS } from '../core/types.ts';

export interface RummyScore {
  deadwoodPoints: number;
  ginBonus: number;
  undercutBonus: number;
  total: number;
}

export function scoreRound(
  knockerDeadwood: number,
  opponentDeadwood: number,
  isGin: boolean,
): RummyScore {
  let ginBonus = 0;
  let undercutBonus = 0;

  if (isGin) {
    ginBonus = 25;
  }

  if (!isGin && opponentDeadwood <= knockerDeadwood) {
    undercutBonus = 25 + (knockerDeadwood - opponentDeadwood);
    return {
      deadwoodPoints: opponentDeadwood - knockerDeadwood,
      ginBonus: 0,
      undercutBonus: Math.abs(undercutBonus),
      total: Math.abs(undercutBonus),
    };
  }

  const diff = isGin
    ? opponentDeadwood + ginBonus
    : opponentDeadwood - knockerDeadwood;

  return {
    deadwoodPoints: Math.abs(diff),
    ginBonus: isGin ? ginBonus : 0,
    undercutBonus: 0,
    total: Math.abs(diff),
  };
}

export function calculateDeadwood(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + CARD_POINTS[c.rank], 0);
}

export const MAX_HAND_SIZE = 10;
export const KNOCK_THRESHOLD = 10;
