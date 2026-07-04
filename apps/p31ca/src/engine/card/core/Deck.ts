import { Card, CardId, Suit, makeCardId } from './types.ts';
import { Rng } from '../rng/mulberry32.ts';

const STANDARD_DECK: Card[] = (() => {
  const deck: Card[] = [];
  for (const suit of [Suit.Clubs, Suit.Diamonds, Suit.Hearts, Suit.Spades]) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: makeCardId(suit, rank),
        rank,
        suit,
        faceUp: false,
      });
    }
  }
  return deck;
})();

export interface DeckSnapshot {
  readonly drawPile: CardId[];
  readonly discardPile: CardId[];
  readonly dealt: CardId[];
}

export class Deck {
  private _drawPile: Card[];
  private _discardPile: Card[];
  private _dealt: Card[];

  private constructor(
    drawPile: Card[],
    discardPile: Card[] = [],
    dealt: Card[] = [],
  ) {
    this._drawPile = drawPile;
    this._discardPile = discardPile;
    this._dealt = dealt;
  }

  static new(rng?: Rng): Deck {
    const base = STANDARD_DECK.map(c => ({ ...c, faceUp: false }));
    return new Deck(rng ? seededShuffle(base, rng) : fisherYatesShuffle(base));
  }

  static newDouble(rng?: Rng): Deck {
    const base = [...STANDARD_DECK, ...STANDARD_DECK].map(c => ({ ...c, faceUp: false }));
    return new Deck(rng ? seededShuffle(base, rng) : fisherYatesShuffle(base));
  }

  static fromSnapshot(snapshot: DeckSnapshot, store: Map<CardId, Card>): Deck {
    const draw = snapshot.drawPile.map(id => store.get(id)!).filter(Boolean);
    const discard = snapshot.discardPile.map(id => store.get(id)!).filter(Boolean);
    const dealt = snapshot.dealt.map(id => store.get(id)!).filter(Boolean);
    return new Deck(draw, discard, dealt);
  }

  drawPile(): readonly Card[] { return this._drawPile; }
  discardPile(): readonly Card[] { return this._discardPile; }
  dealt(): readonly Card[] { return this._dealt; }

  remaining(): number { return this._drawPile.length; }
  discardCount(): number { return this._discardPile.length; }

  draw(faceUp = false): Card | undefined {
    const card = this._drawPile.pop();
    if (!card) return undefined;
    card.faceUp = faceUp;
    this._dealt.push(card);
    return card;
  }

  peekDraw(): Card | undefined {
    return this._drawPile[this._drawPile.length - 1];
  }

  discard(card: Card): void {
    card.faceUp = true;
    this._discardPile.push(card);
  }

  drawDiscard(): Card | undefined {
    return this._discardPile.pop();
  }

  peekDiscard(): Card | undefined {
    return this._discardPile[this._discardPile.length - 1];
  }

  deal(count: number, faceUp = false): Card[] {
    const hand: Card[] = [];
    for (let i = 0; i < count; i++) {
      const card = this.draw(faceUp);
      if (!card) break;
      hand.push(card);
    }
    return hand;
  }

  clone(): Deck {
    return new Deck(
      this._drawPile.map(c => ({ ...c })),
      this._discardPile.map(c => ({ ...c })),
      this._dealt.map(c => ({ ...c })),
    );
  }

  toSnapshot(): DeckSnapshot {
    return {
      drawPile: this._drawPile.map(c => c.id as CardId).reverse(),
      discardPile: this._discardPile.map(c => c.id as CardId),
      dealt: this._dealt.map(c => c.id as CardId),
    };
  }
}

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function seededShuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
