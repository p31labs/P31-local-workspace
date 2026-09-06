import type { Challenge, PrimitiveType, PlayerTier } from './types';
import { TIER_THRESHOLDS } from './types';
import { SEED_CHALLENGES } from './challenges';

/**
 * SpoonGatedGame — adaptive difficulty wrapper.
 *
 * Adjusts game parameters based on the player's current spoon level (0-5).
 * Lower spoons → simpler mechanics, fewer options, gentler pacing.
 * Higher spoons → full complexity, all primitives, fast pacing.
 */

export interface SpoonConfig {
  spoons: number;
}

export interface GatedPrimitives {
  allowedTypes: PrimitiveType[];
  maxPieces: number;
  snapTolerance: number;
}

export interface GatedChallenge {
  challenge: Challenge;
  availableAtSpoons: number;
  recommendedFor: PlayerTier[];
}

export interface GatedGameConfig {
  primitives: GatedPrimitives;
  availableChallenges: GatedChallenge[];
  autoPauseInterval: number;
  hintFrequency: number;
  motionEnabled: boolean;
}

/**
 * Returns which primitive types are available at the given spoon level.
 * At spoons=0 (crisis), only hubs are available.
 * At spoons=5, all primitives including icosahedra are available.
 */
export function gatedPrimitives(spoons: number): GatedPrimitives {
  if (spoons <= 0) {
    return { allowedTypes: ['hub'], maxPieces: 1, snapTolerance: 0.5 };
  }
  if (spoons <= 1) {
    return { allowedTypes: ['hub', 'strut'], maxPieces: 3, snapTolerance: 0.3 };
  }
  if (spoons <= 2) {
    return { allowedTypes: ['hub', 'strut', 'tetrahedron'], maxPieces: 10, snapTolerance: 0.2 };
  }
  if (spoons <= 3) {
    return { allowedTypes: ['hub', 'strut', 'tetrahedron', 'octahedron'], maxPieces: 25, snapTolerance: 0.15 };
  }
  if (spoons <= 4) {
    return { allowedTypes: ['hub', 'strut', 'tetrahedron', 'octahedron', 'icosahedron'], maxPieces: 50, snapTolerance: 0.1 };
  }
  return { allowedTypes: ['hub', 'strut', 'tetrahedron', 'octahedron', 'icosahedron'], maxPieces: 100, snapTolerance: 0.05 };
}

/**
 * Returns challenges available at the given spoon level,
 * filtered by player tier progression.
 */
export function gatedChallenges(spoons: number, playerTier: PlayerTier): GatedChallenge[] {
  const tierWeights: Record<PlayerTier, number> = {
    seedling: 0,
    sprout: 1,
    sapling: 2,
    oak: 3,
    sequoia: 4,
  };

  return SEED_CHALLENGES
    .map((challenge): GatedChallenge => ({
      challenge,
      availableAtSpoons: Math.max(1, tierWeights[challenge.tier]),
      recommendedFor: [challenge.tier],
    }))
    .filter((gc) => spoons >= gc.availableAtSpoons)
    .sort((a, b) => {
      const aWeight = tierWeights[a.challenge.tier];
      const bWeight = tierWeights[b.challenge.tier];
      return aWeight - bWeight;
    });
}

/**
 * Returns the full gated game configuration for the given spoon level.
 */
export function gatedGameConfig(spoons: number, playerTier: PlayerTier): GatedGameConfig {
  return {
    primitives: gatedPrimitives(spoons),
    availableChallenges: gatedChallenges(spoons, playerTier),
    autoPauseInterval: spoons <= 1 ? 120_000 : spoons <= 2 ? 300_000 : 0,
    hintFrequency: spoons <= 1 ? 15_000 : spoons <= 3 ? 30_000 : 60_000,
    motionEnabled: spoons >= 2,
  };
}

/**
 * Spoon-adjusted XP multiplier. Low spoons get a bonus multiplier
 * to ensure progression is still rewarding during difficult periods.
 */
export function spoonXpMultiplier(spoons: number): number {
  if (spoons <= 0) return 3.0;
  if (spoons <= 1) return 2.0;
  if (spoons <= 2) return 1.5;
  return 1.0;
}

/**
 * Spoon-adjusted animation duration (ms).
 * At crisis (0), all animations are instant.
 * At full (5), animations play at full speed.
 */
export function spoonAnimationDuration(spoons: number, baseMs: number): number {
  if (spoons <= 0) return 0;
  if (spoons <= 1) return baseMs * 4;
  if (spoons <= 2) return baseMs * 2;
  if (spoons <= 3) return baseMs;
  return Math.floor(baseMs * 0.75);
}
