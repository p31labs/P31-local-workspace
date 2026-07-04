import { Card, Suit, isOppositeColor } from '../core/types.ts';

export interface PileState {
  cards: Card[];
  faceUpCount: number;
}

export interface KlondikeState {
  tableau: PileState[];
  foundations: PileState[];
  stock: Card[];
  waste: Card[];
  moves: number;
  score: number;
}

export function isValidTableauMove(
  card: Card,
  targetPile: PileState,
): boolean {
  const top = getTopCard(targetPile);
  if (!top) {
    return card.rank === 13;
  }
  return (
    card.rank === top.rank - 1 &&
    isOppositeColor(card.suit, top.suit)
  );
}

export function isValidFoundationMove(
  card: Card,
  targetPile: PileState,
): boolean {
  const top = getTopCard(targetPile);
  if (!top) {
    return card.rank === 1;
  }
  return (
    card.suit === top.suit &&
    card.rank === top.rank + 1
  );
}

export function getTopCard(pile: PileState): Card | undefined {
  for (let i = pile.cards.length - 1; i >= 0; i--) {
    if (pile.cards[i].faceUp) {
      return pile.cards[i];
    }
  }
  return undefined;
}

export function isKlondikeWon(state: KlondikeState): boolean {
  return (
    state.foundations.every(p => p.cards.length === 13) &&
    state.tableau.every(p => p.cards.length === 0) &&
    state.stock.length === 0 &&
    state.waste.length === 0
  );
}

export function createKlondikeState(): KlondikeState {
  return {
    tableau: Array.from({ length: 7 }, () => ({ cards: [], faceUpCount: 0 })),
    foundations: Array.from({ length: 4 }, () => ({ cards: [], faceUpCount: 0 })),
    stock: [],
    waste: [],
    moves: 0,
    score: 0,
  };
}
