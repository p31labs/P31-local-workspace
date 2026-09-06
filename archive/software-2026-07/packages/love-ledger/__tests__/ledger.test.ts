import { describe, it, expect, vi, beforeEach } from "vitest";
import { LedgerEngine } from "../src/ledger.js";
import { LOVE_AMOUNTS } from "../src/types.js";
import type { LoveTransaction, LedgerSnapshot } from "../src/types.js";

const OWNER = "node-test-001";

describe("LedgerEngine", () => {
  let ledger: LedgerEngine;

  beforeEach(() => {
    ledger = new LedgerEngine(OWNER);
  });

  describe("construction", () => {
    it("has correct owner", () => {
      expect(ledger.owner).toBe(OWNER);
    });

    it("starts with empty transaction log", () => {
      expect(ledger.transactions).toHaveLength(0);
    });

    it("initial wallet is zeroed", () => {
      const w = ledger.wallet;
      expect(w.totalEarned).toBe(0);
      expect(w.transactionCount).toBe(0);
    });

    it("initial care score is 0.5", () => {
      expect(ledger.wallet.careScore).toBe(0.5);
    });
  });

  describe("direct event mapping", () => {
    it("BOND_FORMED → 15 LOVE TETRAHEDRON_BOND", () => {
      const tx = ledger.ingest("BOND_FORMED", { peerId: "peer-a" });
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe("TETRAHEDRON_BOND");
      expect(tx!.amount).toBe(15);
      expect(tx!.counterparty).toBe("peer-a");
    });

    it("VAULT_LAYER_CREATED → 10 LOVE ARTIFACT_CREATED", () => {
      const tx = ledger.ingest("VAULT_LAYER_CREATED", {});
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe("ARTIFACT_CREATED");
      expect(tx!.amount).toBe(10);
    });

    it("REMOTE_STATE_RECEIVED → 3 LOVE CARE_RECEIVED", () => {
      const tx = ledger.ingest("REMOTE_STATE_RECEIVED", { peerId: "peer-b" });
      expect(tx!.type).toBe("CARE_RECEIVED");
      expect(tx!.amount).toBe(3);
    });

    it("TRANSMIT_COMPLETE → 2 LOVE CARE_GIVEN", () => {
      const tx = ledger.ingest("TRANSMIT_COMPLETE", {});
      expect(tx!.type).toBe("CARE_GIVEN");
      expect(tx!.amount).toBe(2);
    });

    it("PEER_DISCOVERED → 1 LOVE PING", () => {
      const tx = ledger.ingest("PEER_DISCOVERED", {});
      expect(tx!.type).toBe("PING");
      expect(tx!.amount).toBe(1);
    });

    it("unknown events return null", () => {
      expect(ledger.ingest("GARBAGE_EVENT", {})).toBeNull();
    });
  });

  describe("threshold events — COHERENCE_CHANGED", () => {
    it("fires COHERENCE_GIFT on upward threshold crossing", () => {
      ledger.ingest("COHERENCE_CHANGED", { qValue: 0.3 }); // below
      const tx = ledger.ingest("COHERENCE_CHANGED", { qValue: 0.7 }); // above
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe("COHERENCE_GIFT");
      expect(tx!.amount).toBe(5);
    });

    it("does not fire when staying above threshold", () => {
      ledger.ingest("COHERENCE_CHANGED", { qValue: 0.3 }); // below → sets _coherenceAbove = false
      ledger.ingest("COHERENCE_CHANGED", { qValue: 0.7 }); // crosses up → fires
      const tx = ledger.ingest("COHERENCE_CHANGED", { qValue: 0.8 }); // still above
      expect(tx).toBeNull();
    });

    it("does not fire on downward crossing", () => {
      ledger.ingest("COHERENCE_CHANGED", { qValue: 0.3 });
      ledger.ingest("COHERENCE_CHANGED", { qValue: 0.7 }); // fires
      ledger.ingest("COHERENCE_CHANGED", { qValue: 0.3 }); // drops
      // immediate re-cross shouldn't fire due to debounce
    });
  });

  describe("threshold events — STATE_CHANGED (voltage)", () => {
    it("fires VOLTAGE_CALMED on downward threshold crossing", () => {
      // High voltage state: u=0.8, v=0.8, c=0.8, q=0.2
      ledger.ingest("STATE_CHANGED", {
        state: { urgency: 0.8, valence: 0.8, cognitive: 0.8, coherence: 0.2 }
      });
      // Low voltage state: u=0, v=0, c=0, q=1.0
      const tx = ledger.ingest("STATE_CHANGED", {
        state: { urgency: 0, valence: 0, cognitive: 0, coherence: 1.0 }
      });
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe("VOLTAGE_CALMED");
      expect(tx!.amount).toBe(2);
    });

    it("does not fire when staying calm", () => {
      ledger.ingest("STATE_CHANGED", {
        state: { urgency: 0.8, valence: 0.8, cognitive: 0.8, coherence: 0.2 }
      });
      ledger.ingest("STATE_CHANGED", {
        state: { urgency: 0, valence: 0, cognitive: 0, coherence: 1.0 }
      });
      const tx2 = ledger.ingest("STATE_CHANGED", {
        state: { urgency: 0, valence: 0, cognitive: 0, coherence: 1.0 }
      });
      expect(tx2).toBeNull();
    });
  });

  describe("threshold events — BOND_TRUST_CHANGED", () => {
    it("fires MILESTONE_REACHED on promotion", () => {
      const tx = ledger.ingest("BOND_TRUST_CHANGED", {
        previousTier: "STRUT",
        currentTier: "COHERENT",
        peerId: "peer-x",
      });
      expect(tx).not.toBeNull();
      expect(tx!.type).toBe("MILESTONE_REACHED");
      expect(tx!.amount).toBe(25);
      expect(tx!.counterparty).toBe("peer-x");
    });

    it("does not fire on demotion", () => {
      const tx = ledger.ingest("BOND_TRUST_CHANGED", {
        previousTier: "COHERENT",
        currentTier: "STRUT",
      });
      expect(tx).toBeNull();
    });

    it("does not fire when tier stays the same", () => {
      const tx = ledger.ingest("BOND_TRUST_CHANGED", {
        previousTier: "COHERENT",
        currentTier: "COHERENT",
      });
      expect(tx).toBeNull();
    });

    it("fires for multi-tier jump", () => {
      const tx = ledger.ingest("BOND_TRUST_CHANGED", {
        previousTier: "GHOST",
        currentTier: "RESONANT",
        peerId: "peer-z",
      });
      expect(tx).not.toBeNull();
      expect(tx!.amount).toBe(25);
    });
  });

  describe("CARE_SCORE_UPDATED → pool rebalance", () => {
    it("updates care score and emits POOL_REBALANCED", () => {
      const spy = vi.fn();
      ledger.on("POOL_REBALANCED", spy);
      ledger.ingest("BOND_FORMED", { peerId: "peer-a" }); // earn some LOVE first
      ledger.ingest("CARE_SCORE_UPDATED", { score: 0.9 });
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        careScore: 0.9,
      }));
    });

    it("does not emit when score change is negligible", () => {
      const spy = vi.fn();
      ledger.on("POOL_REBALANCED", spy);
      ledger.ingest("CARE_SCORE_UPDATED", { score: 0.5 }); // same as initial
      expect(spy).not.toHaveBeenCalled();
    });

    it("returns null (no transaction)", () => {
      const tx = ledger.ingest("CARE_SCORE_UPDATED", { score: 0.9 });
      expect(tx).toBeNull();
    });
  });

  describe("donate()", () => {
    it("records a donation with variable amount", () => {
      const tx = ledger.donate(500, { source: "HCB" });
      expect(tx.type).toBe("DONATION");
      expect(tx.amount).toBe(500);
      expect(tx.meta?.source).toBe("HCB");
    });

    it("donation shows in wallet", () => {
      ledger.donate(100);
      expect(ledger.wallet.totalEarned).toBe(100);
    });
  });

  describe("blockPlaced()", () => {
    it("records a BLOCK_PLACED transaction", () => {
      const tx = ledger.blockPlaced({ blockType: "carbon" });
      expect(tx.type).toBe("BLOCK_PLACED");
      expect(tx.amount).toBe(1);
    });
  });

  describe("wallet integration", () => {
    it("accumulates LOVE across multiple events", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });    // 15
      ledger.ingest("PEER_DISCOVERED", {});                // 1
      ledger.ingest("VAULT_LAYER_CREATED", {});            // 10
      expect(ledger.wallet.totalEarned).toBe(26);
      expect(ledger.wallet.transactionCount).toBe(3);
    });

    it("sovereignty pool is always half of total earned", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      ledger.donate(100);
      expect(ledger.wallet.sovereigntyPool).toBe(57.5); // (15 + 100) / 2
    });
  });

  describe("events", () => {
    it("emits LOVE_EARNED on every transaction", () => {
      const spy = vi.fn();
      ledger.on("LOVE_EARNED", spy);
      ledger.ingest("PEER_DISCOVERED", {});
      ledger.donate(10);
      ledger.blockPlaced();
      expect(spy).toHaveBeenCalledTimes(3);
    });

    it("off() removes listener", () => {
      const spy = vi.fn();
      ledger.on("LOVE_EARNED", spy);
      ledger.off("LOVE_EARNED", spy);
      ledger.ingest("PEER_DISCOVERED", {});
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("export / import", () => {
    it("exports a valid snapshot", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      ledger.donate(50);
      const snap = ledger.export();
      expect(snap.version).toBe(1);
      expect(snap.owner).toBe(OWNER);
      expect(snap.transactions).toHaveLength(2);
      expect(snap.wallet.totalEarned).toBe(65);
    });

    it("import restores state", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      ledger.donate(50);
      const snap = ledger.export();

      const fresh = new LedgerEngine(OWNER);
      fresh.import(snap);
      expect(fresh.transactions).toHaveLength(2);
      expect(fresh.wallet.totalEarned).toBe(65);
    });

    it("import emits LEDGER_RESTORED", () => {
      ledger.donate(100);
      const snap = ledger.export();

      const fresh = new LedgerEngine(OWNER);
      const spy = vi.fn();
      fresh.on("LEDGER_RESTORED", spy);
      fresh.import(snap);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        transactionCount: 1,
        totalEarned: 100,
      }));
    });

    it("import rejects wrong owner", () => {
      const snap = ledger.export();
      const other = new LedgerEngine("different-node");
      expect(() => other.import(snap)).toThrow("does not match");
    });

    it("import rejects unknown version", () => {
      const snap = ledger.export();
      const hacked = { ...snap, version: 99 } as any;
      expect(() => ledger.import(hacked)).toThrow("Unsupported");
    });

    it("new transactions after import get correct IDs", () => {
      ledger.donate(10);
      ledger.donate(20);
      const snap = ledger.export();

      const fresh = new LedgerEngine(OWNER);
      fresh.import(snap);
      const tx = fresh.donate(30);
      expect(tx.id).toBe(3);
    });
  });

  describe("careRatio and bondStrength", () => {
    it("careRatio reflects care transactions", () => {
      ledger.ingest("REMOTE_STATE_RECEIVED", { peerId: "p1" }); // 3 LOVE
      ledger.ingest("TRANSMIT_COMPLETE", {}); // 2 LOVE
      ledger.ingest("PEER_DISCOVERED", {}); // 1 LOVE
      // careRatio = 5 / 6
      expect(ledger.careRatio).toBeCloseTo(5 / 6);
    });

    it("bondStrength tracks peer-specific interactions", () => {
      ledger.ingest("BOND_FORMED", { peerId: "peer-a" });   // 15
      ledger.ingest("TRANSMIT_COMPLETE", { peerId: "peer-a" }); // 2
      ledger.ingest("PEER_DISCOVERED", {});                  // 1
      // bond with peer-a = 17/18
      expect(ledger.bondStrength("peer-a")).toBeCloseTo(17 / 18);
    });
  });

  describe("vesting", () => {
    it("returns vesting status for founding nodes", () => {
      ledger.donate(1000);
      const v = ledger.vesting;
      expect(v).toHaveLength(2);
      expect(v[0]!.node.initials).toBe("S.J.");
      expect(v[1]!.node.initials).toBe("W.J.");
    });

    it("sovereignty pool is split between founding nodes", () => {
      ledger.donate(1000);
      const sov = ledger.wallet.sovereigntyPool; // 500
      const v = ledger.vesting;
      // Each node gets half the sovereignty pool
      expect(v[0]!.vestedAmount + v[0]!.lockedAmount).toBe(sov / 2);
    });
  });

  describe("transaction IDs", () => {
    it("IDs are monotonically increasing", () => {
      const a = ledger.ingest("PEER_DISCOVERED", {})!;
      const b = ledger.ingest("PEER_DISCOVERED", {})!;
      const c = ledger.donate(10);
      expect(a.id).toBe(1);
      expect(b.id).toBe(2);
      expect(c.id).toBe(3);
    });
  });

  describe("counterparty extraction", () => {
    it("extracts peerId from top-level payload", () => {
      const tx = ledger.ingest("BOND_FORMED", { peerId: "abc" });
      expect(tx!.counterparty).toBe("abc");
    });

    it("extracts peerId from nested bond object", () => {
      const tx = ledger.ingest("BOND_FORMED", { bond: { peerId: "xyz" } });
      expect(tx!.counterparty).toBe("xyz");
    });

    it("undefined counterparty when not present", () => {
      const tx = ledger.ingest("PEER_DISCOVERED", {});
      expect(tx!.counterparty).toBeUndefined();
    });
  });

  describe("spend()", () => {
    it("deducts from availableBalance", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" }); // 15 LOVE → performancePool=7.5, at cs=0.5 → 3.75 available
      const result = ledger.spend("PANEL_UNLOCK", 3);
      expect(result).not.toBeNull();
      expect(result!.type).toBe("PANEL_UNLOCK");
      expect(result!.amount).toBe(3);
      expect(ledger.wallet.availableBalance).toBeCloseTo(0.75);
    });

    it("returns null when amount exceeds availableBalance", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" }); // 3.75 available at cs=0.5
      const result = ledger.spend("PANEL_UNLOCK", 100);
      expect(result).toBeNull();
    });

    it("returns null for zero or negative amount", () => {
      expect(ledger.spend("PANEL_UNLOCK", 0)).toBeNull();
      expect(ledger.spend("PANEL_UNLOCK", -5)).toBeNull();
    });

    it("emits LOVE_SPENT", () => {
      const spy = vi.fn();
      ledger.on("LOVE_SPENT", spy);
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      ledger.spend("PANEL_UNLOCK", 3);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: "PANEL_UNLOCK", amount: 3 }));
    });

    it("spend IDs are monotonically increasing", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      ledger.ingest("BOND_FORMED", { peerId: "p2" });
      const a = ledger.spend("PANEL_UNLOCK", 1)!;
      const b = ledger.spend("PANEL_UNLOCK", 1)!;
      expect(a.id).toBe(1);
      expect(b.id).toBe(2);
    });
  });

  describe("spend preservation across export/import", () => {
    it("exported snapshot includes spends", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      ledger.spend("PANEL_UNLOCK", 3);
      const snap = ledger.export();
      expect(snap.spends).toHaveLength(1);
      expect(snap.spends[0]!.type).toBe("PANEL_UNLOCK");
    });

    it("import restores spends — availableBalance reflects prior spending", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" }); // performancePool=7.5, at cs=0.5 → 3.75 available
      ledger.spend("PANEL_UNLOCK", 3);                 // 0.75 remaining
      const snap = ledger.export();

      const fresh = new LedgerEngine(OWNER);
      fresh.import(snap);
      expect(fresh.spends).toHaveLength(1);
      expect(fresh.wallet.availableBalance).toBeCloseTo(0.75);
    });

    it("spend IDs after import continue from restored max ID", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      ledger.spend("PANEL_UNLOCK", 1); // id=1
      ledger.spend("PANEL_UNLOCK", 1); // id=2
      const snap = ledger.export();

      const fresh = new LedgerEngine(OWNER);
      fresh.import(snap);
      // earn more to have available balance
      fresh.ingest("BOND_FORMED", { peerId: "p2" });
      const next = fresh.spend("PANEL_UNLOCK", 1)!;
      expect(next.id).toBe(3);
    });

    it("import with no prior spends starts spend IDs at 1", () => {
      ledger.ingest("BOND_FORMED", { peerId: "p1" });
      const snap = ledger.export();

      const fresh = new LedgerEngine(OWNER);
      fresh.import(snap);
      fresh.ingest("BOND_FORMED", { peerId: "p2" });
      const s = fresh.spend("PANEL_UNLOCK", 1)!;
      expect(s.id).toBe(1);
    });
  });
});
