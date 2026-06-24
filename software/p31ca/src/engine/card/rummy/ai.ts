import { Card, CARD_POINTS, isFaceCard } from '../core/types.ts';
import { Meld } from './meldDetection.ts';

export interface DiscardScore {
  card: Card;
  risk: number;
}

export function chooseDiscard(hand: Card[], deadwood: Card[], knownCards: Set<string>): Card {
  if (deadwood.length === 0) {
    return hand[hand.length - 1];
  }

  const scored: DiscardScore[] = deadwood.map(card => {
    let risk = 0;

    risk += CARD_POINTS[card.rank] * 0.15;

    if (isLikelyRunExtension(card, hand)) {
      risk += 0.35;
    }

    const sameRankInHand = hand.filter(c => c.rank === card.rank && c.id !== card.id);
    if (sameRankInHand.length === 0) {
      risk -= 0.2;
    }

    if (!knownCards.has(card.id) && card.rank >= 7) {
      risk += 0.15;
    }

    return { card, risk: Math.max(0, Math.min(1, risk)) };
  });

  scored.sort((a, b) => a.risk - b.risk || CARD_POINTS[b.card.rank] - CARD_POINTS[a.card.rank]);
  return scored[0].card;
}

function isLikelyRunExtension(card: Card, hand: Card[]): boolean {
  const adjacent = hand.filter(
    c => c.suit === card.suit && Math.abs(c.rank - card.rank) === 1,
  );
  return adjacent.length >= 1;
}

export function canLayOff(card: Card, meld: Meld): boolean {
  if (meld.type === 'set') {
    return card.rank === meld.cards[0].rank &&
      !meld.cards.some(c => c.suit === card.suit);
  }

  const sorted = [...meld.cards].sort((a, b) => a.rank - b.rank);
  const low = sorted[0].rank;
  const high = sorted[sorted.length - 1].rank;
  const suit = sorted[0].suit;

  return (
    card.suit === suit &&
    (card.rank === low - 1 || card.rank === high + 1)
  );
}

export function maximiseLayoffs(
  defenderDeadwood: Card[],
  knockerMelds: Meld[],
): { laidOff: Card[]; remaining: Card[] } {
  const sorted = [...defenderDeadwood].sort((a, b) => CARD_POINTS[b.rank] - CARD_POINTS[a.rank]);
  const laidOff: Card[] = [];
  const remaining: Card[] = [];

  for (const card of sorted) {
    let found = false;
    for (const meld of knockerMelds) {
      if (canLayOff(card, meld)) {
        laidOff.push(card);
        found = true;
        break;
      }
    }
    if (!found) remaining.push(card);
  }

  return { laidOff, remaining };
}
