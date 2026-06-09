// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Freestyle Mode Engine
//
// Defines rules and scoring for the open-ended freestyle mode.
// ═══════════════════════════════════════════════════════

export interface FreestyleConfig {
  hasTarget: false;
  turnBased: false;
  elements: 'all';
  completionRule: 'manual';
  loveFormula: 'per_atom';
  achievementsEnabled: true;
  discoveryEnabled: true;
  questsEnabled: false;
  timeLimit: number | null;
}

export interface FreestyleScoring {
  basePerAtom: number;
  uniqueElementBonus: number;
  sizeBonus: number;
  symmetryBonus: number;
  discoveryBonus: number;
  stabilityMultiplier: number;
}

export interface FreestyleResult {
  atoms: number;
  uniqueElements: number;
  stability: number;
  baseLove: number;
  bonuses: Array<{ name: string; love: number }>;
  totalLove: number;
  isDiscovery: boolean;
}

export function getFreestyleConfig(timeLimit?: number): FreestyleConfig {
  return {
    hasTarget: false,
    turnBased: false,
    elements: 'all',
    completionRule: 'manual',
    loveFormula: 'per_atom',
    achievementsEnabled: true,
    discoveryEnabled: true,
    questsEnabled: false,
    timeLimit: timeLimit ?? null,
  };
}

export function getFreestyleScoring(): FreestyleScoring {
  return {
    basePerAtom: 3,
    uniqueElementBonus: 5,
    sizeBonus: 10, // Placeholder, logic is tiered
    symmetryBonus: 15,
    discoveryBonus: 25,
    stabilityMultiplier: 2.0, // Max multiplier
  };
}

export function scoreFreestyle(
  atoms: Array<{ element: string }>,
  stability: number, // 0-100
  isDiscovery: boolean
): FreestyleResult {
  const scoring = getFreestyleScoring();
  const uniqueElements = new Set(atoms.map(a => a.element)).size;

  const stabilityMult = 1 + (stability / 100);
  let baseLove = Math.round(atoms.length * scoring.basePerAtom * stabilityMult);
  
  const bonuses: FreestyleResult['bonuses'] = [];

  const elemBonus = uniqueElements * scoring.uniqueElementBonus;
  if (elemBonus > 0) bonuses.push({ name: 'Element Variety', love: elemBonus });

  if (atoms.length >= 30) bonuses.push({ name: 'Massive Molecule', love: 50 });
  else if (atoms.length >= 20) bonuses.push({ name: 'Large Molecule', love: 25 });
  else if (atoms.length >= 10) bonuses.push({ name: 'Big Molecule', love: 10 });

  if (isDiscovery) bonuses.push({ name: 'New Discovery', love: scoring.discoveryBonus });

  const totalLove = baseLove + bonuses.reduce((s, b) => s + b.love, 0);

  return {
    atoms: atoms.length,
    uniqueElements,
    stability,
    baseLove,
    bonuses,
    totalLove,
    isDiscovery,
  };
}

export function isFreestyleAvailable(mode: string): boolean {
  return mode === 'sapling';
}

export function generateChallenge(): {
  description: string;
  timeLimit: number;
  bonusCondition: string;
  bonusLove: number;
} {
  return {
    description: "Build the biggest molecule you can in 3 minutes",
    timeLimit: 180000,
    bonusCondition: "Use at least 5 different elements",
    bonusLove: 30,
  };
}
