import { AtBatResult, PlayerStats } from './types.ts';
import { Rng } from '../card/rng/mulberry32.ts';

const LEAGUE_AVG: Record<string, number> = {
  WALK: 0.08,
  SINGLE: 0.16,
  DOUBLE: 0.05,
  TRIPLE: 0.01,
  HOME_RUN: 0.03,
  STRIKEOUT: 0.22,
  OUT: 0.45,
};

type EventKey = keyof typeof LEAGUE_AVG;

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

function log5(a: number, b: number, c: number): number {
  if (c <= 0 || c >= 1) return a;
  const abDivC = (a * b) / c;
  const term = abDivC + ((1 - a) * (1 - b)) / (1 - c);
  if (term <= 0) return 0;
  return abDivC / term;
}

function batterEventProb(stat: number, minP: number, maxP: number): number {
  return clamp(minP + (stat / 100) * (maxP - minP));
}

function pitcherAllowProb(stat: number, minP: number, maxP: number): number {
  return clamp(maxP - (stat / 100) * (maxP - minP));
}

export function resolveAtBat(
  batter: PlayerStats,
  pitcher: PlayerStats,
  rng: Rng,
  spoonFactor: number = 1.0,
): AtBatResult {
  const bMul = 0.7 + spoonFactor * 0.3;
  const pMul = 1.3 - spoonFactor * 0.3;
  const bw = { ...batter, power: batter.power * bMul, speed: batter.speed * bMul, stamina: batter.stamina * bMul };
  const pw = { ...pitcher, accuracy: clamp(pitcher.accuracy * pMul, 0, 100) * bMul };
  const pc = pw.accuracy;

  const bProb: Record<EventKey, number> = {
    SINGLE:    batterEventProb(bw.speed,   0.08, 0.22),
    DOUBLE:    batterEventProb(bw.power,   0.02, 0.10) * 0.6 + batterEventProb(bw.speed, 0.02, 0.08) * 0.4,
    TRIPLE:    batterEventProb(bw.speed,   0.002, 0.025),
    HOME_RUN:  batterEventProb(bw.power,   0.005, 0.07),
    WALK:      batterEventProb(bw.stamina, 0.03, 0.14),
    STRIKEOUT: clamp(0.34 - (bw.stamina / 100) * 0.16),
    OUT:       clamp(0.65 - (bw.speed / 100) * 0.08 - (bw.power / 100) * 0.04),
  };

  const pProb: Record<EventKey, number> = {
    SINGLE:    pitcherAllowProb(pc, 0.08, 0.24),
    DOUBLE:    pitcherAllowProb(pc, 0.02, 0.14),
    TRIPLE:    pitcherAllowProb(pc, 0.001, 0.04),
    HOME_RUN:  pitcherAllowProb(pc, 0.005, 0.12),
    WALK:      pitcherAllowProb(pc, 0.03, 0.22),
    STRIKEOUT: clamp(0.02 + (pc / 100) * 0.26),
    OUT:       clamp(0.28 + (pc / 100) * 0.22),
  };

  const events: EventKey[] = ['WALK', 'SINGLE', 'DOUBLE', 'TRIPLE', 'HOME_RUN', 'STRIKEOUT', 'OUT'];

  const combined = events.map(e => log5(bProb[e], pProb[e], LEAGUE_AVG[e]));
  const total = combined.reduce((s, v) => s + v, 0) || 1;
  const probs = combined.map(v => v / total);

  const roll = rng();
  let cumulative = 0;
  for (let i = 0; i < events.length; i++) {
    cumulative += probs[i];
    if (roll < cumulative) return events[i] as AtBatResult;
  }
  return 'OUT';
}

export function eventDescription(result: AtBatResult): string {
  switch (result) {
    case 'STRIKEOUT': return 'Strikeout swinging!';
    case 'WALK': return 'Ball four — takes first base.';
    case 'SINGLE': return 'Slaps a single through the gap!';
    case 'DOUBLE': return 'Rips a double off the wall!';
    case 'TRIPLE': return 'Triple! Dives into third standing up!';
    case 'HOME_RUN': return 'CRUSHED! HOME RUN!';
    case 'OUT': return 'Flies out to center field.';
    case 'SACRIFICE_FLY': return 'Sacrifice fly — runner tags up.';
  }
}
