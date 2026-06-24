import { Card } from '../core/types.ts';
import {
  KlondikeState,
  PileState,
  isValidFoundationMove,
  getTopCard,
} from './validator.ts';

export function canAutoComplete(state: KlondikeState): boolean {
  if (state.stock.length > 0) return false;
  if (state.waste.length > 0) return false;

  for (const pile of state.tableau) {
    for (const card of pile.cards) {
      if (!card.faceUp) return false;
    }
  }

  return canMoveAnyToFoundation(state);
}

function canMoveAnyToFoundation(state: KlondikeState): boolean {
  for (const pile of state.tableau) {
    const top = getTopCard(pile);
    if (!top) continue;
    for (const foundation of state.foundations) {
      if (isValidFoundationMove(top, foundation)) {
        return true;
      }
    }
  }
  return false;
}

export function runAutoComplete(state: KlondikeState): KlondikeState {
  let current = { ...state };
  let moved = true;

  while (moved) {
    moved = false;

    for (let t = 0; t < current.tableau.length && !moved; t++) {
      const top = getTopCard(current.tableau[t]);
      if (!top) continue;

      for (let f = 0; f < current.foundations.length; f++) {
        if (isValidFoundationMove(top, current.foundations[f])) {
          const card = current.tableau[t].cards.pop()!;
          current.foundations[f] = {
            ...current.foundations[f],
            cards: [...current.foundations[f].cards, card],
          };
          current.score += 10;
          current.moves++;
          moved = true;
          break;
        }
      }
    }
  }

  return current;
}

export function dealFromStock(state: KlondikeState, drawCount: number = 1): KlondikeState {
  if (state.stock.length === 0) {
    const waste = [...state.waste];
    waste.reverse().forEach(c => { c.faceUp = false; });
    return {
      ...state,
      stock: waste,
      waste: [],
      moves: state.moves + 1,
      score: Math.max(0, state.score - 100),
    };
  }

  const drawn: Card[] = [];
  for (let i = 0; i < drawCount && state.stock.length > 0; i++) {
    const card = state.stock.pop()!;
    card.faceUp = true;
    drawn.push(card);
  }

  return {
    ...state,
    waste: [...state.waste, ...drawn],
    moves: state.moves + 1,
  };
}
