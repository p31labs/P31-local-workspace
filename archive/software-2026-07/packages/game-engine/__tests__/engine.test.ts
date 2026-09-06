import { describe, it, expect, vi, beforeEach } from "vitest";
import { GameEngine } from "../src/engine.js";
import { vec3 } from "../src/geometry.js";

describe("GameEngine", () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine("node-test", {
      domeName: "Test Dome",
      domeColor: "#4ade80",
      today: "2026-02-21",
    });
  });

  describe("construction", () => {
    it("has player with nodeId and displayName", () => {
      expect(engine.player.nodeId).toBe("node-test");
      expect(engine.player.displayName).toBe("Test Dome");
    });

    it("starts with seedling tier", () => {
      expect(engine.player.tier).toBe("seedling");
      expect(engine.player.xp).toBe(0);
      expect(engine.player.level).toBe(0);
    });

    it("has genesis dome as first structure", () => {
      expect(engine.structures).toHaveLength(1);
      expect(engine.dome.pieces).toHaveLength(1);
      expect(engine.dome.pieces[0]?.type).toBe("tetrahedron");
    });

    it("totalPiecesPlaced starts at 1", () => {
      expect(engine.player.totalPiecesPlaced).toBe(1);
    });

    it("has 3 daily quests", () => {
      expect(engine.player.dailyQuests).toHaveLength(3);
    });
  });

  describe("place", () => {
    it("places piece and emits PIECE_PLACED", () => {
      const spy = vi.fn();
      engine.on("PIECE_PLACED", spy);

      const piece = engine.place(engine.dome.id, "tetrahedron", vec3(2, 0, 0));

      expect(piece).not.toBeNull();
      expect(engine.dome.pieces).toHaveLength(2);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0].piece.type).toBe("tetrahedron");
    });

    it("returns null for unknown structureId", () => {
      expect(engine.place("unknown-id", "tetrahedron", vec3(0, 0, 0))).toBeNull();
    });

    it("increments totalPiecesPlaced", () => {
      engine.place(engine.dome.id, "tetrahedron", vec3(1, 0, 0));
      expect(engine.player.totalPiecesPlaced).toBe(2);
    });

    it("calls ledger blockPlaced when adapter provided", () => {
      const ledger = {
        blockPlaced: vi.fn(),
        challengeComplete: vi.fn(),
      };
      const eng = new GameEngine("n", {
        domeName: "D",
        domeColor: "#fff",
        ledger,
        today: "2026-02-21",
      });
      eng.place(eng.dome.id, "tetrahedron", vec3(1, 0, 0));
      expect(ledger.blockPlaced).toHaveBeenCalledTimes(1);
    });
  });

  describe("undo", () => {
    it("removes last piece", () => {
      engine.place(engine.dome.id, "tetrahedron", vec3(1, 0, 0));
      const removed = engine.undo(engine.dome.id);
      expect(removed).not.toBeNull();
      expect(engine.dome.pieces).toHaveLength(1);
    });

    it("returns null for unknown structureId", () => {
      expect(engine.undo("unknown")).toBeNull();
    });
  });

  describe("newStructure", () => {
    it("adds new structure", () => {
      const s = engine.newStructure("Second", "#ff0000");
      expect(engine.structures).toHaveLength(2);
      expect(s.name).toBe("Second");
      expect(engine.player.structureIds).toContain(s.id);
    });
  });

  describe("challenges", () => {
    it("startChallenge sets active challenge", () => {
      const ok = engine.startChallenge("genesis_resonance");
      expect(ok).toBe(true);
      expect(engine.activeChallenge?.id).toBe("genesis_resonance");
    });

    it("startChallenge returns false for unmet prereq", () => {
      const ok = engine.startChallenge("geodesic_dome");
      expect(ok).toBe(false);
    });

    it("completeActiveChallenge awards and clears", () => {
      engine.startChallenge("genesis_resonance");
      const completed = engine.completeActiveChallenge();
      expect(completed).toBe(true);
      expect(engine.activeChallenge).toBeNull();
      expect(engine.player.completedChallenges).toContain("genesis_resonance");
      expect(engine.player.xp).toBeGreaterThan(0);
    });

    it("completeActiveChallenge calls ledger challengeComplete", () => {
      const ledger = {
        blockPlaced: vi.fn(),
        challengeComplete: vi.fn(),
      };
      const eng = new GameEngine("n", {
        domeName: "D",
        domeColor: "#fff",
        ledger,
        today: "2026-02-21",
      });
      eng.startChallenge("genesis_resonance");
      eng.completeActiveChallenge();
      expect(ledger.challengeComplete).toHaveBeenCalledWith("genesis_resonance", 25);
    });
  });

  describe("bondFormed", () => {
    it("calls without throwing", () => {
      expect(() => engine.bondFormed("peer-1")).not.toThrow();
    });
  });

  describe("export / import", () => {
    it("export returns snapshot with version 1", () => {
      const snap = engine.export();
      expect(snap.version).toBe(1);
      expect(snap.player.nodeId).toBe("node-test");
      expect(snap.structures).toHaveLength(1);
    });

    it("import restores state", () => {
      engine.place(engine.dome.id, "tetrahedron", vec3(1, 0, 0));
      const snap = engine.export();

      const eng2 = new GameEngine("other", { domeName: "Other", domeColor: "#fff", today: "2026-02-21" });
      eng2.import(snap);
      expect(eng2.player.nodeId).toBe("node-test");
      expect(eng2.structures).toHaveLength(1);
      expect(eng2.dome.pieces).toHaveLength(2);
    });

    it("import throws on wrong version", () => {
      const snap = engine.export();
      const bad = { ...snap, version: 99 } as typeof snap;
      expect(() => engine.import(bad)).toThrow("Unsupported");
    });
  });

  describe("availableChallenges", () => {
    it("new player has genesis_resonance available", () => {
      const avail = engine.availableChallenges;
      expect(avail.length).toBeGreaterThanOrEqual(1);
      expect(avail[0]?.id).toBe("genesis_resonance");
    });
  });

  describe("loveEarned", () => {
    it("calls without throwing", () => {
      expect(() => engine.loveEarned(10)).not.toThrow();
    });
  });

  describe("events", () => {
    it("emits XP_EARNED on place", () => {
      const spy = vi.fn();
      engine.on("XP_EARNED", spy);
      engine.place(engine.dome.id, "tetrahedron", vec3(1, 0, 0));
      expect(spy).toHaveBeenCalled();
    });

    it("emits LEVEL_UP when xp crosses level boundary", () => {
      const spy = vi.fn();
      engine.on("LEVEL_UP", spy);
      for (let i = 0; i < 3; i++) {
        engine.place(engine.dome.id, "tetrahedron", vec3(1 + i, 0, 0));
      }
      expect(spy).toHaveBeenCalled();
    });

    it("emits CHALLENGE_COMPLETE when challenge completed", () => {
      const spy = vi.fn();
      engine.on("CHALLENGE_COMPLETE", spy);
      engine.startChallenge("genesis_resonance");
      engine.completeActiveChallenge();
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        rewardLove: 25,
        rewardXp: 50,
      }));
    });
  });
});
