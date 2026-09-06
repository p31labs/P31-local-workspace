import { describe, it, expect } from "vitest";
import {
  LOVE_AMOUNTS,
  DEFAULT_VESTING_SCHEDULE,
  FOUNDING_NODES,
  DEFAULT_LEDGER_CONFIG,
} from "../src/types.js";
import type {
  TransactionType,
  LoveTransaction,
  LoveWallet,
  FoundingNode,
  VestingMilestone,
  LedgerConfig,
  LedgerSnapshot,
} from "../src/types.js";

describe("LOVE_AMOUNTS", () => {
  it("has all 10 transaction types", () => {
    const keys = Object.keys(LOVE_AMOUNTS);
    expect(keys).toHaveLength(10);
  });

  it("TETRAHEDRON_BOND costs 15 LOVE", () => {
    expect(LOVE_AMOUNTS.TETRAHEDRON_BOND).toBe(15);
  });

  it("MILESTONE_REACHED costs 25 LOVE", () => {
    expect(LOVE_AMOUNTS.MILESTONE_REACHED).toBe(25);
  });

  it("ARTIFACT_CREATED costs 10 LOVE", () => {
    expect(LOVE_AMOUNTS.ARTIFACT_CREATED).toBe(10);
  });

  it("COHERENCE_GIFT costs 5 LOVE", () => {
    expect(LOVE_AMOUNTS.COHERENCE_GIFT).toBe(5);
  });

  it("CARE_RECEIVED costs 3 LOVE", () => {
    expect(LOVE_AMOUNTS.CARE_RECEIVED).toBe(3);
  });

  it("CARE_GIVEN costs 2 LOVE", () => {
    expect(LOVE_AMOUNTS.CARE_GIVEN).toBe(2);
  });

  it("VOLTAGE_CALMED costs 2 LOVE", () => {
    expect(LOVE_AMOUNTS.VOLTAGE_CALMED).toBe(2);
  });

  it("BLOCK_PLACED costs 1 LOVE", () => {
    expect(LOVE_AMOUNTS.BLOCK_PLACED).toBe(1);
  });

  it("PING costs 1 LOVE", () => {
    expect(LOVE_AMOUNTS.PING).toBe(1);
  });

  it("DONATION is 0 (variable amount)", () => {
    expect(LOVE_AMOUNTS.DONATION).toBe(0);
  });

  it("all amounts are non-negative", () => {
    for (const [, val] of Object.entries(LOVE_AMOUNTS)) {
      expect(val).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("DEFAULT_VESTING_SCHEDULE", () => {
  it("has 5 milestones", () => {
    expect(DEFAULT_VESTING_SCHEDULE).toHaveLength(5);
  });

  it("milestones are in ascending age order", () => {
    for (let i = 1; i < DEFAULT_VESTING_SCHEDULE.length; i++) {
      expect(DEFAULT_VESTING_SCHEDULE[i]!.ageYears)
        .toBeGreaterThan(DEFAULT_VESTING_SCHEDULE[i - 1]!.ageYears);
    }
  });

  it("cumulative percent is monotonically increasing", () => {
    for (let i = 1; i < DEFAULT_VESTING_SCHEDULE.length; i++) {
      expect(DEFAULT_VESTING_SCHEDULE[i]!.cumulativePercent)
        .toBeGreaterThan(DEFAULT_VESTING_SCHEDULE[i - 1]!.cumulativePercent);
    }
  });

  it("ends at 100%", () => {
    expect(DEFAULT_VESTING_SCHEDULE[DEFAULT_VESTING_SCHEDULE.length - 1]!.cumulativePercent).toBe(100);
  });

  it("starts at age 13", () => {
    expect(DEFAULT_VESTING_SCHEDULE[0]!.ageYears).toBe(13);
  });
});

describe("FOUNDING_NODES", () => {
  it("has exactly 2 founding nodes", () => {
    expect(FOUNDING_NODES).toHaveLength(2);
  });

  it("uses initials, not full names for legal docs", () => {
    for (const node of FOUNDING_NODES) {
      expect(node.initials).toMatch(/^[A-Z]\.[A-Z]\.$/);
    }
  });

  it("each node has a valid birth year", () => {
    for (const node of FOUNDING_NODES) {
      expect(typeof node.birthYear).toBe("number");
      expect(node.birthYear).toBeGreaterThan(2000);
      expect(node.birthYear).toBeLessThan(2030);
    }
  });
});

describe("DEFAULT_LEDGER_CONFIG", () => {
  it("split ratio is 50/50", () => {
    expect(DEFAULT_LEDGER_CONFIG.splitRatio).toBe(0.5);
  });

  it("minimum care score is 0.1", () => {
    expect(DEFAULT_LEDGER_CONFIG.minimumCareScore).toBe(0.1);
  });

  it("coherence gift threshold is 0.65", () => {
    expect(DEFAULT_LEDGER_CONFIG.coherenceGiftThreshold).toBe(0.65);
  });

  it("voltage calm threshold is 0.3", () => {
    expect(DEFAULT_LEDGER_CONFIG.voltageCalmThreshold).toBe(0.3);
  });
});

describe("type shapes", () => {
  it("LoveTransaction interface is structurally valid", () => {
    const tx: LoveTransaction = {
      id: 1,
      type: "PING",
      amount: 1.0,
      owner: "node-abc",
      trigger: "PEER_DISCOVERED",
      timestamp: new Date().toISOString(),
    };
    expect(tx.id).toBe(1);
    expect(tx.counterparty).toBeUndefined();
    expect(tx.meta).toBeUndefined();
  });

  it("LoveWallet interface is structurally valid", () => {
    const w: LoveWallet = {
      totalEarned: 100,
      sovereigntyPool: 50,
      performancePool: 50,
      careScore: 0.8,
      availableBalance: 40,
      frozenBalance: 10,
      transactionCount: 5,
      lastActivity: new Date().toISOString(),
    };
    expect(w.totalEarned).toBe(w.sovereigntyPool + w.performancePool);
  });

  it("LedgerSnapshot version is 1", () => {
    const snap: LedgerSnapshot = {
      version: 1,
      owner: "node-abc",
      transactions: [],
      wallet: {
        totalEarned: 0, sovereigntyPool: 0, performancePool: 0,
        careScore: 0.5, availableBalance: 0, frozenBalance: 0,
        transactionCount: 0, lastActivity: new Date(0).toISOString(),
      },
      snapshotAt: new Date().toISOString(),
    };
    expect(snap.version).toBe(1);
  });
});
