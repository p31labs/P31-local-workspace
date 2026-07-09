import { PlayType, Down, DriveState, PlayResult, PlayerStats, Player, Quarter, DriveEvent } from './types.ts';
import { Rng } from '../card/rng/mulberry32.ts';

export function resolvePlay(
  playType: PlayType,
  ballCarrier: PlayerStats,
  defender: PlayerStats,
  rng: Rng,
  distance: number,
  playerSpoon?: number,
): PlayResult {
  const isRun = playType === 'RUN';
  let gain: number;
  let isTurnover = false;
  let description: string;
  let clockSeconds: number;

  if (isRun) {
    const spoon = playerSpoon ?? 1;
    gain = 2 + (ballCarrier.speed / 100) * 4 + (ballCarrier.strength / 100) * 3
      - (defender.tackling / 100) * 3 * spoon + (1 - spoon) * 1.5 + rng() * 4;
    gain = Math.max(-5, Math.round(gain * 10) / 10);

    const fumbleChance = ballCarrier.strength < 40 ? 0.03 : 0;
    if (rng() < fumbleChance) {
      isTurnover = true;
      gain = 0;
      description = 'Fumble! Turnover.';
    } else {
      description = `Run for ${gain} yards.`;
    }

    clockSeconds = 20 + rng() * 15;
  } else {
    const spoon = playerSpoon ?? 1;
    const completion = Math.min(0.95, 0.5 + (ballCarrier.throwing / 100) * 0.3 - (defender.coverage / 100) * 0.2 * spoon + (1 - spoon) * 0.15);
    const completed = rng() < completion;

    if (completed) {
      gain = 5 + (ballCarrier.throwing / 100) * 8 + (defender.speed > 70 ? rng() * 10 : rng() * 20);
      gain = Math.round(gain * 10) / 10;
      description = `Pass complete for ${gain} yards.`;
      clockSeconds = 25 + rng() * 15;
    } else {
      const sackChance = 0.05;
      const intChance = Math.max(0, 0.05 - (ballCarrier.throwing / 100) * 0.03 + (defender.coverage / 100) * 0.03 * spoon - (1 - spoon) * 0.03);

      if (rng() < sackChance) {
        gain = -(3 + rng() * 7);
        gain = Math.round(gain * 10) / 10;
        description = `Sacked for ${Math.abs(gain)} yard loss.`;
        clockSeconds = 20 + rng() * 10;
      } else if (rng() < intChance) {
        gain = 0;
        isTurnover = true;
        description = 'Interception! Turnover.';
        clockSeconds = 10 + rng() * 5;
      } else {
        gain = 0;
        description = 'Pass incomplete.';
        clockSeconds = 15 + rng() * 10;
      }
    }
  }

  const isFirstDown = gain >= distance;

  return {
    type: playType,
    gain,
    isTouchdown: false,
    isFieldGoal: false,
    isSafety: false,
    isTurnover,
    isFirstDown,
    description,
    clockSeconds: Math.round(clockSeconds),
  };
}

export function resolveFieldGoal(kicker: PlayerStats, rng: Rng, distance: number): PlayResult {
  const success = Math.min(1, Math.max(0, (kicker.kicking / 100) * 0.5 - (distance - 30) * 0.02 + 0.3 + rng() * 0.3));
  const good = success >= 0.5;

  return {
    type: 'FIELD_GOAL',
    gain: good ? distance : 0,
    isTouchdown: false,
    isFieldGoal: good,
    isSafety: false,
    isTurnover: !good,
    isFirstDown: false,
    description: good ? `Field goal good from ${distance} yards!` : `Field goal miss from ${distance} yards.`,
    clockSeconds: Math.round(15 + rng() * 10),
  };
}

export function resolvePunt(punter: PlayerStats, rng: Rng): PlayResult {
  let net = 30 + (punter.kicking / 100) * 15 + rng() * 10 - rng() * 5;
  net = Math.max(10, Math.round(net * 10) / 10);

  const touchback = net >= 90;
  const returnYards = touchback ? 0 : Math.max(0, rng() * 8 - 2);

  return {
    type: 'PUNT',
    gain: touchback ? 80 : net,
    isTouchdown: false,
    isFieldGoal: false,
    isSafety: false,
    isTurnover: false,
    isFirstDown: false,
    description: touchback
      ? 'Punt for touchback.'
      : `Punt for ${net} yards${returnYards > 0 ? `, returned for ${Math.round(returnYards)}.` : ', fair catch.'}`,
    clockSeconds: Math.round(15 + rng() * 10),
  };
}

export function updateDrive(drive: DriveState, result: PlayResult): DriveState {
  let { down, distance, yardLine, possession } = drive;

  yardLine = Math.max(0, Math.min(100, yardLine + result.gain));
  distance -= result.gain;

  if (distance <= 0) {
    down = 1;
    distance = Math.min(10, 100 - yardLine);
  } else {
    down = Math.min(4, down + 1) as Down;
  }

  return { down, distance, yardLine, possession };
}

export function suggestPlay(
  down: Down,
  distance: number,
  yardLine: number,
  _score: [number, number],
  _quarter: Quarter,
  _timeRemaining: number,
  rng: Rng,
): PlayType {
  if (down < 4) {
    if (distance > 8) return rng() > 0.55 ? 'PASS' : 'RUN';
    if (distance <= 3) return rng() > 0.3 ? 'RUN' : 'PASS';
    return rng() > 0.5 ? 'PASS' : 'RUN';
  }

  const fgDistance = 100 - yardLine + 17;
  if (fgDistance <= 52) return 'FIELD_GOAL';
  if (yardLine < 50) return 'PUNT';
  if (distance <= 2) return 'RUN';
  return distance <= 5 ? 'PASS' : 'PUNT';
}

function findPlayerByPosition(players: Player[], position: Position): Player | undefined {
  return players.find(p => p.position === position);
}

export function simulateDrive(
  offense: Player[],
  defense: Player[],
  kicker: Player,
  punter: Player,
  startDrive: DriveState,
  quarter: Quarter,
  timeRemaining: number,
  score: [number, number],
  rng: Rng,
): { events: DriveEvent[]; endDrive: DriveState; endQuarter: Quarter; endTime: number; endScore: [number, number]; complete: boolean } {
  const events: DriveEvent[] = [];
  let drive = { ...startDrive };
  let currentQuarter = quarter;
  let currentTime = timeRemaining;
  let currentScore: [number, number] = [score[0], score[1]];
  let playIndex = 0;
  let complete = false;

  while (!complete && currentQuarter <= 4) {
    const playType = suggestPlay(drive.down, drive.distance, drive.yardLine, currentScore, currentQuarter, currentTime, rng);

    let result: PlayResult;
    let ballCarrierStats: PlayerStats | undefined;
    let defenderStats: PlayerStats | undefined;

    if (playType === 'FIELD_GOAL') {
      const fgDist = 100 - drive.yardLine + 17;
      result = resolveFieldGoal(kicker.stats, rng, fgDist);
    } else if (playType === 'PUNT') {
      result = resolvePunt(punter.stats, rng);
    } else {
      const carrier = playType === 'RUN'
        ? findPlayerByPosition(offense, 'RB')
        : findPlayerByPosition(offense, 'QB');
      const def = playType === 'RUN'
        ? findPlayerByPosition(defense, 'LB')
        : findPlayerByPosition(defense, 'DB');

      ballCarrierStats = carrier?.stats ?? offense[0].stats;
      defenderStats = def?.stats ?? defense[0].stats;
      result = resolvePlay(playType, ballCarrierStats, defenderStats, rng, drive.distance);
    }

    if (drive.yardLine + result.gain >= 100) {
      result.isTouchdown = true;
      result.gain = 100 - drive.yardLine;
    }

    if (drive.yardLine + result.gain <= 0) {
      result.isSafety = true;
      result.gain = -drive.yardLine;
    }

    currentTime -= result.clockSeconds;

    const oldDrive = { ...drive };
    drive = updateDrive(drive, result);

    const scoreBefore: [number, number] = [currentScore[0], currentScore[1]];

    if (result.isTouchdown) {
      const idx = oldDrive.possession === 'home' ? 1 : 0;
      currentScore[idx] += 6;
      complete = true;
    }
    if (result.isFieldGoal) {
      const idx = oldDrive.possession === 'home' ? 1 : 0;
      currentScore[idx] += 3;
      complete = true;
    }
    if (result.isSafety) {
      const idx = oldDrive.possession === 'home' ? 0 : 1;
      currentScore[idx] += 2;
      drive.possession = oldDrive.possession === 'home' ? 'away' : 'home';
      complete = true;
    }

    if (playType === 'PUNT') {
      drive.possession = oldDrive.possession === 'home' ? 'away' : 'home';
      drive.yardLine = 100 - Math.min(100, oldDrive.yardLine + result.gain);
      drive.down = 1;
      drive.distance = Math.min(10, 100 - drive.yardLine);
      complete = true;
    }

    if (result.isTurnover && !result.isFieldGoal && !result.isTouchdown) {
      drive.possession = oldDrive.possession === 'home' ? 'away' : 'home';
      drive.yardLine = 100 - oldDrive.yardLine;
      drive.down = 1;
      drive.distance = Math.min(10, 100 - drive.yardLine);
      complete = true;
    }

    if (oldDrive.down === 4 && !result.isFirstDown && !result.isTouchdown && !result.isFieldGoal && playType !== 'PUNT') {
      drive.possession = oldDrive.possession === 'home' ? 'away' : 'home';
      drive.yardLine = 100 - oldDrive.yardLine;
      drive.down = 1;
      drive.distance = Math.min(10, 100 - drive.yardLine);
      result.isTurnover = true;
      complete = true;
    }

    const scoreAfter: [number, number] = [currentScore[0], currentScore[1]];

    events.push({
      quarter: currentQuarter,
      playIndex: playIndex++,
      down: oldDrive.down,
      distance: oldDrive.distance,
      yardLine: oldDrive.yardLine,
      playType,
      result: { ...result },
      scoreBefore,
      scoreAfter,
      description: result.description,
    });

    if (currentTime <= 0) {
      currentQuarter = (currentQuarter + 1) as Quarter;
      currentTime = 900;
      if (currentQuarter > 4) {
        complete = true;
      }
    }
  }

  return {
    events,
    endDrive: drive,
    endQuarter: currentQuarter,
    endTime: currentTime,
    endScore: currentScore,
    complete: complete || currentQuarter > 4,
  };
}
