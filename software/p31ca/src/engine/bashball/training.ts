import { PlayerStats, Player, SkillCategory } from './types.ts';

export const ALLOWED_SESSIONS_PER_DAY = 5;

export const SKILL_STAT_MAP: Record<SkillCategory, keyof PlayerStats> = {
  hitting: 'power',
  pitching: 'accuracy',
  fielding: 'stamina',
  running: 'speed',
};

export const SKILL_LABELS: Record<SkillCategory, string> = {
  hitting: 'Hitting',
  pitching: 'Pitching',
  fielding: 'Fielding',
  running: 'Running',
};

const BASE_GAIN: Record<keyof PlayerStats, number> = {
  power: 0.25,
  speed: 0.20,
  stamina: 0.15,
  accuracy: 0.18,
};

export const ELITE_TRAINING_ITEMS = [
  { name: 'Magnetic Arm Sleeve', stat: 'accuracy' as keyof PlayerStats, boost: 1.5 },
  { name: 'Neural Batting Gloves', stat: 'power' as keyof PlayerStats, boost: 1.5 },
  { name: 'Quicksilver Insoles', stat: 'speed' as keyof PlayerStats, boost: 1.5 },
  { name: 'Steam Bath Recovery Pod', stat: 'stamina' as keyof PlayerStats, boost: 1.5 },
  { name: 'Luminous Grip Spray', stat: 'accuracy' as keyof PlayerStats, boost: 2.0 },
  { name: 'Gravity-Defying Bat', stat: 'power' as keyof PlayerStats, boost: 2.0 },
];

export interface TrainingOutcome {
  skill: SkillCategory;
  stat: keyof PlayerStats;
  gain: number;
  description: string;
  newValue: number;
  capped: boolean;
}

export function trainSkill(
  player: Player,
  skill: SkillCategory,
  sessionsToday: number,
  eliteUnlocked: boolean,
): TrainingOutcome {
  const stat = SKILL_STAT_MAP[skill];
  const baseGain = BASE_GAIN[stat];
  const currentValue = player.stats[stat];
  const diminishing = 1 / (1 + 0.15 * sessionsToday);
  const eliteMult = eliteUnlocked ? 2.0 : 1.0;
  const capacityClamp = (100 - currentValue) / 100;

  const rawGain = baseGain * diminishing * eliteMult * capacityClamp;
  const gain = Math.round(rawGain * 100) / 100;
  const finalGain = Math.max(0, Math.min(gain, 5));
  const newValue = Math.min(100, Math.round((currentValue + finalGain) * 100) / 100);
  const capped = newValue >= 100;

  return {
    skill,
    stat,
    gain: finalGain,
    description: eliteUnlocked
      ? `Elite training session: ${SKILL_LABELS[skill]} +${finalGain.toFixed(1)}`
      : `Training session: ${SKILL_LABELS[skill]} +${finalGain.toFixed(1)}`,
    newValue,
    capped,
  };
}

export function canTrain(player: Player, skill: SkillCategory, sessionsToday: number): { allowed: boolean; reason?: string } {
  if (sessionsToday >= ALLOWED_SESSIONS_PER_DAY) {
    return { allowed: false, reason: 'Daily training limit reached.' };
  }
  const stat = SKILL_STAT_MAP[skill];
  if (player.stats[stat] >= 100) {
    return { allowed: false, reason: `${SKILL_LABELS[skill]} stat is already at maximum.` };
  }
  return { allowed: true };
}

export function shouldResetDaily(lastDate: string, currentDate: string): boolean {
  return lastDate !== currentDate;
}

export function formatTrainingSummary(sessions: TrainingOutcome[]): string {
  if (sessions.length === 0) return 'No training sessions today.';
  const lines = sessions.map((s, i) =>
    `${i + 1}. ${s.description} (${s.stat}: ${s.newValue.toFixed(1)})${s.capped ? ' [MAX]' : ''}`,
  );
  return `Training Summary (${sessions.length} session${sessions.length !== 1 ? 's' : ''}):\n${lines.join('\n')}`;
}
