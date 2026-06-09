/**
 * P31 Orchestrator Guardrails System
 * Adaptive cybernetic throttling tied to physiological spoon count
 * Unified mathematical specification: exponential time dilation + hysteresis
 */

export const S_MAX = 20
export const FRICTION_COEFFICIENT = 1.5
export const CARE_SCORE_MODIFIER = 0.3
export const EPSILON = 0.1
export const HYSTERESIS = 0.5
export const MAX_ACTIONS_PER_HOUR_BASE = 12
export const DEFENSIVE_CRITICAL_PRIORITY = 10
export const IMPLICIT_APPROVAL_MIN_SPOONS = 12
export const IMPLICIT_APPROVAL_MIN_Q_FACTOR = 0.85
export const IMPLICIT_APPROVAL_MIN_ACTIVE_MINUTES = 5

export const GUARDRAIL_LEVELS = Object.freeze([
  { 
    level: 4, 
    name: 'Full Autonomy',
    enterThreshold: 15, 
    exitThreshold: 14.5, 
    k: 1.0, 
    minPriority: 0,
    maxActionsPerHour: 12
  },
  { 
    level: 3, 
    name: 'Semi-Destructive Autonomy',
    enterThreshold: 10, 
    exitThreshold: 9.5, 
    k: 0.75, 
    minPriority: 2,
    maxActionsPerHour: 9
  },
  { 
    level: 2, 
    name: 'Non-Destructive Autonomy',
    enterThreshold: 5, 
    exitThreshold: 4.5, 
    k: 0.5, 
    minPriority: 4,
    maxActionsPerHour: 6
  },
  { 
    level: 1, 
    name: 'Notifications Only',
    enterThreshold: 2, 
    exitThreshold: 1.5, 
    k: 0.25, 
    minPriority: 7,
    maxActionsPerHour: 3
  },
  { 
    level: 0, 
    name: 'Fawn Guard / Manual Only',
    enterThreshold: -Infinity, 
    exitThreshold: 2.5, 
    k: 0, 
    minPriority: 10,
    maxActionsPerHour: 1
  }
])

/**
 * Calculate current guardrail level with hysteresis to prevent flapping
 * @param {number} currentSpoons - Current spoon count [0, 20]
 * @param {number} previousLevel - Current active guardrail level
 * @returns {number} New guardrail level
 */
export function calculateCurrentLevel(currentSpoons, previousLevel = 4) {
  if (currentSpoons < 0 || currentSpoons > S_MAX) {
    throw new Error(`Invalid spoon count ${currentSpoons}. Must be between 0 and ${S_MAX}`)
  }

  const currentConfig = GUARDRAIL_LEVELS.find(l => l.level === previousLevel)
  
  // Downward transition check
  if (currentSpoons < currentConfig.exitThreshold) {
    const newLevel = GUARDRAIL_LEVELS.find(l => currentSpoons >= l.exitThreshold)?.level || 0
    return newLevel
  }
  
  // Upward transition check with hysteresis
  if (currentSpoons > currentConfig.enterThreshold + HYSTERESIS) {
    const newLevel = GUARDRAIL_LEVELS.find(l => currentSpoons >= l.enterThreshold)?.level || previousLevel
    return newLevel
  }
  
  // No transition
  return previousLevel
}

/**
 * Full cybernetic guardrail evaluation for any action
 * Implements exponential time dilation + safety gating + emergency bypass
 * @param {Object} action - Action to evaluate
 * @param {number} action.safetyLevel - Required safety level [0-4]
 * @param {number} action.priority - Action priority [1-10]
 * @param {number} action.baseDelayMs - Base execution interval in ms
 * @param {Object} currentState - Current system state
 * @param {number} currentState.spoons - Current spoon count
 * @returns {Object} Evaluation result
 */
export function evaluateGuardrails(action, currentState) {
  const spoons = currentState.spoons
  const { safetyLevel, priority, baseDelayMs } = action
  
  // Extract mesh state variables
  const careScore = currentState.careScore || 0.5
  const qFactor = currentState.qFactor || 0.0
  const activeMinutes = currentState.activeMinutes || 0

  // 1. Emergency bypass for critical actions
  if (priority === DEFENSIVE_CRITICAL_PRIORITY) {
    return { 
      approved: true, 
      delayMs: 0, 
      requiresManual: false,
      reason: 'Emergency critical action - bypasses all throttling'
    }
  }

  // 2. Calculate current maximum allowable safety level
  let lMax = 4
  if (spoons <= 2) lMax = 0
  else if (spoons <= 5) lMax = 1
  else if (spoons <= 10) lMax = 2
  else if (spoons <= 15) lMax = 3

  // 3. Safety level gate check with implicit approval
  let requiresManual = safetyLevel > lMax

  // Implicit approval override for Level 3 actions
  if (safetyLevel === 3 && 
      spoons >= IMPLICIT_APPROVAL_MIN_SPOONS && 
      qFactor >= IMPLICIT_APPROVAL_MIN_Q_FACTOR &&
      activeMinutes >= IMPLICIT_APPROVAL_MIN_ACTIVE_MINUTES) {
    requiresManual = false
    lMax = Math.max(lMax, 3)
  }

  if (requiresManual) {
    return { 
      approved: false, 
      delayMs: 0, 
      requiresManual: true,
      reason: `Action Level ${safetyLevel} exceeds current capacity (Max: ${lMax})`
    }
  }

  // 4. Exponential time dilation calculation with care score modification
  const depletionRatio = (S_MAX - spoons) / (spoons + EPSILON)
  const adjustedFriction = FRICTION_COEFFICIENT * (1 - (careScore * CARE_SCORE_MODIFIER))
  const dilationFactor = Math.exp(adjustedFriction * depletionRatio)
  const executionDelay = baseDelayMs * dilationFactor * (1 / priority)

  return {
    approved: true,
    delayMs: Math.round(executionDelay),
    requiresManual: false,
    dilationFactor: dilationFactor.toFixed(2),
    adjustedFriction: adjustedFriction.toFixed(3),
    careScore: careScore,
    reason: `Approved with ${Math.round(executionDelay/60000)} minute delay`
  }
}

/**
 * Get throttled execution interval for a given level
 * @param {number} baseInterval - Base interval in milliseconds
 * @param {number} level - Current guardrail level
 * @returns {number} Throttled interval
 */
export function getThrottledInterval(baseInterval, level) {
  const config = GUARDRAIL_LEVELS.find(l => l.level === level)
  return config.k === 0 ? Infinity : baseInterval / config.k
}

/**
 * Check if an action is allowed at the current level
 * @param {number} actionPriority - Action priority [0, 10]
 * @param {number} level - Current guardrail level
 * @returns {boolean} True if action is allowed
 */
export function isActionAllowed(actionPriority, level) {
  const config = GUARDRAIL_LEVELS.find(l => l.level === level)
  return actionPriority >= config.minPriority
}

/**
 * Get maximum allowed actions per hour for current level
 * @param {number} level - Current guardrail level
 * @returns {number} Maximum actions per hour
 */
export function getAllowedActionsPerHour(level) {
  const config = GUARDRAIL_LEVELS.find(l => l.level === level)
  return config.maxActionsPerHour
}

/**
 * Check if Fawn Guard mode is active
 * @param {number} level - Current guardrail level
 * @returns {boolean} True if in Fawn Guard
 */
export function isFawnGuardActive(level) {
  return level === 0
}

/**
 * Get level configuration
 * @param {number} level - Guardrail level
 * @returns {Object} Level configuration
 */
export function getLevelConfig(level) {
  return GUARDRAIL_LEVELS.find(l => l.level === level)
}

export default {
  calculateCurrentLevel,
  evaluateGuardrails,
  getThrottledInterval,
  isActionAllowed,
  getAllowedActionsPerHour,
  isFawnGuardActive,
  getLevelConfig,
  GUARDRAIL_LEVELS,
  S_MAX,
  FRICTION_COEFFICIENT,
  EPSILON,
  HYSTERESIS,
  MAX_ACTIONS_PER_HOUR_BASE,
  DEFENSIVE_CRITICAL_PRIORITY
}
