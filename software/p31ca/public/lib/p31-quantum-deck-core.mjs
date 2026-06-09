/**
 * @p31/quantum-deck — pure deck primitives for the P31 card suite.
 * RNG: globalThis.crypto.getRandomValues (Web Crypto). Suitable for Node 20+ and browsers.
 */

/** @typedef {{ suit: string, rank: string, id: string }} Card */

export const SUITS = /** @type {const} */ (["C", "D", "H", "S"]);
export const RANKS = /** @type {const} */ ([
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
]);

/**
 * @param {string} suit
 * @param {string} rank
 * @returns {string}
 */
export function cardId(suit, rank) {
  return `${rank}${suit}`;
}

/** @returns {Card[]} 52 cards, deterministic order (clubs … spades, A … K) */
export function createStandardDeck() {
  /** @type {Card[]} */
  const out = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      out.push({ suit, rank, id: cardId(suit, rank) });
    }
  }
  return out;
}

/**
 * Unbiased integer in [0, maxExclusive) via rejection to reduce modulo bias (52-card scale).
 * @param {number} maxExclusive
 * @returns {number}
 */
export function randomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError("randomInt: maxExclusive must be a positive integer");
  }
  const max = 0x1_0000_0000;
  const limit = max - (max % maxExclusive);
  const buf = new Uint32Array(1);
  const c = globalThis.crypto;
  if (!c || typeof c.getRandomValues !== "function") {
    throw new Error("quantum-deck: Web Crypto unavailable (need globalThis.crypto.getRandomValues)");
  }
  do {
    c.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % maxExclusive;
}

/**
 * In-place Fisher–Yates shuffle.
 * @param {Card[]} deck
 * @returns {Card[]}
 */
export function shuffleInPlace(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const t = deck[i];
    deck[i] = deck[j];
    deck[j] = t;
  }
  return deck;
}

/**
 * @returns {Card[]} fresh shuffled deck (mutates a copy)
 */
export function createShuffledDeck() {
  const d = createStandardDeck();
  return shuffleInPlace(d);
}
