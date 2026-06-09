// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Family Challenges Configuration
//
// Phase 4: Avatar System
// Weekly challenges for family multiplayer play
// Shared progress across family devices via relay
// ═══════════════════════════════════════════════════════

// ── Challenge Types ──

export interface FamilyChallengeConfig {
  id: string;
  name: string;
  description: string;
  shortDescription: string; // For kids
  target: number;
  unit: string;
  unitSingular: string;
  icon: string;
  /** Badge rewards for completing */
  rewards: {
    badgeIds: string[];
    sparks: number;
    love: number;
  };
  /** Duration in days */
  durationDays: 7;
  /** Difficulty multiplier for Sapling mode */
  saplingMultiplier?: number;
}

// ── Challenge Configs ──

export const FAMILY_CHALLENGES: FamilyChallengeConfig[] = [
  {
    id: 'water_world_weekly',
    name: 'Water World Week',
    description: 'Build 10 water molecules together with your family!',
    shortDescription: 'Make 10 waters! 💧',
    target: 10,
    unit: 'waters',
    unitSingular: 'water',
    icon: '💧',
    rewards: {
      badgeIds: ['first_water'],
      sparks: 50,
      love: 25,
    },
    durationDays: 7,
    saplingMultiplier: 1.5,
  },
  {
    id: 'discovery_weekly',
    name: 'Discovery Week',
    description: 'Create 5 unique molecules together as a family!',
    shortDescription: 'Find 5 new molecules! 🔍',
    target: 5,
    unit: 'molecules',
    unitSingular: 'molecule',
    icon: '🔍',
    rewards: {
      badgeIds: ['explorer'],
      sparks: 75,
      love: 30,
    },
    durationDays: 7,
  },
  {
    id: 'family_time_weekly',
    name: 'Family Time Week',
    description: 'Play together for 30 minutes total this week!',
    shortDescription: 'Play 30 minutes! ⏰',
    target: 30,
    unit: 'minutes',
    unitSingular: 'minute',
    icon: '⏰',
    rewards: {
      badgeIds: ['family_champion'],
      sparks: 100,
      love: 50,
    },
    durationDays: 7,
  },
  {
    id: 'bond_builders_weekly',
    name: 'Bond Builders Week',
    description: 'Make 25 bonds together as a family team!',
    shortDescription: 'Make 25 bonds! 🔗',
    target: 25,
    unit: 'bonds',
    unitSingular: 'bond',
    icon: '🔗',
    rewards: {
      badgeIds: ['molecule_builder'],
      sparks: 50,
      love: 25,
    },
    durationDays: 7,
    saplingMultiplier: 2,
  },
  {
    id: 'salt_seekers_weekly',
    name: 'Salt Seekers Week',
    description: 'Build 5 salt molecules together!',
    shortDescription: 'Make 5 salts! 🧂',
    target: 5,
    unit: 'salts',
    unitSingular: 'salt',
    icon: '🧂',
    rewards: {
      badgeIds: ['salt_maker'],
      sparks: 40,
      love: 20,
    },
    durationDays: 7,
  },
  {
    id: 'carbon_creators_weekly',
    name: 'Carbon Creators Week',
    description: 'Build 3 methane molecules together!',
    shortDescription: 'Make 3 methanes! 🌍',
    target: 3,
    unit: 'methanes',
    unitSingular: 'methane',
    icon: '🌍',
    rewards: {
      badgeIds: ['carbon_friend'],
      sparks: 40,
      love: 20,
    },
    durationDays: 7,
  },
];

// ── Challenge State ──

export interface FamilyChallengeState {
  /** Currently active challenge ID */
  activeChallengeId: string | null;
  /** Current progress value */
  currentProgress: number;
  /** Target value */
  targetValue: number;
  /** When the challenge started */
  startedAt: string | null;
  /** When it expires */
  expiresAt: string | null;
  /** Whether completed */
  completed: boolean;
  /** Participants who contributed */
  participants: number;
}

// ── Helper Functions ──

/**
 * Get the current active challenge for this week
 */
export function getCurrentWeekChallenge(): FamilyChallengeConfig | null {
  // For now, rotate through challenges based on week number
  const now = new Date();
  const weekNumber = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 
    (7 * 24 * 60 * 60 * 1000)
  );
  
  const index = weekNumber % FAMILY_CHALLENGES.length;
  return FAMILY_CHALLENGES[index];
}

/**
 * Get challenge by ID
 */
export function getChallengeById(id: string): FamilyChallengeConfig | undefined {
  return FAMILY_CHALLENGES.find(c => c.id === id);
}

/**
 * Calculate progress percentage (0-1)
 */
export function calculateProgress(state: FamilyChallengeState): number {
  if (!state.targetValue) return 0;
  return Math.min(1, state.currentProgress / state.targetValue);
}

/**
 * Format progress for display
 */
export function formatProgress(state: FamilyChallengeState): string {
  const remaining = Math.max(0, state.targetValue - state.currentProgress);
  if (remaining === 0) return '🎉 Complete!';
  return `${state.currentProgress}/${state.targetValue}`;
}

/**
 * Check if challenge has expired
 */
export function isChallengeExpired(state: FamilyChallengeState): boolean {
  if (!state.expiresAt) return false;
  return new Date(state.expiresAt) < new Date();
}

/**
 * Get time remaining until expiry
 */
export function getTimeRemaining(state: FamilyChallengeState): string {
  if (!state.expiresAt) return 'No deadline';
  
  const now = new Date();
  const expires = new Date(state.expiresAt);
  const diff = expires.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expired';
  
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  if (days > 0) return `${days}d ${hours}h left`;
  return `${hours}h left`;
}

// ── Multiplayer Sync ──

/**
 * Shared challenge state keys for relay sync
 */
export const CHALLENGE_KEYS = {
  PROGRESS: 'family_challenge_progress',
  PARTICIPANTS: 'family_challenge_participants',
  COMPLETED: 'family_challenge_completed',
} as const;

/**
 * Payload for syncing challenge progress across devices
 */
export interface FamilyChallengeSyncPayload {
  challengeId: string;
  progress: number;
  participantCount: number;
  timestamp: string;
}

/**
 * Create initial challenge state
 */
export function createChallengeState(challenge: FamilyChallengeConfig): FamilyChallengeState {
  const now = new Date();
  const expires = new Date(now.getTime() + challenge.durationDays * 24 * 60 * 60 * 1000);
  
  return {
    activeChallengeId: challenge.id,
    currentProgress: 0,
    targetValue: challenge.target,
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    completed: false,
    participants: 0,
  };
}

export default FAMILY_CHALLENGES;