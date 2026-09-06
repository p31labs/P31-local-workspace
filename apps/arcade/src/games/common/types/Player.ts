export type TraitId =
  | 'focused'
  | 'energetic'
  | 'creative'
  | 'resilient'
  | 'strategic'
  | 'calm'
  | 'bold'
  | 'patient'
  | 'quick'
  | 'steady'
  | 'playful'
  | 'intense'
  | 'clever'
  | 'supportive'
  | 'determined'
  | 'perceptive'
  | 'adaptable'
  | 'daring'
  | 'methodical'
  | 'spirited';

export interface Trait {
  id: TraitId;
  name: string;
  description: string;
  effect: string;
  icon: string;
}

export interface BaseballStats {
  hitting: number;
  power: number;
  speed: number;
  fielding: number;
  pitching: number;
}

export interface FootballStats {
  throwing: number;
  catching: number;
  speed: number;
  blocking: number;
  tackling: number;
}

export interface TacticalStats {
  attack: number;
  defense: number;
  movement: number;
  tactics: number;
  leadership: number;
}

export type GameStats = BaseballStats & Partial<FootballStats> & Partial<TacticalStats>;

export interface PlayerCharacter {
  id: string;
  name: string;
  avatar: string;
  age: number;
  bio: string;
  spoon: number;
  traits: Trait[];
  stats: BaseballStats;
  footballStats?: FootballStats;
  tacticalStats?: TacticalStats;
  level: number;
  xp: number;
  unlockedAt: string;
}

export const TRAIT_DEFINITIONS: Record<TraitId, Trait> = {
  focused:   { id: 'focused',   name: 'Focused',   description: 'Locks in under pressure',         effect: 'Pitching +15% when spoon <= 2',       icon: '🎯' },
  energetic: { id: 'energetic', name: 'Energetic', description: 'Always moving, high stamina',      effect: 'Speed +10% in late innings',           icon: '⚡' },
  creative:  { id: 'creative',  name: 'Creative',  description: 'Thinks outside the box',           effect: '15% chance to turn a hit into a double', icon: '🎨' },
  resilient: { id: 'resilient', name: 'Resilient', description: 'Bounces back from setbacks',       effect: 'Fielding +10% after an error',         icon: '🛡️' },
  strategic: { id: 'strategic', name: 'Strategic', description: 'Sees the whole field',             effect: 'Base running +15% with runners on',    icon: '♟️' },
  calm:      { id: 'calm',      name: 'Calm',      description: 'Steady under pressure',            effect: 'Hitting +10% in clutch situations',    icon: '🧘' },
  bold:      { id: 'bold',      name: 'Bold',      description: 'Takes big swings',                 effect: 'Power +20%, contact -5%',              icon: '💥' },
  patient:   { id: 'patient',   name: 'Patient',   description: 'Waits for the right pitch',        effect: '10% fewer strikeouts',                 icon: '⏳' },
  quick:     { id: 'quick',     name: 'Quick',     description: 'Fast reflexes',                    effect: 'Fielding +15% on line drives',         icon: '💨' },
  steady:    { id: 'steady',    name: 'Steady',    description: 'Consistent and reliable',          effect: 'Stats fluctuate 50% less per game',    icon: '⚓' },
  playful:  { id: 'playful',   name: 'Playful',    description: 'Enjoys the game',                  effect: 'Team morale +10% when in lineup',      icon: '🎪' },
  intense:   { id: 'intense',   name: 'Intense',   description: 'Competitive fire',                 effect: 'All stats +5% in close games',         icon: '🔥' },
  clever:    { id: 'clever',    name: 'Clever',    description: 'Finds unconventional solutions',   effect: '25% chance to beat shift/defense',     icon: '🦊' },
  supportive:{ id: 'supportive',name: 'Supportive',description: 'Lifts up teammates',               effect: 'Adjacent players in order get +5% stats', icon: '💙' },
  determined:{ id: 'determined',name: 'Determined',description: 'Never gives up',                   effect: 'Stats +10% when trailing',             icon: '💪' },
  perceptive:{ id: 'perceptive',name: 'Perceptive',description: 'Reads the game well',              effect: '5% chance to predict pitch type',       icon: '👁️' },
  adaptable: { id: 'adaptable', name: 'Adaptable', description: 'Adjusts to any situation',         effect: 'Negates one opposing trait per game',  icon: '🦎' },
  daring:    { id: 'daring',    name: 'Daring',    description: 'Risk-taker',                       effect: '25% chance of extra base on hit',      icon: '🚀' },
  methodical:{ id: 'methodical',name: 'Methodical',description: 'Systematic approach',              effect: 'Training XP +15%',                     icon: '📋' },
  spirited: { id: 'spirited',  name: 'Spirited',   description: 'Infectious energy',               effect: 'Team gains +2% all stats when playing', icon: '✨' },
};

export function statBase(spoon: number): number {
  return 40 + spoon * 8 + Math.floor(Math.random() * 15);
}

export function xpToLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

export function xpForLevel(level: number): number {
  return level * level * 50;
}
