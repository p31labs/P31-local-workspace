import { GameState, PlayEvent, AtBatResult, Player, Team } from './types.ts';
import { resolveAtBat, eventDescription } from './atbat.ts';
import { Rng, createMulberry32 } from '../card/rng/mulberry32.ts';

export function createGameStateWithTeams(awayTeam: Team, homeTeam: Team): GameState {
  return {
    inning: 1,
    top: true,
    outs: 0,
    balls: 0,
    strikes: 0,
    bases: [false, false, false] as [boolean, boolean, boolean],
    score: [0, 0] as [number, number],
    battingIndex: 0,
    awayTeam,
    homeTeam,
    currentPitcher: homeTeam.pitcher,
    currentBatter: awayTeam.lineup[0],
    plays: [],
    isComplete: false,
  };
}

export function createGameState(
  awayName: string,
  homeName: string,
  seed?: number,
): GameState {
  const rng = createMulberry32(seed ?? Math.floor(Math.random() * 2147483647));

  const awayTeam = generateTeam(awayName || 'Visitors', rng);
  const homeTeam = generateTeam(homeName || 'Home', rng);

  return {
    inning: 1,
    top: true,
    outs: 0,
    balls: 0,
    strikes: 0,
    bases: [false, false, false],
    score: [0, 0],
    battingIndex: 0,
    awayTeam,
    homeTeam,
    currentPitcher: homeTeam.pitcher,
    currentBatter: awayTeam.lineup[0],
    plays: [],
    isComplete: false,
  };
}

export function simulatePlay(state: GameState, spoonFactor = 1): GameState {
  if (state.isComplete) return state;

  const batter = state.top ? state.awayTeam.lineup[state.battingIndex % 9]
    : state.homeTeam.lineup[state.battingIndex % 9];
  const pitcher = state.top ? state.homeTeam.pitcher : state.awayTeam.pitcher;

  const rng = createMulberry32(Date.now() + Math.random() * 100000);
  const result = resolveAtBat(batter.stats, pitcher.stats, rng, spoonFactor);

  const event: PlayEvent = {
    inning: state.inning,
    top: state.top,
    batter: batter.name,
    pitcher: pitcher.name,
    result,
    description: eventDescription(result),
    outsBefore: state.outs,
    outsAfter: state.outs,
    basesBefore: [...state.bases] as [boolean, boolean, boolean],
    basesAfter: [...state.bases] as [boolean, boolean, boolean],
    scoreBefore: [...state.score] as [number, number],
    scoreAfter: [...state.score] as [number, number],
  };

  let { outs, bases, score, balls, strikes } = state;

  switch (result) {
    case 'STRIKEOUT':
      outs++;
      break;

    case 'WALK':
      if (bases[0] && bases[1] && bases[2]) {
        score[state.top ? 0 : 1]++;
        event.description = 'Walk — run scores!';
      } else if (bases[0] && bases[1]) {
        bases = [true, true, true];
      } else if (bases[0]) {
        bases = [true, true, false];
      } else {
        bases = [true, false, false];
      }
      break;

    case 'SINGLE': {
      const runs = advanceBases(bases, 1);
      score[state.top ? 0 : 1] += runs;
      bases = [true, bases[0] || bases[1], bases[1] || bases[2]];
      break;
    }

    case 'DOUBLE': {
      const runs = advanceBases(bases, 2);
      score[state.top ? 0 : 1] += runs;
      bases = [false, true, false];
      break;
    }

    case 'TRIPLE': {
      const runs = advanceBases(bases, 3);
      score[state.top ? 0 : 1] += runs;
      bases = [false, false, true];
      break;
    }

    case 'HOME_RUN':
      const hrRuns = countRunners(bases) + 1;
      score[state.top ? 0 : 1] += hrRuns;
      bases = [false, false, false];
      event.description = `HOME RUN! ${hrRuns} run${hrRuns > 1 ? 's' : ''} score!`;
      break;

    case 'OUT':
    case 'SACRIFICE_FLY':
      outs++;
      break;
  }

  event.outsAfter = outs;
  event.basesAfter = [...bases] as [boolean, boolean, boolean];
  event.scoreAfter = [...score] as [number, number];

  const nextBattingIndex = state.battingIndex + 1;

  let next: Partial<GameState> = {
    outs,
    bases,
    score,
    balls: 0,
    strikes: 0,
    plays: [...state.plays, event],
    battingIndex: nextBattingIndex,
    currentPitcher: pitcher,
    currentBatter: state.top ? state.awayTeam.lineup[nextBattingIndex % 9]
      : state.homeTeam.lineup[nextBattingIndex % 9],
  };

  if (outs >= 3) {
    if (state.top) {
      next = {
        ...next,
        outs: 0,
        bases: [false, false, false],
        top: false,
        battingIndex: state.battingIndex,
      };
    } else {
      if (state.inning >= 9 && state.score[0] !== state.score[1]) {
        next.isComplete = true;
      } else {
        next = {
          ...next,
          outs: 0,
          bases: [false, false, false],
          inning: state.inning + 1,
          top: true,
        };
      }
    }
  }

  return { ...state, ...next } as GameState;
}

function advanceBases(bases: [boolean, boolean, boolean], basesToAdvance: number): number {
  let runs = 0;
  let newBases: [boolean, boolean, boolean] = [...bases];

  for (let i = 0; i < basesToAdvance; i++) {
    if (newBases[2]) { newBases[2] = false; runs++; }
    if (newBases[1]) { newBases[1] = false; newBases[2] = true; }
    if (newBases[0]) { newBases[0] = false; newBases[1] = true; }
  }

  return runs;
}

function countRunners(bases: [boolean, boolean, boolean]): number {
  return (bases[0] ? 1 : 0) + (bases[1] ? 1 : 0) + (bases[2] ? 1 : 0);
}

function generateName(rng: Rng): string {
  const first = ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn', 'Dakota', 'Blake', 'Cameron',
    'Jamie', 'Skyler', 'Finley', 'Rowan', 'Emerson', 'Parker', 'Tatum', 'Sage', 'Reese', 'Hayden',
    'Charlie', 'Drew', 'Sawyer', 'Ellis', 'Phoenix', 'Auden', 'Briar', 'Gray', 'Wren', 'Ash'];
  const last = ['Chen', 'Patel', 'Rivera', 'Kim', 'O\'Brien', 'Singh', 'Davis', 'Miller', 'Garcia', 'Williams',
    'Taylor', 'Jackson', 'Lee', 'Harris', 'Clark', 'Lewis', 'Walker', 'Hall', 'Allen', 'Young',
    'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter'];
  return `${first[Math.floor(rng() * first.length)]} ${last[Math.floor(rng() * last.length)]}`;
}

export function generateTeam(name: string, rng: Rng): Team {
  const positions = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
  const players: Player[] = positions.map((pos, i) => ({
    id: `${name.toLowerCase().replace(/\s/g, '')}-p${i}`,
    name: generateName(rng),
    position: pos,
    stats: {
      power: Math.floor(rng() * 60 + 25),
      speed: Math.floor(rng() * 60 + 25),
      stamina: Math.floor(rng() * 60 + 25),
      accuracy: Math.floor(rng() * 60 + 25),
    },
  }));

  const pitcher: Player = {
    id: `${name.toLowerCase().replace(/\s/g, '')}-p${players.length}`,
    name: generateName(rng),
    position: 'P',
    stats: {
      power: Math.floor(rng() * 40 + 20),
      speed: Math.floor(rng() * 40 + 20),
      stamina: Math.floor(rng() * 60 + 30),
      accuracy: Math.floor(rng() * 50 + 30),
    },
  };

  return {
    id: name.toLowerCase().replace(/\s/g, ''),
    name,
    players: [...players, pitcher],
    lineup: players,
    pitcher,
  };
}
