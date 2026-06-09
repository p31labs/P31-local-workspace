import { describe, it, expect } from "vitest";
import {
  createStandardDeck,
  createShuffledDeck,
  cardId,
  shuffleInPlace,
} from "../lib/quantum-deck-local";

describe("quantum-deck-local (@p31/quantum-deck parity)", () => {
  it("creates 52 cards in stable order", () => {
    const d = createStandardDeck();
    expect(d).toHaveLength(52);
    expect(d[0]).toMatchObject({ suit: "C", rank: "A", id: "AC" });
    expect(d[51]).toMatchObject({ suit: "S", rank: "K", id: "KS" });
  });

  it("cardId matches deck ids", () => {
    expect(cardId("H", "10")).toBe("10H");
  });

  it("shuffle permutes without losing cards", () => {
    const a = createStandardDeck();
    const idsBefore = new Set(a.map((c) => c.id));
    shuffleInPlace(a);
    const idsAfter = new Set(a.map((c) => c.id));
    expect(idsAfter).toEqual(idsBefore);
    expect(a).toHaveLength(52);
  });

  it("createShuffledDeck returns 52 unique ids", () => {
    const d = createShuffledDeck();
    expect(new Set(d.map((c) => c.id)).size).toBe(52);
  });
});
