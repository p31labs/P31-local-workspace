const STATIC_RISK_MAP = {
  emergency: 1,
  critical: 8,
  high: 4,
  medium: 2,
  low: 0,
};

const REQUIRED_CONSECUTIVE = 3;

let consecutiveSameLevel = 0;
let lastTargetLevel = null;

function calculateActionRisk(action) {
  const severity = (action.severity || 'low').toLowerCase();
  const score = STATIC_RISK_MAP[severity];
  return {
    actionRiskScore: score,
    severity,
    timestamp: Date.now(),
  };
}

function calculateCurrentLevel(spoons, qFactor) {
  const metric = typeof qFactor === 'number' ? qFactor : (spoons && spoons > 0 ? (1 - spoons / 20) : 0.5);
  if (metric >= 0.8) return 0;
  if (metric >= 0.6) return 1;
  if (metric >= 0.4) return 2;
  if (metric >= 0.2) return 3;
  return 4;
}

export function evaluateGuardrails(action, spoons, qFactor) {
  const targetLevel = calculateCurrentLevel(spoons, qFactor);

  if (spoons < 2) {
    consecutiveSameLevel = 0;
    lastTargetLevel = null;
    return {
      ...calculateActionRisk(action),
      spoons, qFactor, safetyLevel: 4,
      approved: false,
      requiresManual: true,
      reason: 'Insufficient spoons (<2) — emergency halt',
    };
  }

  if (targetLevel === lastTargetLevel) {
    consecutiveSameLevel++;
  } else {
    consecutiveSameLevel = 1;
    lastTargetLevel = targetLevel;
  }

  const currentLevel = (consecutiveSameLevel >= REQUIRED_CONSECUTIVE) ? targetLevel : (lastTargetLevel !== null ? lastTargetLevel : 0);

  const risk = calculateActionRisk(action);
  const maxAllowed = 4 - currentLevel;
  const approved = risk.actionRiskScore <= maxAllowed;

  return {
    ...risk,
    spoons, qFactor, safetyLevel: currentLevel,
    approved,
    requiresManual: !approved,
    reason: approved ? 'guardrails passed' : `level ${currentLevel}: risk ${risk.actionRiskScore} > max ${maxAllowed}`,
  };
}

export function getLevel() {
  return lastTargetLevel !== null ? lastTargetLevel : 0;
}

export function resetHysteresis() {
  consecutiveSameLevel = 0;
  lastTargetLevel = null;
}

// Default export as a namespace object that includes all named exports
const guardrails = { evaluateGuardrails, getLevel, resetHysteresis };
guardrails.evaluateGuardrails = evaluateGuardrails;
guardrails.getLevel = getLevel;
guardrails.resetHysteresis = resetHysteresis;

export default guardrails;
