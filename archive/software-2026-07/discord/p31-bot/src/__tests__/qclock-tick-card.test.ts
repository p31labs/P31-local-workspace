import { describe, it, expect } from "vitest";
import { getQuantumClockTickCard } from "../lib/qclock-tick-card";

describe("getQuantumClockTickCard", () => {
  it("is deterministic for the same timestamp", () => {
    const t = 1_718_000_000_000;
    const a = getQuantumClockTickCard(t);
    const b = getQuantumClockTickCard(t);
    expect(a.card.id).toBe(b.card.id);
    expect(a.seed).toBe(b.seed);
  });

  it("returns a valid card id", () => {
    const x = getQuantumClockTickCard(Date.now());
    expect(x.card.id).toMatch(/^(A|2|3|4|5|6|7|8|9|10|J|Q|K)[CDHS]$/);
    expect(x.phase01).toBeGreaterThanOrEqual(0);
    expect(x.phase01).toBeLessThan(1);
  });
});
