/**
 * @module game-engine/types
 * @description Type system for the P31 geodesic building game.
 *
 * The game is a structural building environment where players construct
 * geodesic forms from primitive polyhedra. Every structure is validated
 * against Maxwell's rigidity criterion (E ≥ 3V - 6). The economy runs
 * on @p31/love-ledger. Identity and bonds come from @p31/node-zero.
 */

// ─── Geometry ───────────────────────────────────────────────────────

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type PrimitiveType =
  | "tetrahedron"
  | "octahedron"
  | "icosahedron"
  | "strut"
  | "hub";

export interface PrimitiveGeometry {
  readonly type: PrimitiveType;
  readonly vertices: number;
  readonly edges: number;
  readonly faces: number;
  readonly maxwellRatio: number;
  readonly isRigid: boolean;
  readonly connectionPoints: readonly Vec3[];
  readonly vertexPositions: readonly Vec3[];
}

export interface PlacedPiece {
  readonly id: string;
  readonly type: PrimitiveType;
  readonly position: Vec3;
  readonly rotation: Vec3;
  readonly scale: number;
  readonly connectedTo: readonly string[];
  readonly color: string;
  readonly placedAt: string;
}

// ─── Structures ─────────────────────────────────────────────────────

export interface RigidityAnalysis {
  readonly vertices: number;
  readonly edges: number;
  readonly maxwellThreshold: number;
  readonly coherence: number;
  readonly isRigid: boolean;
  readonly degreesOfFreedom: number;
  readonly isOverConstrained: boolean;
}

export interface Structure {
  readonly id: string;
  readonly name: string;
  readonly createdBy: string;
  readonly createdAt: string;
  readonly pieces: readonly PlacedPiece[];
  readonly rigidity: RigidityAnalysis;
  readonly color: string;
}

// ─── Challenges ─────────────────────────────────────────────────────

export type PlayerTier =
  | "seedling"
  | "sprout"
  | "sapling"
  | "oak"
  | "sequoia";

export const TIER_THRESHOLDS: Readonly<Record<PlayerTier, number>> = {
  seedling: 0,
  sprout: 100,
  sapling: 500,
  oak: 2000,
  sequoia: 10000,
} as const;

export type ObjectiveType =
  | "build_structure"
  | "achieve_coherence"
  | "place_pieces"
  | "form_bond"
  | "earn_love"
  | "reach_tier"
  | "custom";

export interface Objective {
  readonly type: ObjectiveType;
  readonly description: string;
  readonly target: number;
  current: number;
}

export interface Challenge {
  readonly id: string;
  readonly tier: PlayerTier;
  readonly title: string;
  readonly description: string;
  readonly objectives: Objective[];
  readonly rewardLove: number;
  readonly rewardXp: number;
  readonly rewardBadge?: string;
  readonly prerequisites: readonly string[];
  readonly fullerPrinciple: string;
  readonly realWorldExample: string;
  readonly coopRequired: boolean;
}

// ─── Player ─────────────────────────────────────────────────────────

export interface Badge {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly earnedAt: string;
}

export interface DailyQuest {
  readonly id: string;
  readonly title: string;
  readonly objective: Objective;
  readonly rewardXp: number;
  readonly rewardLove: number;
  readonly date: string;
  completed: boolean;
}

export interface PlayerProgress {
  readonly nodeId: string;
  readonly displayName: string;
  readonly tier: PlayerTier;
  readonly xp: number;
  readonly level: number;
  readonly completedChallenges: readonly string[];
  readonly badges: readonly Badge[];
  readonly buildStreak: number;
  readonly longestStreak: number;
  readonly lastBuildDate: string;
  readonly structureIds: readonly string[];
  readonly totalPiecesPlaced: number;
  readonly dailyQuests: readonly DailyQuest[];
  readonly createdAt: string;
}

// ─── Engine Events ──────────────────────────────────────────────────

export interface GameEventMap {
  "PIECE_PLACED": {
    readonly structureId: string;
    readonly piece: PlacedPiece;
    readonly rigidity: RigidityAnalysis;
  };
  "STRUCTURE_RIGID": {
    readonly structureId: string;
    readonly coherence: number;
  };
  "CHALLENGE_COMPLETE": {
    readonly challenge: Challenge;
    readonly rewardLove: number;
    readonly rewardXp: number;
  };
  "TIER_PROMOTED": {
    readonly previousTier: PlayerTier;
    readonly newTier: PlayerTier;
    readonly xp: number;
  };
  "STREAK_UPDATED": {
    readonly streak: number;
    readonly isNew: boolean;
  };
  "QUEST_COMPLETE": {
    readonly quest: DailyQuest;
  };
  "XP_EARNED": {
    readonly amount: number;
    readonly source: string;
    readonly totalXp: number;
  };
  "LEVEL_UP": {
    readonly level: number;
    readonly xp: number;
  };
}

// ─── Snapshot ───────────────────────────────────────────────────────

export interface GameSnapshot {
  readonly version: 1;
  readonly player: PlayerProgress;
  readonly structures: readonly Structure[];
  readonly activeChallenge: string | null;
  readonly snapshotAt: string;
}
