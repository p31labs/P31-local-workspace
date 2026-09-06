import { describe, it, expect } from "vitest";
import {
  xpToLevel,
  levelToXp,
  xpForNextLevel,
  levelProgress,
  xpToTier,
  checkTierPromotion,
  updateStreak,
  generateDailyQuests,
  isQuestComplete,
  createPlayer,
  addXp,
} from "../src/player.js";
import { TIER_THRESHOLDS } from "../src/types.js";

describe("xpToLevel", () => {
  it("0 xp -> 0", () => expect(xpToLevel(0)).toBe(0));
  it("10 xp -> 1", () => expect(xpToLevel(10)).toBe(1));
  it("40 xp -> 2", () => expect(xpToLevel(40)).toBe(2));
  it("90 xp -> 3", () => expect(xpToLevel(90)).toBe(3));
  it("1000 xp -> 10", () => expect(xpToLevel(1000)).toBe(10));
  it("negative clamped to 0", () => expect(xpToLevel(-5)).toBe(0));
});

describe("levelToXp", () => {
  it("level 0 -> 0", () => expect(levelToXp(0)).toBe(0));
  it("level 1 -> 10", () => expect(levelToXp(1)).toBe(10));
  it("level 2 -> 40", () => expect(levelToXp(2)).toBe(40));
});

describe("xpForNextLevel", () => {
  it("at 0 needs 10", () => expect(xpForNextLevel(0)).toBe(10));
  it("at 10 needs 30 for level 2", () => expect(xpForNextLevel(10)).toBe(40));
});

describe("levelProgress", () => {
  it("0 xp -> 0 progress", () => expect(levelProgress(0)).toBe(0));
  it("10 xp -> 0 progress (just leveled)", () => expect(levelProgress(10)).toBe(0));
  it("25 xp -> 0.5 progress in level 1", () => expect(levelProgress(25)).toBeCloseTo(0.5));
});

describe("xpToTier", () => {
  it("0 xp -> seedling", () => expect(xpToTier(0)).toBe("seedling"));
  it("100 xp -> sprout", () => expect(xpToTier(100)).toBe("sprout"));
  it("500 xp -> sapling", () => expect(xpToTier(500)).toBe("sapling"));
  it("2000 xp -> oak", () => expect(xpToTier(2000)).toBe("oak"));
  it("10000 xp -> sequoia", () => expect(xpToTier(10000)).toBe("sequoia"));
});

describe("checkTierPromotion", () => {
  it("no promotion when same tier", () => {
    const r = checkTierPromotion(50, 80);
    expect(r.promoted).toBe(false);
    expect(r.from).toBe("seedling");
    expect(r.to).toBe("seedling");
  });
  it("promotion seedling -> sprout", () => {
    const r = checkTierPromotion(99, 100);
    expect(r.promoted).toBe(true);
    expect(r.from).toBe("seedling");
    expect(r.to).toBe("sprout");
  });
});

describe("updateStreak", () => {
  it("first ever build (empty lastBuildDate) -> streak 1", () => {
    const r = updateStreak("", 0, 0, "2026-02-21");
    expect(r.streak).toBe(1);
    expect(r.longest).toBe(1);
    expect(r.isNew).toBe(true);
  });

  it("first ever build (whitespace) -> streak 1", () => {
    const r = updateStreak("   ", 0, 0, "2026-02-21");
    expect(r.streak).toBe(1);
  });

  it("same day no change", () => {
    const r = updateStreak("2026-02-21", 3, 5, "2026-02-21");
    expect(r.streak).toBe(3);
    expect(r.longest).toBe(5);
    expect(r.isNew).toBe(false);
  });

  it("consecutive day increments streak", () => {
    const r = updateStreak("2026-02-20", 2, 5, "2026-02-21");
    expect(r.streak).toBe(3);
    expect(r.longest).toBe(5);
  });

  it("gap day resets streak to 1", () => {
    const r = updateStreak("2026-02-18", 4, 10, "2026-02-21");
    expect(r.streak).toBe(1);
    expect(r.longest).toBe(10);
  });

  it("new record sets isNew", () => {
    const r = updateStreak("2026-02-20", 4, 4, "2026-02-21");
    expect(r.streak).toBe(5);
    expect(r.longest).toBe(5);
    expect(r.isNew).toBe(true);
  });
});

describe("generateDailyQuests", () => {
  it("returns 3 quests", () => {
    const q = generateDailyQuests("2026-02-21");
    expect(q).toHaveLength(3);
  });

  it("same date gives same quest set", () => {
    const a = generateDailyQuests("2026-02-21");
    const b = generateDailyQuests("2026-02-21");
    expect(a.map(x => x.id)).toEqual(b.map(x => x.id));
  });

  it("each quest has date and completed false", () => {
    const q = generateDailyQuests("2026-02-21");
    for (const quest of q) {
      expect(quest.date).toBe("2026-02-21");
      expect(quest.completed).toBe(false);
    }
  });
});

describe("isQuestComplete", () => {
  it("current >= target is complete", () => {
    expect(isQuestComplete({
      id: "q",
      title: "Place 3",
      objective: { type: "place_pieces", description: "Place 3", target: 3, current: 3 },
      rewardXp: 10,
      rewardLove: 1,
      date: "2026-02-21",
      completed: false,
    })).toBe(true);
  });

  it("current < target not complete", () => {
    expect(isQuestComplete({
      id: "q",
      title: "Place 3",
      objective: { type: "place_pieces", description: "Place 3", target: 3, current: 2 },
      rewardXp: 10,
      rewardLove: 1,
      date: "2026-02-21",
      completed: false,
    })).toBe(false);
  });
});

describe("createPlayer", () => {
  it("starts seedling tier 0 xp", () => {
    const p = createPlayer("node-1", "Dome");
    expect(p.nodeId).toBe("node-1");
    expect(p.displayName).toBe("Dome");
    expect(p.tier).toBe("seedling");
    expect(p.xp).toBe(0);
    expect(p.level).toBe(0);
    expect(p.buildStreak).toBe(0);
    expect(p.lastBuildDate).toBe("");
    expect(p.dailyQuests).toHaveLength(3);
  });
});

describe("addXp", () => {
  it("increases xp and level", () => {
    const p = createPlayer("n", "Dome");
    const r = addXp(p, 15);
    expect(r.player.xp).toBe(15);
    expect(r.player.level).toBe(1);
    expect(r.leveledUp).toBe(true);
  });

  it("tier promotion at boundary", () => {
    const p = createPlayer("n", "Dome");
    const r = addXp(p, 100);
    expect(r.player.tier).toBe("sprout");
    expect(r.tierPromoted).toBe(true);
  });
});
