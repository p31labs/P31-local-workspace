// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Cognitive Load Engine
//
// Manages UI density and complexity based on a 0-100 load value.
// ═══════════════════════════════════════════════════════

export type LoadLevel = 'crisis' | 'low' | 'medium' | 'high' | 'full';

export interface CognitiveLoadState {
  value: number;
  level: LoadLevel;
  autoDetected: boolean;
}

export interface UIAdaptation {
  showFormula: boolean;
  showStability: boolean;
  showAtomCount: boolean;
  showLoveCounter: boolean;
  showQuestHUD: boolean;
  showFunFacts: boolean;
  showPersonality: boolean;
  showAchievementDetail: boolean;
  showElementLabels: boolean;
  showPingLog: boolean;
  maxVisibleToasts: number;
  elementSize: number;
  fontSize: number;
  animationSpeed: number;
  buttonCount: number;
  crisisButton: boolean;
}

export function getLoadLevel(value: number): LoadLevel {
  const v = clampLoad(value);
  if (v <= 10) return 'crisis';
  if (v <= 30) return 'low';
  if (v <= 60) return 'medium';
  if (v <= 85) return 'high';
  return 'full';
}

export function getUIAdaptation(value: number): UIAdaptation {
  const level = getLoadLevel(value);
  switch (level) {
    case 'crisis':
      return { showFormula: false, showStability: false, showAtomCount: false, showLoveCounter: false, showQuestHUD: false, showFunFacts: false, showPersonality: false, showAchievementDetail: false, showElementLabels: false, showPingLog: false, maxVisibleToasts: 1, elementSize: 40, fontSize: 18, animationSpeed: 0.5, buttonCount: 1, crisisButton: true };
    case 'low':
      return { showFormula: false, showStability: false, showAtomCount: true, showLoveCounter: true, showQuestHUD: false, showFunFacts: false, showPersonality: false, showAchievementDetail: false, showElementLabels: false, showPingLog: false, maxVisibleToasts: 2, elementSize: 48, fontSize: 16, animationSpeed: 0.7, buttonCount: 2, crisisButton: false };
    case 'medium':
      return { showFormula: true, showStability: false, showAtomCount: true, showLoveCounter: true, showQuestHUD: true, showFunFacts: false, showPersonality: false, showAchievementDetail: false, showElementLabels: true, showPingLog: true, maxVisibleToasts: 3, elementSize: 52, fontSize: 14, animationSpeed: 1.0, buttonCount: 4, crisisButton: false };
    case 'high':
      return { showFormula: true, showStability: true, showAtomCount: true, showLoveCounter: true, showQuestHUD: true, showFunFacts: true, showPersonality: true, showAchievementDetail: true, showElementLabels: true, showPingLog: true, maxVisibleToasts: 4, elementSize: 56, fontSize: 12, animationSpeed: 1.0, buttonCount: 6, crisisButton: false };
    case 'full':
      return { showFormula: true, showStability: true, showAtomCount: true, showLoveCounter: true, showQuestHUD: true, showFunFacts: true, showPersonality: true, showAchievementDetail: true, showElementLabels: true, showPingLog: true, maxVisibleToasts: 5, elementSize: 64, fontSize: 12, animationSpeed: 1.0, buttonCount: 6, crisisButton: false };
  }
}

export function inferLoadFromBehavior(metrics: {
  timeSinceLastAction: number;
  errorsInLastMinute: number;
  sessionDuration: number;
  timeOfDay: number;
  moleculesCompleted: number;
}): number {
  let score = 70;
  if (metrics.timeSinceLastAction > 120000) score -= 15;
  else if (metrics.timeSinceLastAction > 60000) score -= 8;
  score -= metrics.errorsInLastMinute * 10;
  if (metrics.sessionDuration > 3600000) score -= 20;
  else if (metrics.sessionDuration > 1800000) score -= 10;
  if (metrics.timeOfDay >= 22 || metrics.timeOfDay <= 5) score -= 10;
  if (metrics.moleculesCompleted >= 3) score += 10;
  return clampLoad(score);
}

export function getDefaultLoadForMode(mode: string): number {
  switch (mode) {
    case 'seed': return 40;
    case 'sprout': return 65;
    case 'sapling': return 85;
    default: return 65;
  }
}

export function clampLoad(value: number): number {
  return Math.max(0, Math.min(100, value));
}
