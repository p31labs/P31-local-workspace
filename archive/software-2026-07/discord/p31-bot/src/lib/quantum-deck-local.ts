/**
 * TypeScript port of `@p31/quantum-deck` (`packages/quantum-deck/src/deck.mjs`).
 * Same ordering + Web Crypto unbiased `randomInt` + Fisher–Yates.
 */

export type Card = { suit: string; rank: string; id: string };

export const SUITS = ["C", "D", "H", "S"] as const;
export const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;

export function cardId(suit: string, rank: string): string {
  return `${rank}${suit}`;
}

export function createStandardDeck(): Card[] {
  const out: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      out.push({ suit, rank, id: cardId(suit, rank) });
    }
  }
  return out;
}

export function cryptoRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("cryptoRandomInt: maxExclusive must be a positive integer");
  }
  const max = 0x1_0000_0000;
  const limit = max - (max % maxExclusive);
  const buf = new Uint32Array(1);
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("quantum-deck-local: Web Crypto unavailable");
  }
  do {
    c.getRandomValues(buf);
  } while (buf[0]! >= limit);
  return buf[0]! % maxExclusive;
}

export function shuffleInPlace(deck: Card[]): Card[] {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    const t = deck[i]!;
    deck[i] = deck[j]!;
    deck[j] = t;
  }
  return deck;
}

export function createShuffledDeck(): Card[] {
  const d = createStandardDeck();
  return shuffleInPlace(d);
}
