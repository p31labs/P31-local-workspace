import { GameState, Team, Player, PlayerStats, Position, Quarter, DriveState, DriveEvent, PlayResult, PlayType } from './types.ts';
import { Rng, createMulberry32 } from '../card/rng/mulberry32.ts';
import { resolvePlay, resolveFieldGoal, resolvePunt, updateDrive, suggestPlay } from './driveSim.ts';
import { generateRoster } from './teamManager.ts';

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

function generatePlayerStats(rng: Rng, overrides?: Partial<PlayerStats>): PlayerStats {
  return {
    speed: overrides?.speed ?? randomStat(rng, 20, 70),
    strength: overrides?.strength ?? randomStat(rng, 20, 70),
    agility: overrides?.agility ?? randomStat(rng, 20, 70),
    throwing: overrides?.throwing ?? randomStat(rng, 20, 70),
    blocking: overrides?.blocking ?? randomStat(rng, 20, 70),
    tackling: overrides?.tackling ?? randomStat(rng, 20, 70),
    coverage: overrides?.coverage ?? randomStat(rng, 20, 70),
    kicking: overrides?.kicking ?? randomStat(rng, 20, 70),
  };
}

export function generateTeam(name: string, rng: Rng): Team {
  const id = name.toLowerCase().replace(/\s/g, '');
  const roster = generateRoster(name, rng);

  const findPos = (pos: Position): Player => {
    const p = roster.find(p => p.position === pos);
    if (!p) throw new Error(`Missing position ${pos} on team ${name}`);
    return p;
  };

  const offense: Player[] = [
    findPos('QB'),
    findPos('RB'),
    findPos('WR'),
    findPos('WR'),
    findPos('TE'),
    findPos('OL'),
    findPos('OL'),
  ];

  const defense: Player[] = [
    findPos('DL'),
    findPos('LB'),
    findPos('DB'),
  ];

  const kicker = findPos('K');
  const punter = findPos('K');

  return {
    id,
    name,
    players: roster,
    offense,
    defense,
    kicker,
    punter,
  };
}

export function createGameState(awayName: string, homeName: string, seed?: number): GameState {
  const rng = seed !== undefined ? createMulberry32(seed) : createMulberry32(Date.now());

  const homeTeam = generateTeam(homeName, rng);
  const awayTeam = generateTeam(awayName, rng);

  return {
    quarter: 1,
    timeRemaining: 900,
    score: [0, 0],
    drive: {
      down: 1,
      distance: 10,
      yardLine: 25,
      possession: 'away',
    },
    possession: 'away',
    drives: [],
    isComplete: false,
    homeTeam,
    awayTeam,
    kickoffPending: true,
  };
}

function findPlayerByPosition(players: Player[], pos: Position): Player | undefined {
  return players.find(p => p.position === pos);
}

export function simulateKickoff(state: GameState, rng: Rng): GameState {
  const touchback = rng() < 0.6;
  const returnYards = touchback ? 0 : Math.round(rng() * 25);

  const receivingTeam = state.possession === 'home' ? 'away' as const : 'home' as const;
  const startYard = touchback ? 25 : Math.min(40, 25 + returnYards);

  const newDrive: DriveState = {
    down: 1,
    distance: 10,
    yardLine: startYard,
    possession: receivingTeam,
  };

  return {
    ...state,
    possession: receivingTeam,
    drive: newDrive,
    kickoffPending: false,
  };
}

export function simulatePlay(
  state: GameState,
  rng?: Rng,
  opts?: { spoonFactor?: number; playerTeam?: 'home' | 'away' },
): GameState {
  const seed = rng ?? createMulberry32(Date.now());

  if (state.isComplete) return state;

  if (state.kickoffPending) {
    return simulateKickoff(state, seed);
  }

  const { homeTeam, awayTeam, drive, quarter, timeRemaining, score } = state;
  const offenseTeam = drive.possession === 'home' ? homeTeam : awayTeam;
  const defenseTeam = drive.possession === 'home' ? awayTeam : homeTeam;

  const playType = suggestPlay(drive.down, drive.distance, drive.yardLine, score, quarter, timeRemaining, seed);

  let result: PlayResult;

  if (playType === 'FIELD_GOAL') {
    const fgDist = 100 - drive.yardLine + 17;
    result = resolveFieldGoal(offenseTeam.kicker.stats, seed, fgDist);
  } else if (playType === 'PUNT') {
    result = resolvePunt(offenseTeam.punter.stats, seed);
  } else {
    const carrierPos: Position = playType === 'RUN' ? 'RB' : 'QB';
    const defPos: Position = playType === 'RUN' ? 'LB' : 'DB';
    const carrier = findPlayerByPosition(offenseTeam.offense, carrierPos);
    const def = findPlayerByPosition(defenseTeam.defense, defPos);
    const playerSpoon = opts?.spoonFactor !== undefined && opts?.playerTeam === drive.possession ? opts.spoonFactor : undefined;
    result = resolvePlay(
      playType,
      carrier?.stats ?? offenseTeam.offense[0].stats,
      def?.stats ?? defenseTeam.defense[0].stats,
      seed,
      drive.distance,
      playerSpoon,
    );
  }

  if (drive.yardLine + result.gain >= 100) {
    result.isTouchdown = true;
    result.gain = 100 - drive.yardLine;
  }

  if (drive.yardLine + result.gain <= 0) {
    result.isSafety = true;
    result.gain = -drive.yardLine;
  }

  let newTime = timeRemaining - result.clockSeconds;
  let newQuarter: Quarter = quarter;
  if (newTime <= 0) {
    newQuarter = (quarter + 1) as Quarter;
    newTime = 900;
  }

  const oldDrive = { ...drive };
  let newDrive = updateDrive(drive, result);

  const newScore: [number, number] = [score[0], score[1]];

  if (result.isTouchdown) {
    const idx = oldDrive.possession === 'home' ? 1 : 0;
    newScore[idx] += 6;
  }
  if (result.isFieldGoal) {
    const idx = oldDrive.possession === 'home' ? 1 : 0;
    newScore[idx] += 3;
  }
  if (result.isSafety) {
    const idx = oldDrive.possession === 'home' ? 0 : 1;
    newScore[idx] += 2;
  }

  let kickoffPending = false;
  let nextPossession: 'home' | 'away' = newDrive.possession;
  let nextDrive = { ...newDrive };

  const driveEnded = result.isTouchdown || result.isFieldGoal || result.isSafety;

  if (driveEnded) {
    kickoffPending = true;
    nextPossession = oldDrive.possession;
    nextDrive = {
      down: 1,
      distance: 10,
      yardLine: 25,
      possession: nextPossession,
    };
  } else if (playType === 'PUNT') {
    const receiving = oldDrive.possession === 'home' ? 'away' as const : 'home' as const;
    nextPossession = receiving;
    nextDrive = {
      down: 1,
      distance: 10,
      yardLine: 100 - Math.min(100, oldDrive.yardLine + result.gain),
      possession: receiving,
    };
  } else if (result.isTurnover || (oldDrive.down === 4 && !result.isFirstDown)) {
    const receiving = oldDrive.possession === 'home' ? 'away' as const : 'home' as const;
    nextPossession = receiving;
    nextDrive = {
      down: 1,
      distance: 10,
      yardLine: 100 - oldDrive.yardLine,
      possession: receiving,
    };
  }

  const driveEvent: DriveEvent = {
    quarter,
    playIndex: state.drives.length,
    down: oldDrive.down,
    distance: oldDrive.distance,
    yardLine: oldDrive.yardLine,
    playType,
    result: { ...result },
    scoreBefore: [score[0], score[1]],
    scoreAfter: [newScore[0], newScore[1]],
    description: result.description,
  };

  const isComplete = newQuarter > 4;

  return {
    ...state,
    quarter: newQuarter,
    timeRemaining: newTime,
    score: newScore,
    possession: nextPossession,
    drive: nextDrive,
    drives: [...state.drives, driveEvent],
    isComplete,
    kickoffPending,
  };
}
