import { Player, PlayerStats, Team, Position, SeasonRecord } from './types.ts';
import { Rng } from '../card/rng/mulberry32.ts';

const POSITIONS: Position[] = ['QB', 'RB', 'WR', 'WR', 'TE', 'OL', 'OL', 'DL', 'LB', 'DB', 'K'];

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

const TEAM_NAMES = [
  'Atlanta Phoenix', 'Boston Pride', 'Chicago Storm', 'Dallas Titans',
  'Denver Gold', 'Detroit Thunder', 'Houston Hurricanes', 'LA Stars',
  'Miami Waves', 'Minneapolis Pioneers', 'New York Legends', 'Orlando Magic',
  'Philadelphia Rebels', 'Phoenix Fire', 'Portland Axe', 'Raleigh Venom',
  'San Diego Fleet', 'San Francisco Fog', 'Seattle Kraken', 'St Louis Arches',
];

function generateName(rng: Rng): string {
  return `${FIRST_NAMES[rng.int(FIRST_NAMES.length)]} ${LAST_NAMES[rng.int(LAST_NAMES.length)]}`;
}

function randomStat(rng: Rng, min: number, max: number): number {
  return rng.int(max - min + 1) + min;
}

function defaultStats(rng: Rng): PlayerStats {
  return {
    speed: randomStat(rng, 20, 70),
    strength: randomStat(rng, 20, 70),
    agility: randomStat(rng, 20, 70),
    throwing: randomStat(rng, 20, 70),
    blocking: randomStat(rng, 20, 70),
    tackling: randomStat(rng, 20, 70),
    coverage: randomStat(rng, 20, 70),
    kicking: randomStat(rng, 20, 70),
  };
}

export function generateRoster(teamName: string, rng: Rng): Player[] {
  const teamId = teamName.toLowerCase().replace(/\s/g, '');
  const roster: Player[] = [];

  for (let i = 0; i < POSITIONS.length; i++) {
    const pos = POSITIONS[i];
    const stats = defaultStats(rng);

    if (pos === 'QB') {
      stats.throwing = randomStat(rng, 30, 80);
    }

    if (pos === 'K') {
      stats.kicking = randomStat(rng, 30, 80);
    }

    roster.push({
      id: `${teamId}-${pos.toLowerCase()}`,
      name: generateName(rng),
      position: pos,
      stats,
    });
  }

  return roster;
}

export function createInitialSeasonRecord(): SeasonRecord {
  return {
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
}

export function formatSeasonRecord(rec: SeasonRecord): string {
  if (rec.ties > 0) return `${rec.wins}-${rec.losses}-${rec.ties}`;
  return `${rec.wins}-${rec.losses}`;
}

export function generateTeamName(rng: Rng): string {
  return TEAM_NAMES[rng.int(TEAM_NAMES.length)];
}
