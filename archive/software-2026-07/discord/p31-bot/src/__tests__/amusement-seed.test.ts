import { describe, it, expect } from "vitest";
import { seededIndex, utcYmd } from "../lib/amusement-seed";

describe("seededIndex", () => {
  it("is stable for same inputs", () => {
    expect(seededIndex(100, "meshword:2026-04-30")).toBe(
      seededIndex(100, "meshword:2026-04-30"),
    );
  });

  it("stays in range", () => {
    for (let i = 0; i < 50; i++) {
      const n = seededIndex(17, `x:${i}`);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(17);
    }
  });
});

describe("utcYmd", () => {
  it("matches ISO date prefix", () => {
    expect(utcYmd()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
