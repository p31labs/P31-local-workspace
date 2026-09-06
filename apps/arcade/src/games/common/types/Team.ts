import type { PlayerCharacter } from './Player.js';

export type BaseballPosition = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF' | 'DH';
export type FootballPosition = 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB' | 'K';

export interface BaseballLineupSlot {
  playerId: string;
  position: BaseballPosition;
  battingOrder: number;
}

export interface FootballLineupSlot {
  playerId: string;
  position: FootballPosition;
  depth: 1 | 2;
}

export const BASEBALL_POSITIONS: BaseballPosition[] = ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'];
export const FOOTBALL_POSITIONS: FootballPosition[] = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB'];

export interface Team {
  id: string;
  name: string;
  colors: { primary: string; secondary: string };
  ownerDid: string;
  players: PlayerCharacter[];
  baseballLineup: BaseballLineupSlot[];
  footballLineup: FootballLineupSlot[];
  wins: number;
  losses: number;
  draws: number;
  season: number;
  trainingPoints: number;
  createdAt: string;
}

export interface AITeam {
  id: string;
  name: string;
  colors: { primary: string; secondary: string };
  difficulty: number;
  wins: number;
  losses: number;
  draws: number;
  rosterStrength: number;
}

export const TEAM_NAMES = [
  'Cosmic Comets', 'Quantum Cubs', 'Void Vipers', 'Pulse Panthers',
  'Flux Foxes', 'Nova Knights', 'Spark Scorpions', 'Drift Dragons',
  'Cipher Cobras', 'Prism Pumas', 'Surge Sharks', 'Echo Eagles',
  'Glitch Gorillas', 'Warp Wolves', 'Phase Phantoms', 'Blitz Bears',
  'Aether Aces', 'Chroma Cheetahs', 'Zen Zebras', 'Rift Ravens',
];

export const TEAM_COLORS: { primary: string; secondary: string }[] = [
  { primary: '#00F0FF', secondary: '#0A0A0F' },
  { primary: '#A78BFA', secondary: '#1A1030' },
  { primary: '#FBBF24', secondary: '#1A1500' },
  { primary: '#34D399', secondary: '#0A1A0A' },
  { primary: '#FB7185', secondary: '#1A0A0A' },
  { primary: '#818CF8', secondary: '#0A0A1A' },
  { primary: '#F472B6', secondary: '#1A0A14' },
  { primary: '#38BDF8', secondary: '#0A1420' },
];
