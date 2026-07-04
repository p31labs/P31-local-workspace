export interface PlayerStats {
  power: number;
  speed: number;
  stamina: number;
  accuracy: number;
}

export interface Player {
  id: string;
  name: string;
  position: string;
  stats: PlayerStats;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
  lineup: Player[];
  pitcher: Player;
}

export interface GameState {
  inning: number;
  top: boolean;
  outs: number;
  balls: number;
  strikes: number;
  bases: [boolean, boolean, boolean];
  score: [number, number];
  battingIndex: number;
  awayTeam: Team;
  homeTeam: Team;
  currentPitcher: Player;
  currentBatter: Player;
  plays: PlayEvent[];
  isComplete: boolean;
}

export interface PlayEvent {
  inning: number;
  top: boolean;
  batter: string;
  pitcher: string;
  result: AtBatResult;
  description: string;
  outsBefore: number;
  outsAfter: number;
  basesBefore: [boolean, boolean, boolean];
  basesAfter: [boolean, boolean, boolean];
  scoreBefore: [number, number];
  scoreAfter: [number, number];
}

export type AtBatResult =
  | 'STRIKEOUT'
  | 'WALK'
  | 'SINGLE'
  | 'DOUBLE'
  | 'TRIPLE'
  | 'HOME_RUN'
  | 'OUT'
  | 'SACRIFICE_FLY';

export interface TrainingResult {
  stat: keyof PlayerStats;
  gain: number;
  description: string;
}

export type SkillCategory = 'hitting' | 'pitching' | 'fielding' | 'running';

export enum LeagueTier {
  Rookie = 'ROOKIE',
  Minor = 'MINOR',
  Major = 'MAJOR',
  World = 'WORLD',
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  runsScored: number;
  runsAllowed: number;
}

export interface StandingsEntry {
  teamName: string;
  teamId: string;
  record: TeamRecord;
  tier: LeagueTier;
  gamesBack: number;
}

export interface LeagueStandings {
  tier: LeagueTier;
  season: number;
  teams: StandingsEntry[];
}

export interface SeasonSchedule {
  tier: LeagueTier;
  season: number;
  week: number;
  games: { away: string; home: string; awayScore?: number; homeScore?: number; played: boolean }[];
}

export interface TrainingSession {
  playerId: string;
  playerName: string;
  skill: SkillCategory;
  gain: number;
  date: string;
}

export interface TeamState {
  name: string;
  tier: LeagueTier;
  season: number;
  roster: Player[];
  rotation: Player[];
  record: TeamRecord;
  trainingSessions: TrainingSession[];
  sessionsToday: number;
  lastTrainingDate: string;
  eliteUnlocked: boolean;
  hasEliteTrial: boolean;
  totalWins: number;
  totalGamesPlayed: number;
}
