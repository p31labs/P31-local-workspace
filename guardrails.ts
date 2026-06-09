/**
 * P31 Orchestrator Guardrails System
 * 5-level protection with hysteresis (2 consecutive readings to change)
 * Integrated with action-registry for safety gating
 */

import { GUARDRAIL_LEVELS } from './guardrails.js';

export interface GuardrailState {
  currentLevel: number;
  consecutiveReadings: number;
  lastSpoonCount: number;
}

const DEFAULT_STATE: GuardrailState = {
  currentLevel: 4,
  consecutiveReadings: 1,
  lastSpoonCount: 20,
};

/**
 * Check and update guardrail level with hysteresis
 * Requires 2 consecutive readings to change levels
 * @param spoonCount Current spoon count [0, 20]
 * @param state Current guardrail state (optional, uses DEFAULT_STATE if not provided)
 * @returns Updated guardrail state
 */
export function checkGuardrail(spoonCount: number, state: GuardrailState = { ...DEFAULT_STATE }): GuardrailState {
  if (spoonCount < 0 || spoonCount > 20) {
    throw new Error(`Invalid spoon count ${spoonCount}. Must be between 0 and 20`);
  }

  const currentConfig = GUARDRAIL_LEVELS.find(l => l.level === state.currentLevel)!;
  
  // Determine target level based on spoon count
  let targetLevel = state.currentLevel;
  
  // Downward transition check
  if (spoonCount < currentConfig.exitThreshold) {
    const newLevel = GUARDRAIL_LEVELS.find(l => spoonCount >= l.exitThreshold)?.level || 0;
    targetLevel = newLevel;
  }
  // Upward transition check with hysteresis
  else if (spoonCount > currentConfig.enterThreshold + 2) {
    const newLevel = GUARDRAIL_LEVELS.find(l => spoonCount >= l.enterThreshold)?.level || state.currentLevel;
    targetLevel = newLevel;
  }
  // No transition
  else {
    targetLevel = state.currentLevel;
  }

  // Apply hysteresis: require 2 consecutive readings to change
  if (targetLevel !== state.currentLevel) {
    if (state.consecutiveReadings >= 2) {
      return {
        currentLevel: targetLevel,
        consecutiveReadings: 1,
        lastSpoonCount: spoonCount,
      };
    } else {
      return {
        ...state,
        consecutiveReadings: state.consecutiveReadings + 1,
        lastSpoonCount: spoonCount,
      };
    }
  } else {
    // Same level, reset consecutive counter
    return {
      ...state,
      consecutiveReadings: 1,
      lastSpoonCount: spoonCount,
    };
  }
}

/**
 * Get the configuration for a specific guardrail level
 * @param level Guardrail level (0-4)
 * @returns Level configuration
 */
export function getLevelConfig(level: number): typeof GUARDRAIL_LEVELS[number] {
  const config = GUARDRAIL_LEVELS.find(l => l.level === level);
  if (!config) {
    throw new Error(`Invalid guardrail level ${level}. Must be between 0 and 4`);
  }
  return config;
}

/**
 * Check if an action is allowed at the current guardrail level
 * @param actionPriority Action priority [0, 10]
 * @param level Current guardrail level
 * @returns True if action is allowed
 */
export function isActionAllowed(actionPriority: number, level: number): boolean {
  const config = getLevelConfig(level);
  return actionPriority >= config.minPriority;
}

/**
 * Get maximum allowed actions per hour for current level
 * @param level Current guardrail level
 * @returns Maximum actions per hour
 */
export function getAllowedActionsPerHour(level: number): number {
  const config = getLevelConfig(level);
  return config.maxActionsPerHour;
}

/**
 * Check if Fawn Guard mode is active
 * @param level Current guardrail level
 * @returns True if in Fawn Guard (level 0)
 */
export function isFawnGuardActive(level: number): boolean {
  return level === 0;
}

/**
 * Full guardrail evaluation for any action
 * @param action Action to evaluate
 * @param currentState Current system state
 * @returns Evaluation result
 */
export function evaluateGuardrails(action: {
  safetyLevel: number;
  priority: number;
  baseDelayMs: number;
}, currentState: {
  spoons: number;
  careScore?: number;
  qFactor?: number;
  activeMinutes?: number;
}): { approved: boolean; delayMs: number; requiresManual: boolean; reason: string } {
  const spoons = currentState.spoons;
  const { safetyLevel, priority, baseDelayMs } = action;
  
  // Extract mesh state variables
  const careScore = currentState.careScore ?? 0.5;
  const qFactor = currentState.qFactor ?? 0.0;
  const activeMinutes = currentState.activeMinutes ?? 0;

  // 1. Emergency bypass for critical actions
  if (priority === 10) {
    return { 
      approved: true, 
      delayMs: 0, 
      requiresManual: false,
      reason: 'Emergency critical action - bypasses all throttling'
    };
  }

  // 2. Calculate current maximum allowable safety level
  let lMax = 4;
  if (spoons <= 2) lMax = 0;
  else if (spoons <= 5) lMax = 1;
  else if (spoons <= 10) lMax = 2;
  else if (spoons <= 15) lMax = 3;

  // 3. Safety level gate check with implicit approval
  let requiresManual = safetyLevel > lMax;

  // Implicit approval override for Level 3 actions
  if (safetyLevel === 3 && 
      spoons >= 12 && 
      qFactor >= 0.85 &&
      activeMinutes >= 5) {
    requiresManual = false;
    lMax = Math.max(lMax, 3);
  }

  if (requiresManual) {
    return { 
      approved: false, 
      delayMs: 0, 
      requiresManual: true,
      reason: `Action Level ${safetyLevel} exceeds current capacity (Max: ${lMax})`
    };
  }

  // 4. Exponential time dilation calculation with care score modification
  const depletionRatio = (20 - spoons) / (spoons + 0.1);
  const adjustedFriction = 1.5 * (1 - (careScore * 0.3));
  const dilationFactor = Math.exp(adjustedFriction * depletionRatio);
  const executionDelay = baseDelayMs * dilationFactor * (1 / priority);

  return {
    approved: true,
    delayMs: Math.round(executionDelay),
    requiresManual: false,
    dilationFactor: dilationFactor.toFixed(2),
    adjustedFriction: adjustedFriction.toFixed(3),
    careScore: careScore,
    reason: `Approved with ${Math.round(executionDelay/60000)} minute delay`
  };
}