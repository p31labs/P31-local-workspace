// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Badge System: Kids-aged progress tracking with emoji badges
//
// Phase 4: Avatar System
// Badges are separate from achievements - they're visual
// progress markers for kids ages 6-8 with emoji icons.
// ═══════════════════════════════════════════════════════

import type { ElementSymbol } from '../types';

// ── Badge Definitions ──

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji for kids
  /** Criteria type and threshold */
  criteria: BadgeCriteria;
  /** Love reward when earned */
  love: number;
  /** Badge tier: bronze/silver/gold */
  tier?: 'bronze' | 'silver' | 'gold';
}

/** Badge unlock criteria */
export type BadgeCriteria =
  | { type: 'bonds_total'; count: number }
  | { type: 'molecules_total'; count: number }
  | { type: 'unique_molecules'; count: number }
  | { type: 'formula'; formula: string }
  | { type: 'family_play_sessions'; count: number }
  | { type: 'session_minutes'; count: number }
  | { type: 'element_used'; element: ElementSymbol; count: number };

/** Progress state for a single badge */
export interface BadgeProgress {
  badgeId: string;
  current: number;
  target: number;
  earned: boolean;
  earnedAt?: string;
}

/** User's complete badge collection */
export interface BadgeCollection {
  badges: Map<string, BadgeProgress>;
  totalBonds: number;
  totalMolecules: number;
  uniqueMolecules: Set<string>;
  familyPlaySessions: number;
  totalPlayMinutes: number;
  lastUpdated: string;
}

// ── Badge Definitions ──

export const BADGES: Badge[] = [
  // ── Bond Count Badges ──
  {
    id: 'atom_collector',
    name: 'Atom Collector',
    description: 'Make 10 bonds!',
    icon: '🔗',
    criteria: { type: 'bonds_total', count: 10 },
    love: 10,
    tier: 'bronze',
  },
  {
    id: 'molecule_builder',
    name: 'Molecule Builder',
    description: 'Make 50 bonds!',
    icon: '🧱',
    criteria: { type: 'bonds_total', count: 50 },
    love: 25,
    tier: 'silver',
  },
  {
    id: 'chemistry_star',
    name: 'Chemistry Star',
    description: 'Make 100 bonds!',
    icon: '⭐',
    criteria: { type: 'bonds_total', count: 100 },
    love: 50,
    tier: 'silver',
  },
  {
    id: 'molecular_master',
    name: 'Molecular Master',
    description: 'Make 500 bonds!',
    icon: '👑',
    criteria: { type: 'bonds_total', count: 500 },
    love: 100,
    tier: 'gold',
  },

  // ── Molecule Completion Badges ──
  {
    id: 'first_water',
    name: 'First Water',
    description: 'Build H₂O - you are mostly water!',
    icon: '💧',
    criteria: { type: 'formula', formula: 'H₂O' },
    love: 15,
    tier: 'bronze',
  },
  {
    id: 'carbon_friend',
    name: 'Carbon Friend',
    description: 'Build CH₄ - methane gas!',
    icon: '🌍',
    criteria: { type: 'formula', formula: 'CH₄' },
    love: 15,
    tier: 'bronze',
  },
  {
    id: 'salt_maker',
    name: 'Salt Maker',
    description: 'Build NaCl - table salt!',
    icon: '🧂',
    criteria: { type: 'formula', formula: 'NaCl' },
    love: 20,
    tier: 'bronze',
  },
  {
    id: 'breath_maker',
    name: 'Breath Maker',
    description: 'Build CO₂ - what you breathe out!',
    icon: '💨',
    criteria: { type: 'formula', formula: 'CO₂' },
    love: 20,
    tier: 'bronze',
  },

  // ── Unique Molecule Discovery ──
  {
    id: 'explorer',
    name: 'Explorer',
    description: 'Discover 5 different molecules!',
    icon: '🔍',
    criteria: { type: 'unique_molecules', count: 5 },
    love: 25,
    tier: 'bronze',
  },
  {
    id: 'scientist',
    name: 'Scientist',
    description: 'Discover 15 different molecules!',
    icon: '🔬',
    criteria: { type: 'unique_molecules', count: 15 },
    love: 50,
    tier: 'silver',
  },
  {
    id: 'professor',
    name: 'Professor',
    description: 'Discover 30 different molecules!',
    icon: '🎓',
    criteria: { type: 'unique_molecules', count: 30 },
    love: 100,
    tier: 'gold',
  },

  // ── Family Play Badges ──
  {
    id: 'family_champion',
    name: 'Family Champion',
    description: 'Play 5 times with family!',
    icon: '👨‍👩‍👧‍👦',
    criteria: { type: 'family_play_sessions', count: 5 },
    love: 30,
    tier: 'silver',
  },
  {
    id: 'team_player',
    name: 'Team Player',
    description: 'Play 15 times with family!',
    icon: '🏆',
    criteria: { type: 'family_play_sessions', count: 15 },
    love: 75,
    tier: 'gold',
  },

  // ── Time-based Badges ──
  {
    id: 'dedicated',
    name: 'Dedicated',
    description: 'Play for 30 minutes total!',
    icon: '⏰',
    criteria: { type: 'session_minutes', count: 30 },
    love: 25,
    tier: 'bronze',
  },
  {
    id: 'champion',
    name: 'Champion',
    description: 'Play for 60 minutes total!',
    icon: '🏅',
    criteria: { type: 'session_minutes', count: 60 },
    love: 50,
    tier: 'silver',
  },
  {
    id: 'legend',
    name: 'Legend',
    description: 'Play for 180 minutes total!',
    icon: '🌟',
    criteria: { type: 'session_minutes', count: 180 },
    love: 100,
    tier: 'gold',
  },
];

// ── Level/Titles System ──

export interface LevelInfo {
  level: number;
  title: string;
  icon: string;
  requiredBonds: number;
}

// Ordered from lowest to highest
export const LEVELS: LevelInfo[] = [
  { level: 1, title: 'Seed', icon: '🌱', requiredBonds: 0 },
  { level: 2, title: 'Sprout', icon: '🌿', requiredBonds: 10 },
  { level: 3, title: 'Sapling', icon: '🌳', requiredBonds: 50 },
  { level: 4, title: 'Tree', icon: '🌲', requiredBonds: 100 },
  { level: 5, title: 'Forest', icon: '🌴', requiredBonds: 250 },
  { level: 6, title: 'Atom', icon: '⚛️', requiredBonds: 500 },
  { level: 7, title: 'Molecule', icon: '🔮', requiredBonds: 750 },
  { level: 8, title: 'Star', icon: '✨', requiredBonds: 1000 },
  { level: 9, title: 'Galaxy', icon: '🌌', requiredBonds: 1500 },
  { level: 10, title: 'Universe', icon: '🪐', requiredBonds: 2000 },
];

/**
 * Get current level based on total bonds
 */
export function getLevelForBonds(bonds: number): LevelInfo {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (bonds >= level.requiredBonds) {
      currentLevel = level;
    } else {
      break;
    }
  }
  return currentLevel;
}

/**
 * Get progress to next level (0-1)
 */
export function getLevelProgress(bonds: number): number {
  const currentLevel = getLevelForBonds(bonds);
  const levelIndex = LEVELS.findIndex((l) => l.level === currentLevel.level);
  
  // Max level has no next level
  if (levelIndex >= LEVELS.length - 1) {
    return 1;
  }
  
  const currentRequired = currentLevel.requiredBonds;
  const nextRequired = LEVELS[levelIndex + 1].requiredBonds;
  const progress = (bonds - currentRequired) / (nextRequired - currentRequired);
  
  return Math.min(1, Math.max(0, progress));
}

/**
 * Get the next level (or undefined if at max)
 */
export function getNextLevel(bonds: number): LevelInfo | undefined {
  const currentLevel = getLevelForBonds(bonds);
  const levelIndex = LEVELS.findIndex((l) => l.level === currentLevel.level);
  
  if (levelIndex >= LEVELS.length - 1) {
    return undefined;
  }
  
  return LEVELS[levelIndex + 1];
}

// ── Badge Progress Functions ──

/**
 * Create initial badge collection
 */
export function createBadgeCollection(): BadgeCollection {
  const badges = new Map<string, BadgeProgress>();
  
  for (const badge of BADGES) {
    let target = 0;
    if (badge.criteria.type === 'bonds_total') {
      target = badge.criteria.count;
    } else if (badge.criteria.type === 'molecules_total') {
      target = badge.criteria.count;
    } else if (badge.criteria.type === 'unique_molecules') {
      target = badge.criteria.count;
    } else if (badge.criteria.type === 'family_play_sessions') {
      target = badge.criteria.count;
    } else if (badge.criteria.type === 'session_minutes') {
      target = badge.criteria.count;
    } else if (badge.criteria.type === 'formula') {
      target = 1; // Formula badges just need 1
    } else if (badge.criteria.type === 'element_used') {
      target = badge.criteria.count;
    }
    
    badges.set(badge.id, {
      badgeId: badge.id,
      current: 0,
      target,
      earned: false,
    });
  }
  
  return {
    badges,
    totalBonds: 0,
    totalMolecules: 0,
    uniqueMolecules: new Set<string>(),
    familyPlaySessions: 0,
    totalPlayMinutes: 0,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Check and update badge progress based on current stats
 */
export function updateBadgeProgress(
  collection: BadgeCollection,
  newBonds: number,
  newMolecules: number,
  formula: string | null,
  isFamilySession: boolean,
  sessionMinutes: number,
): { updated: BadgeCollection; newlyEarned: Badge[] } {
  const updated = { ...collection };
  updated.totalBonds = newBonds;
  updated.totalMolecules = newMolecules;
  updated.totalPlayMinutes += sessionMinutes;
  updated.lastUpdated = new Date().toISOString();
  
  if (formula && !updated.uniqueMolecules.has(formula)) {
    updated.uniqueMolecules.add(formula);
  }
  
  if (isFamilySession) {
    updated.familyPlaySessions += 1;
  }
  
  const newlyEarned: Badge[] = [];
  const newBadges = new Map(updated.badges);
  
  for (const badge of BADGES) {
    const progress = newBadges.get(badge.id)!;
    if (progress.earned) continue;
    
    let current = 0;
    let shouldEarn = false;
    
    switch (badge.criteria.type) {
      case 'bonds_total':
        current = updated.totalBonds;
        shouldEarn = current >= badge.criteria.count;
        break;
      case 'molecules_total':
        current = updated.totalMolecules;
        shouldEarn = current >= badge.criteria.count;
        break;
      case 'unique_molecules':
        current = updated.uniqueMolecules.size;
        shouldEarn = current >= badge.criteria.count;
        break;
      case 'formula':
        current = updated.uniqueMolecules.has(badge.criteria.formula) ? 1 : 0;
        shouldEarn = current >= 1;
        break;
      case 'family_play_sessions':
        current = updated.familyPlaySessions;
        shouldEarn = current >= badge.criteria.count;
        break;
      case 'session_minutes':
        current = updated.totalPlayMinutes;
        shouldEarn = current >= badge.criteria.count;
        break;
      case 'element_used':
        // This would need element tracking - skip for now
        current = 0;
        break;
    }
    
    newBadges.set(badge.id, {
      ...progress,
      current,
      earned: shouldEarn,
      earnedAt: shouldEarn ? new Date().toISOString() : undefined,
    });
    
    if (shouldEarn) {
      newlyEarned.push(badge);
    }
  }
  
  updated.badges = newBadges;
  
  return { updated, newlyEarned };
}

/**
 * Get earned badges count
 */
export function getEarnedBadgesCount(collection: BadgeCollection): number {
  let count = 0;
  for (const progress of collection.badges.values()) {
    if (progress.earned) count++;
  }
  return count;
}

/**
 * Get total possible badges
 */
export function getTotalBadgesCount(): number {
  return BADGES.length;
}