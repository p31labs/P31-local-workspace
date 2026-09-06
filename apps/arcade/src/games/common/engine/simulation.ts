import type { PlayerCharacter, BaseballStats } from '../types/Player.js';

export type PitchOutcome = 'strike_swinging' | 'strike_looking' | 'ball' | 'hit_single' | 'hit_double' | 'hit_triple' | 'home_run' | 'foul' | 'hit_by_pitch' | 'walk';

export interface AtBatResult {
  outcome: PitchOutcome;
  pitches: PitchOutcome[];
  rbi: number;
  runs: number;
  outs: number;
  description: string;
}

export interface InningResult {
  top: AtBatResult[];
  bottom: AtBatResult[];
  runs: number;
  hits: number;
}

export interface SimulatedGame {
  innings: InningResult[];
  homeScore: number;
  awayScore: number;
  homeHits: number;
  awayHits: number;
  winner: 'home' | 'away' | 'draw';
  highlights: string[];
  playerStats: {
    hitting: number;
    pitching: number;
    fielding: number;
    hits: number;
    runs: number;
    rbi: number;
  };
}

export interface FootballPlayResult {
  playName: string;
  playType: 'run' | 'pass' | 'trick' | 'punt' | 'field_goal';
  yards: number;
  result: 'gain' | 'loss' | 'turnover' | 'td' | 'fg_good' | 'fg_miss' | 'safety';
  description: string;
}

export interface FootballDriveResult {
  plays: FootballPlayResult[];
  result: 'td' | 'fg' | 'punt' | 'turnover' | 'end_of_half';
  yards: number;
  duration: number;
}

export interface SimulatedFootballGame {
  drives: FootballDriveResult[];
  homeScore: number;
  awayScore: number;
  winner: 'home' | 'away' | 'draw';
  highlights: string[];
  playerStats: {
    passing: number;
    rushing: number;
    touchdowns: number;
    interceptions: number;
  };
}

export function simulateAtBat(
  batter: PlayerCharacter,
  pitcherStats: BaseballStats,
  spoons: number,
): AtBatResult {
  const contact = (batter.stats.hitting + batter.spoon * 3) / (pitcherStats.pitching + 50);
  const power = batter.stats.power / 100;
  const pitchCount: PitchOutcome[] = [];
  let balls = 0;
  let strikes = 0;

  const boldTrait = batter.traits.find(t => t.id === 'bold');
  const patientTrait = batter.traits.find(t => t.id === 'patient');
  const determinedTrait = batter.traits.find(t => t.id === 'determined');

  let patience = Math.min(0.95, 0.35 + batter.stats.hitting / 200);
  if (patientTrait) patience += 0.1;
  if (boldTrait) patience -= 0.1;

  for (let p = 0; p < 15; p++) {
    const roll = Math.random();
    const pitcherQuality = Math.min(0.95, pitcherStats.pitching / 120 + spoons * 0.03);

    if (roll < 0.35 * pitcherQuality) {
      pitchCount.push('strike_swinging');
      strikes++;
    } else if (roll < 0.55 * pitcherQuality) {
      pitchCount.push('strike_looking');
      strikes++;
    } else if (roll < 0.55 * pitcherQuality + (1 - pitcherQuality) * 0.5) {
      pitchCount.push('ball');
      balls++;
    } else if (roll < 0.55 * pitcherQuality + (1 - pitcherQuality) * 0.7 + contact * 0.15) {
      const hitRoll = Math.random();
      let outcome: PitchOutcome;
      if (hitRoll < 0.05 + power * 0.12) outcome = 'home_run';
      else if (hitRoll < 0.12 + batter.stats.speed / 600) outcome = 'hit_triple';
      else if (hitRoll < 0.28 + power * 0.1) outcome = 'hit_double';
      else outcome = 'hit_single';

      let rbi = 0;
      let runs = 0;
      if (outcome === 'home_run') { runs = 1; rbi = 1; }

      const desc = outcome === 'home_run'
        ? `${batter.name} CRUSHES it — HOME RUN!`
        : outcome === 'hit_triple'
          ? `${batter.name} rips a triple!`
          : outcome === 'hit_double'
            ? `${batter.name} drives a double!`
            : `${batter.name} singles.`;

      return { outcome, pitches: pitchCount.concat(outcome), rbi, runs, outs: 0, description: desc };
    } else if (roll < 0.9) {
      pitchCount.push('foul');
      if (strikes < 2) strikes++;
      else { /* foul with 2 strikes — no change */ }
    } else if (roll < 0.95) {
      pitchCount.push('hit_by_pitch');
      balls = 4;
    } else {
      pitchCount.push('ball');
      balls++;
    }

    if (balls >= 4) {
      const outcome: PitchOutcome = 'walk';
      return { outcome, pitches: pitchCount.concat(outcome), rbi: 0, runs: 0, outs: 0, description: `${batter.name} draws a walk.` };
    }

    if (strikes >= 3) {
      const outcome: PitchOutcome = 'strike_swinging';
      let desc = `${batter.name} strikes out.`;
      if (determinedTrait) desc = `${batter.name} K's but stays locked in.`;
      return { outcome, pitches: pitchCount.concat(outcome), rbi: 0, runs: 0, outs: 1, description: desc };
    }
  }

  const outcome: PitchOutcome = 'strike_swinging';
  return { outcome, pitches: pitchCount.concat(outcome), rbi: 0, runs: 0, outs: 1, description: `${batter.name} K's after a long battle.` };
}

export function simulateBashballInning(
  lineup: PlayerCharacter[],
  pitcher: PlayerCharacter,
  spoons: number,
  isPlayerBatting: boolean,
): InningResult {
  const results: AtBatResult[] = [];
  let outs = 0;
  let runs = 0;
  let hits = 0;

  const pitcherStats = pitcher.stats;
  const battingOrder = [...lineup].sort(() => Math.random() - 0.5).slice(0, 9);

  let batterIdx = 0;
  while (outs < 3) {
    const batter = battingOrder[batterIdx % battingOrder.length];
    const atBat = simulateAtBat(batter, pitcherStats, spoons);

    results.push(atBat);
    outs += atBat.outs;
    runs += atBat.runs;
    if (['hit_single', 'hit_double', 'hit_triple', 'home_run'].includes(atBat.outcome)) hits++;
    batterIdx++;
  }

  return { top: isPlayerBatting ? results : [], bottom: isPlayerBatting ? [] : results, runs, hits };
}

export function simulateBashballGame(
  playerTeamPlayers: PlayerCharacter[],
  playerPitcher: PlayerCharacter,
  aiPitcherStats: BaseballStats,
  aiDifficulty: number,
  spoons: number,
): SimulatedGame {
  const innings: InningResult[] = [];
  let homeScore = 0;
  let awayScore = 0;
  let homeHits = 0;
  let awayHits = 0;
  const highlights: string[] = [];

  for (let i = 1; i <= 9; i++) {
    const top = simulateHalfInning(playerTeamPlayers, aiPitcherStats, spoons, true);
    const bottom = simulateHalfInning(playerTeamPlayers, playerPitcher.stats, spoons, false);

    homeScore += top.runs;
    awayScore += bottom.runs;
    homeHits += top.hits;
    awayHits += bottom.hits;

    innings.push({ top: top.top, bottom: bottom.bottom, runs: top.runs + bottom.runs, hits: top.hits + bottom.hits });

    if (top.runs > 0) highlights.push(`Top ${i}: ${top.runs} run(s)!`);
    if (bottom.runs > 0) highlights.push(`Bot ${i}: ${bottom.runs} run(s)!`);
  }

  const winner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

  return {
    innings,
    homeScore,
    awayScore,
    homeHits,
    awayHits,
    winner,
    highlights,
    playerStats: {
      hitting: homeHits,
      pitching: awayScore,
      fielding: 0,
      hits: homeHits,
      runs: homeScore,
      rbi: homeScore,
    },
  };
}

function simulateHalfInning(
  players: PlayerCharacter[],
  pitcherStats: BaseballStats,
  spoons: number,
  isPlayerBatting: boolean,
): InningResult {
  let outs = 0;
  let runs = 0;
  let hits = 0;

  for (let b = 0; b < 12 && outs < 3; b++) {
    const batter = players[Math.floor(Math.random() * players.length)];
    const atBat = simulateAtBat(batter, pitcherStats, spoons);
    outs += atBat.outs;
    runs += atBat.runs;
    if (['hit_single', 'hit_double', 'hit_triple', 'home_run'].includes(atBat.outcome)) hits++;
  }

  return { top: [], bottom: [], runs, hits };
}

export function simulateFootballGame(
  playerTeamPlayers: PlayerCharacter[],
  aiDifficulty: number,
  spoons: number,
): SimulatedFootballGame {
  const drives: FootballDriveResult[] = [];
  let homeScore = 0;
  let awayScore = 0;
  const highlights: string[] = [];

  for (let d = 0; d < 20; d++) {
    const isPlayerDrive = d % 2 === 0;
    const drive = simulateFootballDrive(playerTeamPlayers, aiDifficulty, spoons, isPlayerDrive);
    drives.push(drive);

    if (isPlayerDrive && drive.result === 'td') homeScore += 7;
    else if (isPlayerDrive && drive.result === 'fg') homeScore += 3;
    else if (!isPlayerDrive && drive.result === 'td') awayScore += 7;
    else if (!isPlayerDrive && drive.result === 'fg') awayScore += 3;
  }

  return {
    drives,
    homeScore,
    awayScore,
    winner: homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw',
    highlights,
    playerStats: { passing: homeScore * 20, rushing: homeScore * 10, touchdowns: Math.floor(homeScore / 7), interceptions: 0 },
  };
}

function simulateFootballDrive(
  players: PlayerCharacter[],
  aiDifficulty: number,
  spoons: number,
  isPlayerDrive: boolean,
): FootballDriveResult {
  const plays: FootballPlayResult[] = [];
  let yards = 0;
  const playTypes: ('run' | 'pass')[] = ['run', 'pass', 'pass', 'run'];
  let downs = 1;
  let yardsToFirstDown = 10;

  for (let p = 0; p < 8 && yards < 80 && downs <= 4; p++) {
    const playType = playTypes[Math.floor(Math.random() * playTypes.length)];
    const skill = isPlayerDrive ? 50 + spoons * 5 : 30 + aiDifficulty * 40;

    let result: FootballPlayResult['result'];
    let gained: number;

    const roll = Math.random() * 100;
    if (roll < skill * 0.15) { result = 'td'; gained = 80 - yards; }
    else if (roll > 95 - aiDifficulty * 5) { result = 'turnover'; gained = 0; }
    else {
      result = 'gain';
      gained = Math.max(-3, Math.floor(playType === 'pass' ? Math.random() * 15 + 2 : Math.random() * 8 + 1));
    }

    yards += gained;
    plays.push({ playName: playType === 'pass' ? 'Pass' : 'Run', playType, yards: gained, result, description: '' });

    if (result === 'td' || result === 'turnover') break;

    if (gained >= yardsToFirstDown) { downs = 1; }
    else downs++;
  }

  const driveResult: FootballDriveResult['result'] = yards >= 80 ? 'td' : downs > 4 ? 'punt' : 'fg';

  return { plays, result: driveResult, yards, duration: plays.length * 30 };
}
