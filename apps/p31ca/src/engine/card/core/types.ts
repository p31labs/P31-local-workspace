export enum Suit {
  Clubs = 'C',
  Diamonds = 'D',
  Hearts = 'H',
  Spades = 'S',
}

export interface Card {
  readonly id: string;
  readonly rank: number;
  readonly suit: Suit;
  readonly faceUp: boolean;
}

export type CardId = `${Suit}-${number}`;

export const CARD_POINTS: Record<number, number> = {
  1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
  10: 10, 11: 10, 12: 10, 13: 10,
};

export function pointsValue(rank: number): number {
  return CARD_POINTS[rank] ?? rank;
}

export function isFaceCard(rank: number): boolean {
  return rank >= 11;
}

export function cardColor(suit: Suit): 'red' | 'black' {
  return suit === Suit.Diamonds || suit === Suit.Hearts ? 'red' : 'black';
}

export function isOppositeColor(a: Suit, b: Suit): boolean {
  return cardColor(a) !== cardColor(b);
}

export function makeCardId(suit: Suit, rank: number): CardId {
  return `${suit}-${rank}` as CardId;
}

const SUIT_ICONS: Record<Suit, string> = {
  [Suit.Clubs]: '♣',
  [Suit.Diamonds]: '♦',
  [Suit.Hearts]: '♥',
  [Suit.Spades]: '♠',
};

const RANK_LABELS: Record<number, string> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

export function cardLabel(rank: number): string {
  return RANK_LABELS[rank] ?? String(rank);
}

export function suitIcon(suit: Suit): string {
  return SUIT_ICONS[suit];
}
