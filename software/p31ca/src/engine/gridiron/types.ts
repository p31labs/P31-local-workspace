export interface PlayerStats {
  speed: number;
  strength: number;
  agility: number;
  throwing: number;
  blocking: number;
  tackling: number;
  coverage: number;
  kicking: number;
}

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'OL' | 'DL' | 'LB' | 'DB' | 'K' | 'P';

export interface Player {
  id: string;
  name: string;
  position: Position;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  offense: Player[];
  defense: Player[];
  kicker: Player;
  punter: Player;
}

export type PlayType = 'RUN' | 'PASS' | 'PUNT' | 'FIELD_GOAL' | 'KICKOFF' | 'PAT';
export type Down = 1 | 2 | 3 | 4;
export type Quarter = 1 | 2 | 3 | 4;

export interface DriveState {
  down: Down;
  distance: number;
  yardLine: number;
  possession: 'home' | 'away';
}

export interface PlayResult {
  type: PlayType;
  gain: number;
  isTouchdown: boolean;
  isFieldGoal: boolean;
  isSafety: boolean;
  isTurnover: boolean;
  isFirstDown: boolean;
  description: string;
  clockSeconds: number;
}

export interface DriveEvent {
  quarter: Quarter;
  playIndex: number;
  down: Down;
  distance: number;
  yardLine: number;
  playType: PlayType;
  result: PlayResult;
  scoreBefore: [number, number];
  scoreAfter: [number, number];
  description: string;
}

export interface GameState {
  quarter: Quarter;
  timeRemaining: number;
  score: [number, number];
  drive: DriveState;
  possession: 'home' | 'away';
  drives: DriveEvent[];
  isComplete: boolean;
  homeTeam: Team;
  awayTeam: Team;
  kickoffPending: boolean;
}

export interface SeasonRecord {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
}
