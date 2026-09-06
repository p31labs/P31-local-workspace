import type { PlayerCharacter, BaseballStats, FootballStats, TacticalStats } from '../types/Player.js';
import { xpToLevel, xpForLevel } from '../types/Player.js';

export type TrainingGame = 'Hit the Target' | 'Fielding Drill' | 'Pitch Precision' | 'Route Running' | 'Passing Accuracy' | 'Tackling Drill' | 'Tactical Puzzle' | 'Memory Match' | 'Speed Solitaire';

export interface TrainingSession {
  playerId: string;
  game: TrainingGame;
  date: string;
  result: 'critical' | 'success' | 'partial' | 'fail';
  xpGained: number;
  statGains: Partial<BaseballStats & FootballStats & TacticalStats>;
}

const DAILY_LIMIT = 3;
const BASE_XP = 25;

export function runTraining(
  player: PlayerCharacter,
  stat: string,
  spoon: number
): TrainingSession & { player: PlayerCharacter } {
  const statValue = getStatValue(player, stat);
  const difficulty = Math.max(10, 100 - statValue + (5 - spoon) * 8);
  const roll = Math.random() * 100;
  const bonus = player.traits.find(t => t.id === 'methodical') ? 15 : 0;
  const adjusted = roll + bonus;

  let result: 'critical' | 'success' | 'partial' | 'fail';
  if (adjusted < difficulty * 0.3) result = 'fail';
  else if (adjusted < difficulty * 0.7) result = 'partial';
  else if (adjusted < difficulty + 30) result = 'success';
  else result = 'critical';

  const xpBase = result === 'critical' ? BASE_XP * 2 : result === 'success' ? BASE_XP : result === 'partial' ? Math.floor(BASE_XP * 0.5) : Math.floor(BASE_XP * 0.2);
  const xpGained = Math.round(xpBase * (1 + spoon * 0.15));

  const statGain = result === 'critical' ? statGainRoll(spoon, 3) : result === 'success' ? statGainRoll(spoon, 2) : result === 'partial' ? statGainRoll(spoon, 1) : 0;

  const statGains: Partial<BaseballStats & FootballStats & TacticalStats> = {};
  if (stat in player.stats) (statGains as any)[stat] = statGain;
  if (player.footballStats && stat in player.footballStats) (statGains as any)[stat] = statGain;
  if (player.tacticalStats && stat in player.tacticalStats) (statGains as any)[stat] = statGain;

  const newXp = player.xp + xpGained;
  const newLevel = xpToLevel(newXp);
  const leveledUp = newLevel > player.level;

  const updatedStats = { ...player.stats };
  if (stat in updatedStats) {
    (updatedStats as any)[stat] = Math.min(99, (updatedStats as any)[stat] + statGain);
  }

  const updatedFootball = player.footballStats ? { ...player.footballStats } : undefined;
  if (updatedFootball && stat in updatedFootball) {
    (updatedFootball as any)[stat] = Math.min(99, (updatedFootball as any)[stat] + statGain);
  }

  const updatedTactical = player.tacticalStats ? { ...player.tacticalStats } : undefined;
  if (updatedTactical && stat in updatedTactical) {
    (updatedTactical as any)[stat] = Math.min(99, (updatedTactical as any)[stat] + statGain);
  }

  const updated: PlayerCharacter = {
    ...player,
    xp: newXp,
    level: leveledUp ? newLevel : player.level,
    stats: updatedStats,
    footballStats: updatedFootball,
    tacticalStats: updatedTactical,
  };

  return {
    playerId: player.id,
    game: detectTrainingGame(stat),
    date: new Date().toISOString().split('T')[0],
    result,
    xpGained,
    statGains,
    player: updated,
  };
}

export function remainingTrainingSessions(todaysSessions: TrainingSession[]): number {
  return Math.max(0, DAILY_LIMIT - todaysSessions.length);
}

function getStatValue(player: PlayerCharacter, stat: string): number {
  if (stat in player.stats) return (player.stats as any)[stat];
  if (player.footballStats && stat in player.footballStats) return (player.footballStats as any)[stat];
  if (player.tacticalStats && stat in player.tacticalStats) return (player.tacticalStats as any)[stat];
  return 40;
}

function statGainRoll(spoon: number, tier: number): number {
  return Math.max(1, Math.round((Math.random() * 2 + tier) * (1 + spoon * 0.1)));
}

function detectTrainingGame(stat: string): TrainingGame {
  switch (stat) {
    case 'hitting': return 'Hit the Target';
    case 'pitching': return 'Pitch Precision';
    case 'fielding': return 'Fielding Drill';
    case 'throwing': return 'Passing Accuracy';
    case 'catching': return 'Route Running';
    case 'tackling': return 'Tackling Drill';
    case 'blocking': return 'Tackling Drill';
    case 'speed': return 'Route Running';
    case 'tactics': return 'Tactical Puzzle';
    case 'attack': return 'Tactical Puzzle';
    case 'defense': return 'Tactical Puzzle';
    default: return 'Memory Match';
  }
}

export function allocateTrainingPoint(
  player: PlayerCharacter,
  stat: string,
): PlayerCharacter {
  const updatedStats = { ...player.stats };
  if (stat in updatedStats) (updatedStats as any)[stat] = Math.min(99, (updatedStats as any)[stat] + 1);

  const updatedFootball = player.footballStats ? { ...player.footballStats } : undefined;
  if (updatedFootball && stat in updatedFootball) (updatedFootball as any)[stat] = Math.min(99, (updatedFootball as any)[stat] + 1);

  const updatedTactical = player.tacticalStats ? { ...player.tacticalStats } : undefined;
  if (updatedTactical && stat in updatedTactical) (updatedTactical as any)[stat] = Math.min(99, (updatedTactical as any)[stat] + 1);

  return { ...player, stats: updatedStats, footballStats: updatedFootball, tacticalStats: updatedTactical };
}
