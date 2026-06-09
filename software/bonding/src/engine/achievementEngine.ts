// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Achievement engine: evaluates triggers against game state
//
// Called after every game action (atom placed, molecule
// completed, etc). Returns list of newly unlocked
// achievements with their LOVE rewards.
//
// WCD-03: This file was MISSING from the Day 2 build.
// Achievements were defined but never evaluated.
// ═══════════════════════════════════════════════════════

import { ACHIEVEMENTS, KNOWN_MOLECULES } from '../data/achievements';
import { generateFormula, countUniqueElements } from './chemistry';
import type {
  PlacedAtom,
  Achievement,
  CompletedMolecule,
} from '../types';

export interface AchievementCheckContext {
  /** Current atoms on the canvas */
  atoms: PlacedAtom[];
  /** Whether the molecule just completed this action */
  justCompleted: boolean;
  /** How long this session has been running (ms) */
  sessionElapsedMs: number;
  /** Previously unlocked achievement IDs */
  unlockedIds: Set<string>;
  /** Previously completed molecules */
  completedMolecules: CompletedMolecule[];
  /** Total pings received in current room (for social achievements) */
  pingsReceived?: number;
  /** Element symbols available in current mode palette */
  availableElements?: string[];
}

export interface AchievementResult {
  achievement: Achievement;
  unlockedAt: string;
  moleculeFormula: string;
}

/**
 * Evaluate all achievement triggers against current game state.
 * Returns array of NEWLY unlocked achievements (empty if none).
 *
 * Pure function — no side effects. Store is responsible for
 * persisting unlocks and dispatching toasts/sounds.
 */
export function evaluateAchievements(ctx: AchievementCheckContext): AchievementResult[] {
  const results: AchievementResult[] = [];
  const formula = generateFormula(ctx.atoms);
  const now = new Date().toISOString();

  for (const achievement of ACHIEVEMENTS) {
    // Skip already unlocked
    if (ctx.unlockedIds.has(achievement.id)) continue;

    let triggered = false;
    const trigger = achievement.trigger;

    switch (trigger.type) {
      case 'first_atom':
        // Triggers on first atom placement (once, then stays unlocked)
        triggered = ctx.atoms.length >= 1;
        break;

      case 'formula':
        // Triggers when molecule completes with matching formula
        if (ctx.justCompleted) {
          triggered = formula === trigger.formula;
        }
        break;

      case 'atom_count':
        // Triggers when current molecule reaches N atoms
        triggered = ctx.atoms.length >= trigger.count;
        break;

      case 'molecule_count':
        // Triggers based on total completed molecules (including this one)
        {
          const total = ctx.completedMolecules.length + (ctx.justCompleted ? 1 : 0);
          triggered = total >= trigger.count;
        }
        break;

      case 'time_under':
        // Triggers when molecule completes under N seconds
        if (ctx.justCompleted) {
          triggered = ctx.sessionElapsedMs < trigger.seconds * 1000;
        }
        break;

      case 'element_diversity':
        // Triggers when molecule uses N+ different elements
        triggered = countUniqueElements(ctx.atoms) >= trigger.count;
        break;

      case 'novel_molecule':
        // Triggers when completed formula is not in known database
        if (ctx.justCompleted && formula) {
          triggered = !KNOWN_MOLECULES.has(formula);
        }
        break;

      case 'ping_count':
        // Triggers when enough pings received in current room
        triggered = (ctx.pingsReceived ?? 0) >= trigger.count;
        break;

      case 'element_count':
        // Triggers when N+ atoms of a specific element are present
        {
          const count = ctx.atoms.filter(
            (a) => a.element === trigger.element,
          ).length;
          triggered = count >= trigger.count;
        }
        break;

      case 'full_palette':
        // Triggers when every available element is used in one molecule
        if (ctx.availableElements && ctx.availableElements.length > 0) {
          const used = new Set<string>(ctx.atoms.map((a) => a.element));
          triggered = ctx.availableElements.every((e) => used.has(e));
        }
        break;
    }

    if (triggered) {
      results.push({
        achievement,
        unlockedAt: now,
        moleculeFormula: formula,
      });
    }
  }

  return results;
}

/**
 * Calculate total LOVE earned from a set of achievement results.
 */
export function sumLoveFromAchievements(results: AchievementResult[]): number {
  return results.reduce((sum, r) => sum + r.achievement.love, 0);
}
