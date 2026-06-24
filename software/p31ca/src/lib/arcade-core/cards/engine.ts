export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type CardColor = 'red' | 'black';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  color: CardColor;
  faceUp: boolean;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

export function getCardColor(suit: Suit): CardColor {
  return (suit === 'hearts' || suit === 'diamonds') ? 'red' : 'black';
}

/** Generate a standard 52-card deck */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank: rank as Rank,
        color: getCardColor(suit),
        faceUp: false
      });
    }
  }
  return deck;
}

/** Pure Function: Fisher-Yates Shuffle with Mulberry32 */
export function shuffle(deck: Card[], rngSeed?: number): Card[] {
  const shuffled = [...deck];
  let seed = rngSeed ?? Math.floor(Math.random() * 2147483647);
  
  // Mulberry32 RNG
  const random = () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor((rngSeed ? random() : Math.random()) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Solitaire Rule: Can we place the source card onto the target card in the tableau? */
export function isValidKlondikeTableauMove(source: Card, target: Card | null): boolean {
  if (!target) return source.rank === 13; // Only Kings on empty spaces
  return source.color !== target.color && source.rank === target.rank - 1;
}

/** Solitaire Rule: Can we place the card on the foundation pile? */
export function isValidKlondikeFoundationMove(source: Card, target: Card | null): boolean {
  if (!target) return source.rank === 1; // Only Aces on empty foundations
  return source.suit === target.suit && source.rank === target.rank + 1;
}

/** Rummy Math: Calculate Deadwood (unmatched cards) score */
export function calculateDeadwood(hand: Card[]): number {
  return hand.reduce((total, card) => {
    return total + (card.rank > 10 ? 10 : card.rank);
  }, 0);
}

/** Rummy Math: Basic meld detection (detecting 3+ of a kind) */
export function detectSets(hand: Card[]): Card[][] {
  const rankMap: Record<number, Card[]> = {};
  hand.forEach(c => {
    if (!rankMap[c.rank]) rankMap[c.rank] = [];
    rankMap[c.rank].push(c);
  });
  
  return Object.values(rankMap).filter(group => group.length >= 3);
}
