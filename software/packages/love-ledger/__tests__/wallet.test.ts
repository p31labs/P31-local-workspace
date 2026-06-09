import { describe, it, expect } from "vitest";
import { computeWallet, lovePerDay, careRatio, bondStrength } from "../src/wallet.js";
import type { LoveTransaction, LedgerConfig } from "../src/types.js";
import { DEFAULT_LEDGER_CONFIG } from "../src/types.js";

function tx(
  type: LoveTransaction["type"],
  amount: number,
  opts: Partial<LoveTransaction> = {}
): LoveTransaction {
  return {
    id: 1,
    type,
    amount,
    owner: "node-a",
    trigger: "TEST",
    timestamp: new Date().toISOString(),
    ...opts,
  };
}

describe("computeWallet", () => {
  it("empty transaction log yields zero wallet", () => {
    const w = computeWallet([], 0.5);
    expect(w.totalEarned).toBe(0);
    expect(w.sovereigntyPool).toBe(0);
    expect(w.performancePool).toBe(0);
    expect(w.availableBalance).toBe(0);
    expect(w.frozenBalance).toBe(0);
    expect(w.transactionCount).toBe(0);
  });

  it("splits earned LOVE 50/50 by default", () => {
    const txs = [tx("TETRAHEDRON_BOND", 15), tx("PING", 1)];
    const w = computeWallet(txs, 0.8);
    expect(w.totalEarned).toBe(16);
    expect(w.sovereigntyPool).toBe(8);
    expect(w.performancePool).toBe(8);
  });

  it("care score modulates performance pool", () => {
    const txs = [tx("TETRAHEDRON_BOND", 100)];
    const w = computeWallet(txs, 0.5);
    expect(w.availableBalance).toBe(25); // 50 * 0.5
    expect(w.frozenBalance).toBe(25);    // 50 - 25
  });

  it("care score = 1.0 makes full performance pool liquid", () => {
    const txs = [tx("TETRAHEDRON_BOND", 100)];
    const w = computeWallet(txs, 1.0);
    expect(w.availableBalance).toBe(50);
    expect(w.frozenBalance).toBe(0);
  });

  it("care score = 0 freezes entire performance pool", () => {
    const txs = [tx("TETRAHEDRON_BOND", 100)];
    const w = computeWallet(txs, 0);
    expect(w.availableBalance).toBe(0);
    expect(w.frozenBalance).toBe(50);
  });

  it("care score below minimum freezes performance pool", () => {
    const txs = [tx("TETRAHEDRON_BOND", 100)];
    const w = computeWallet(txs, 0.05);
    expect(w.availableBalance).toBe(0);
    expect(w.frozenBalance).toBe(50);
  });

  it("care score at minimum threshold unlocks proportionally", () => {
    const txs = [tx("TETRAHEDRON_BOND", 100)];
    const w = computeWallet(txs, 0.1);
    expect(w.availableBalance).toBe(5); // 50 * 0.1
  });

  it("clamps care score to [0, 1]", () => {
    const txs = [tx("PING", 10)];
    const over = computeWallet(txs, 1.5);
    expect(over.careScore).toBe(1);
    const under = computeWallet(txs, -0.3);
    expect(under.careScore).toBe(0);
  });

  it("custom split ratio", () => {
    const config: LedgerConfig = { ...DEFAULT_LEDGER_CONFIG, splitRatio: 0.7 };
    const txs = [tx("PING", 100)];
    const w = computeWallet(txs, 0.5, config);
    expect(w.sovereigntyPool).toBeCloseTo(70);
    expect(w.performancePool).toBeCloseTo(30);
  });

  it("tracks lastActivity from most recent transaction", () => {
    const t1 = "2026-01-01T00:00:00.000Z";
    const t2 = "2026-02-15T12:00:00.000Z";
    const txs = [
      tx("PING", 1, { timestamp: t1 }),
      tx("CARE_GIVEN", 2, { timestamp: t2 }),
    ];
    const w = computeWallet(txs, 0.5);
    expect(w.lastActivity).toBe(t2);
  });

  it("lastActivity is epoch for empty log", () => {
    const w = computeWallet([], 0.5);
    expect(new Date(w.lastActivity).getTime()).toBe(0);
  });
});

describe("lovePerDay", () => {
  it("returns 0 for empty log", () => {
    expect(lovePerDay([])).toBe(0);
  });

  it("calculates rate over default 7-day window", () => {
    const now = new Date();
    const txs = [
      tx("PING", 7, { timestamp: now.toISOString() }),
    ];
    const rate = lovePerDay(txs, 7);
    expect(rate).toBe(1); // 7 / 7
  });

  it("excludes transactions outside window", () => {
    const old = new Date(Date.now() - 30 * 86400000).toISOString();
    const recent = new Date().toISOString();
    const txs = [
      tx("PING", 100, { timestamp: old }),
      tx("PING", 14, { timestamp: recent }),
    ];
    const rate = lovePerDay(txs, 7);
    expect(rate).toBe(2); // 14 / 7
  });
});

describe("careRatio", () => {
  it("returns 0 for empty log", () => {
    expect(careRatio([])).toBe(0);
  });

  it("returns 1 when all transactions are care interactions", () => {
    const txs = [
      tx("CARE_GIVEN", 2),
      tx("CARE_RECEIVED", 3),
    ];
    expect(careRatio(txs)).toBe(1);
  });

  it("returns 0 when no care transactions", () => {
    const txs = [tx("PING", 1), tx("BLOCK_PLACED", 1)];
    expect(careRatio(txs)).toBe(0);
  });

  it("returns correct fraction for mixed log", () => {
    const txs = [
      tx("CARE_GIVEN", 2),
      tx("PING", 8),
    ];
    expect(careRatio(txs)).toBeCloseTo(0.2);
  });
});

describe("bondStrength", () => {
  it("returns 0 for empty log", () => {
    expect(bondStrength([], "peer-x")).toBe(0);
  });

  it("returns 0 when no bond-related transactions with peer", () => {
    const txs = [tx("PING", 1)];
    expect(bondStrength(txs, "peer-x")).toBe(0);
  });

  it("computes correct fraction for peer interactions", () => {
    const txs = [
      tx("TETRAHEDRON_BOND", 15, { counterparty: "peer-x" }),
      tx("PING", 15),
    ];
    expect(bondStrength(txs, "peer-x")).toBeCloseTo(0.5);
  });

  it("ignores bond transactions with other peers", () => {
    const txs = [
      tx("TETRAHEDRON_BOND", 15, { counterparty: "peer-x" }),
      tx("TETRAHEDRON_BOND", 15, { counterparty: "peer-y" }),
      tx("PING", 30),
    ];
    expect(bondStrength(txs, "peer-x")).toBeCloseTo(0.25);
  });
});
