/**
 * @module game-engine/player
 * @description Player progression system.
 */

import type {
  PlayerProgress,
  PlayerTier,
  DailyQuest,
} from "./types.js";
import { TIER_THRESHOLDS } from "./types.js";

export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 10));
}

export function levelToXp(level: number): number {
  return level * level * 10;
}

export function xpForNextLevel(currentXp: number): number {
  const currentLevel = xpToLevel(currentXp);
  return levelToXp(currentLevel + 1);
}

export function levelProgress(xp: number): number {
  const currentLevel = xpToLevel(xp);
  const currentThreshold = levelToXp(currentLevel);
  const nextThreshold = levelToXp(currentLevel + 1);
  const range = nextThreshold - currentThreshold;
  if (range <= 0) return 0;
  return (xp - currentThreshold) / range;
}

export function xpToTier(xp: number): PlayerTier {
  const tiers: PlayerTier[] = ["sequoia", "oak", "sapling", "sprout", "seedling"];
  for (const tier of tiers) {
    if (xp >= TIER_THRESHOLDS[tier]) return tier;
  }
  return "seedling";
}

export function checkTierPromotion(
  oldXp: number,
  newXp: number
): { promoted: boolean; from: PlayerTier; to: PlayerTier } {
  const from = xpToTier(oldXp);
  const to = xpToTier(newXp);
  return { promoted: from !== to, from, to };
}

export function updateStreak(
  lastBuildDate: string,
  currentStreak: number,
  longestStreak: number,
  today: string
): { streak: number; longest: number; isNew: boolean } {
  if (!lastBuildDate || lastBuildDate.trim() === "") {
    const newStreak = 1;
    const newLongest = Math.max(longestStreak, newStreak);
    return { streak: newStreak, longest: newLongest, isNew: newStreak > longestStreak };
  }

  if (lastBuildDate === today) {
    return { streak: currentStreak, longest: longestStreak, isNew: false };
  }

  const lastDate = new Date(lastBuildDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000);

  let newStreak: number;
  if (diffDays === 1) {
    newStreak = currentStreak + 1;
  } else if (diffDays > 1) {
    newStreak = 1;
  } else {
    newStreak = currentStreak;
  }

  const newLongest = Math.max(longestStreak, newStreak);
  return {
    streak: newStreak,
    longest: newLongest,
    isNew: newStreak > longestStreak,
  };
}

const QUEST_TEMPLATES: readonly Omit<DailyQuest, "id" | "date" | "completed">[] = [
  {
    title: "Place 3 pieces",
    objective: { type: "place_pieces", description: "Place 3 pieces", target: 3, current: 0 },
    rewardXp: 15, rewardLove: 2,
  },
  {
    title: "Build something rigid",
    objective: { type: "achieve_coherence", description: "Build a rigid structure", target: 1.0, current: 0 },
    rewardXp: 20, rewardLove: 3,
  },
  {
    title: "Place 5 pieces",
    objective: { type: "place_pieces", description: "Place 5 pieces", target: 5, current: 0 },
    rewardXp: 25, rewardLove: 3,
  },
  {
    title: "Earn 10 LOVE",
    objective: { type: "earn_love", description: "Earn 10 LOVE today", target: 10, current: 0 },
    rewardXp: 20, rewardLove: 5,
  },
  {
    title: "Connect with a peer",
    objective: { type: "form_bond", description: "Form or strengthen a bond", target: 1, current: 0 },
    rewardXp: 30, rewardLove: 5,
  },
  {
    title: "Place a tetrahedron",
    objective: { type: "place_pieces", description: "Place a tetrahedron", target: 1, current: 0 },
    rewardXp: 10, rewardLove: 1,
  },
  {
    title: "Build streak: keep going!",
    objective: { type: "custom", description: "Build something today", target: 1, current: 0 },
    rewardXp: 15, rewardLove: 2,
  },
];

function dateHash(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = ((hash << 5) - hash + date.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function generateDailyQuests(date: string): DailyQuest[] {
  const hash = dateHash(date);
  const indices = new Set<number>();

  let seed = hash;
  while (indices.size < 3) {
    indices.add(seed % QUEST_TEMPLATES.length);
    seed = ((seed * 1103515245) + 12345) | 0;
    seed = Math.abs(seed);
  }

  return Array.from(indices).map((idx, i) => {
    const template = QUEST_TEMPLATES[idx];
    return {
      ...template,
      id: `quest_${date}_${i}`,
      date,
      completed: false,
      objective: { ...template.objective, current: 0 },
    };
  });
}

export function isQuestComplete(quest: DailyQuest): boolean {
  return quest.objective.current >= quest.objective.target;
}

export function createPlayer(nodeId: string, displayName: string): PlayerProgress {
  const today = new Date().toISOString().split("T")[0];
  return {
    nodeId,
    displayName,
    tier: "seedling",
    xp: 0,
    level: 0,
    completedChallenges: [],
    badges: [],
    buildStreak: 0,
    longestStreak: 0,
    lastBuildDate: "",
    structureIds: [],
    totalPiecesPlaced: 0,
    dailyQuests: generateDailyQuests(today),
    createdAt: new Date().toISOString(),
  };
}

export function addXp(
  player: PlayerProgress,
  amount: number,
): { player: PlayerProgress; leveledUp: boolean; tierPromoted: boolean; newTier: PlayerTier } {
  const newXp = player.xp + amount;
  const newLevel = xpToLevel(newXp);
  const tierCheck = checkTierPromotion(player.xp, newXp);

  return {
    player: {
      ...player,
      xp: newXp,
      level: newLevel,
      tier: tierCheck.to,
    },
    leveledUp: newLevel > player.level,
    tierPromoted: tierCheck.promoted,
    newTier: tierCheck.to,
  };
}
