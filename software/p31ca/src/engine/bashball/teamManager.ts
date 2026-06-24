import { Player, PlayerStats, TeamState, LeagueTier, TeamRecord } from './types.ts';
import { Rng } from '../card/rng/mulberry32.ts';

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Dakota', 'Blake', 'Cameron',
  'Jamie', 'Skyler', 'Finley', 'Rowan', 'Emerson', 'Parker', 'Tatum', 'Sage', 'Reese', 'Hayden',
  'Charlie', 'Drew', 'Sawyer', 'Ellis', 'Phoenix', 'Auden', 'Briar', 'Gray', 'Wren', 'Ash',
];

const LAST_NAMES = [
  'Chen', 'Patel', 'Rivera', 'Kim', "O'Brien", 'Singh', 'Davis', 'Miller', 'Garcia', 'Williams',
  'Taylor', 'Jackson', 'Lee', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young',
  'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter',
];

const TIER_STAT_RANGES: Record<LeagueTier, { min: number; max: number }> = {
  [LeagueTier.Rookie]: { min: 20, max: 60 },
  [LeagueTier.Minor]: { min: 30, max: 70 },
  [LeagueTier.Major]: { min: 40, max: 80 },
  [LeagueTier.World]: { min: 50, max: 90 },
};

function generateName(rng: Rng): string {
  return `${FIRST_NAMES[rng.int(FIRST_NAMES.length)]} ${LAST_NAMES[rng.int(LAST_NAMES.length)]}`;
}

function randomStat(rng: Rng, min: number, max: number): number {
  return rng.int(max - min + 1) + min;
}

function generatePlayerStats(rng: Rng, range: { min: number; max: number }): PlayerStats {
  return {
    power: randomStat(rng, range.min, range.max),
    speed: randomStat(rng, range.min, range.max),
    stamina: randomStat(rng, range.min, range.max),
    accuracy: randomStat(rng, range.min, range.max),
  };
}

export function generateRoster(teamName: string, tier: LeagueTier, rng: Rng): Player[] {
  const range = TIER_STAT_RANGES[tier];
  const teamId = teamName.toLowerCase().replace(/\s/g, '');
  const players: Player[] = [];

  for (let i = 0; i < 9; i++) {
    players.push({
      id: `${teamId}-p${i}`,
      name: generateName(rng),
      position: POSITIONS[i],
      stats: generatePlayerStats(rng, range),
    });
  }

  for (let i = 0; i < 3; i++) {
    players.push({
      id: `${teamId}-p${9 + i}`,
      name: generateName(rng),
      position: 'P',
      stats: {
        power: randomStat(rng, range.min, range.max),
        speed: randomStat(rng, range.min, range.max),
        stamina: randomStat(rng, range.min + 10, range.max),
        accuracy: randomStat(rng, range.min + 10, range.max),
      },
    });
  }

  return players;
}

export function generateRotation(roster: Player[], rng: Rng): Player[] {
  const pitchers = roster.filter(p => p.position === 'P');
  const shuffled = [...pitchers].sort(() => rng() - 0.5);
  return shuffled.slice(0, 3);
}

export function createInitialTeamState(teamName: string, tier: LeagueTier = LeagueTier.Rookie): TeamState {
  return {
    name: teamName,
    tier,
    season: 1,
    roster: [],
    rotation: [],
    record: { wins: 0, losses: 0, ties: 0, runsScored: 0, runsAllowed: 0 },
    trainingSessions: [],
    sessionsToday: 0,
    lastTrainingDate: new Date().toISOString().slice(0, 10),
    eliteUnlocked: false,
    hasEliteTrial: false,
    totalWins: 0,
    totalGamesPlayed: 0,
  };
}

export function applyTraining(player: Player, stat: keyof PlayerStats, gain: number): Player {
  return {
    ...player,
    stats: {
      ...player.stats,
      [stat]: Math.min(100, Math.round((player.stats[stat] + gain) * 100) / 100),
    },
  };
}

export function tierBadge(tier: LeagueTier): string {
  switch (tier) {
    case LeagueTier.Rookie: return '[Rookie]';
    case LeagueTier.Minor: return '[Minor]';
    case LeagueTier.Major: return '[Major]';
    case LeagueTier.World: return '[World]';
  }
}

export function formatRecord(record: TeamRecord): string {
  if (record.ties > 0) return `${record.wins}-${record.losses}-${record.ties}`;
  return `${record.wins}-${record.losses}`;
}
