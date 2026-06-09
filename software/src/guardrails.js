/**
 * P31 Orchestrator Guardrails
 * Safety-critical throttle control based on spoons economy
 *
 * Safety Levels:
 *   LEVEL_0 (spoons >= 8): Full automation
 *   LEVEL_1 (spoons 5-7): Standard operation
 *   LEVEL_2 (spoons 3-4): Reduced automation
 *   LEVEL_3 (spoons 1-2): Minimal operations only
 *   LEVEL_4 (spoons = 0):  Emergency halt
 */

export const SAFETY_LEVELS = {
  LEVEL_0: 0, // Full automation (spoons >= 8)
  LEVEL_1: 1, // Standard (spoons 5-7)
  LEVEL_2: 2, // Reduced (spoons 3-4)
  LEVEL_3: 3, // Minimal (spoons 1-2)
  LEVEL_4: 4, // Emergency halt (spoons = 0)
};

export const LEVEL_THRESHOLDS = [8, 5, 3, 1, 0];

/**
 * Get current safety level from spoons count (single reading)
 * Use calculateCurrentLevel for hysteresis-aware transitions
 */
export function getCurrentSafetyLevel(spoons) {
  if (spoons >= 8) return SAFETY_LEVELS.LEVEL_0;
  if (spoons >= 5) return SAFETY_LEVELS.LEVEL_1;
  if (spoons >= 3) return SAFETY_LEVELS.LEVEL_2;
  if (spoons >= 1) return SAFETY_LEVELS.LEVEL_3;
  return SAFETY_LEVELS.LEVEL_4;
}

/**
 * Calculate throttle interval multiplier from safety level
 */
export function throttleFrequency(baseInterval, safetyLevel) {
  const multipliers = [1, 1.5, 3, 10, Infinity];
  return baseInterval * multipliers[safetyLevel];
}

/**
 * Check if an action is permitted at a given safety level
 * Returns true if action's risk score is within the level's limit
 *
 * Safety margins:
 * - Level 0 (full): up to risk 10
 * - Level 1 (standard): up to risk 4
 * - Level 2 (reduced): up to risk 4
 * - Level 3 (minimal): up to risk 1
 * - Level 4 (halt): 0
 */
export function isActionPermitted(actionRiskScore, safetyLevel) {
  const maxRiskPerLevel = [10, 4, 4, 1, 0];
  return actionRiskScore <= maxRiskPerLevel[safetyLevel];
}

/**
 * Hysteresis-aware level calculation
 *
 * @param spoons - current spoon count
 * @param currentLevel - currently active guardrail level
 * @param hysteresisState - { pendingLevel: number | null, count: number }
 * @param requiredConsecutive - how many consistent readings before transition (default 2)
 * @returns { level: number, pendingLevel: number | null, hysteresisCount: number, changed: boolean }
 *
 * Guarantees: spoons must be consistently in a new zone for 2 readings before guardrail shifts.
 * Prevents oscillation around threshold boundaries.
 */
export function calculateCurrentLevel(
  spoons,
  currentLevel,
  hysteresisState = { pendingLevel: null, count: 0 },
  requiredConsecutive = 3 // Increased from 2 to 3 for better hysteresis
) {
  const targetLevel = getCurrentSafetyLevel(spoons);

  // If target matches current, clear pending and maintain
  if (targetLevel === currentLevel) {
    return {
      level: currentLevel,
      pendingLevel: null,
      hysteresisCount: 0,
      changed: false
    };
  }

  // Target differs from current - manage pending state
  const { pendingLevel, count } = hysteresisState;

  if (pendingLevel === targetLevel) {
    // Consistent reading toward same target level
    const newCount = count + 1;
    const changed = newCount >= requiredConsecutive;
    return {
      level: changed ? targetLevel : currentLevel,
      pendingLevel: targetLevel,
      hysteresisCount: newCount,
      changed
    };
  } else {
    // New target direction - reset counter
    return {
      level: currentLevel,
      pendingLevel: targetLevel,
      hysteresisCount: 1,
      changed: false
    };
  }
}

/**
 * Full guardrail evaluation for an action
 * Combines spoons level, action risk, and system state
 */
export function evaluateGuardrails(action, systemState) {
  const { safetyLevel: requestedLevel, priority, baseDelayMs } = action;
  const { spoons, careScore, qFactor, activeMinutes } = systemState;

  const currentLevel = getCurrentSafetyLevel(spoons);

  // Priority 10 always allowed (critical path)
  if (priority === 10) {
    return {
      approved: true,
      delayMs: baseDelayMs,
      requiresManual: false,
      reason: 'Critical priority bypass'
    };
  }

  // Level 4 (0 spoons) - everything blocked except priority 10
  if (currentLevel === 4) {
    return {
      approved: false,
      delayMs: Infinity,
      requiresManual: true,
      reason: 'CLINICAL_HALT: spoons depleted'
    };
  }

  // Check if action's requested safety level is permitted at current level
  if (!isActionPermitted(requestedLevel, currentLevel)) {
    return {
      approved: false,
      delayMs: Infinity,
      requiresManual: true,
      reason: `Action risk ${requestedLevel} exceeds guardrail limit ${currentLevel}`
    };
  }

  // Calculate adaptive delay based on spoons and care score
  let multiplier = 1;
  if (currentLevel === 2) multiplier = 2;
  if (currentLevel === 3) multiplier = 5;

  // Q-Factor boost: if family mesh coherence is high, reduce delay
  const qBoost = 1 - (qFactor * 0.3);
  multiplier *= qBoost;

  const delayMs = Math.min(3600000, baseDelayMs * multiplier);

  // Level 3 (minimal): non-critical actions require manual approval
  const requiresManual = currentLevel >= 3 && priority < 8;

  return {
    approved: true,
    delayMs: Math.round(delayMs),
    requiresManual,
    reason: `Guardrail level ${currentLevel}, multiplier ${multiplier.toFixed(2)}`
  };
}

/**
 * Determine if fawn guard (emergency throttle) is active
 */
export function isFawnGuardActive(guardrailLevel) {
  return guardrailLevel >= 3;
}

/**
 * Risk score calculation for actions (0-10 scale)
 * Used by action handlers to self-assess
 */
export function calculateActionRisk(actionType, payload) {
  const riskMap = {
    'social:publish': 3,
    'forge:generate_document': 4,
    'grant:scan': 2,
    'grant:new_match': 5,
    'k4:presence_update': 2,
    'legal:court_deadline': 8,
    'health:calcium_alert': 1,
    'system:throttle_all': 0
  };

  return riskMap[actionType] || 5; // default medium risk
}

/**
 * Event publishing helpers for spoons updates
 */
export function createSpoonsUpdateEvent(userId, spoons, previousSpoons) {
  return {
    type: 'spoons:update',
    userId,
    spoons,
    previousSpoons,
    change: spoons - previousSpoons,
    timestamp: Date.now(),
    level: getCurrentSafetyLevel(spoons)
  };
}

export function createGuardrailsLevelChangedEvent(level, spoons, intervals) {
  return {
    type: 'guardrails:levelChanged',
    level,
    spoons,
    intervals,
    timestamp: Date.now()
  };
}

