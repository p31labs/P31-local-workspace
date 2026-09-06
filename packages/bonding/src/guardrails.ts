// Guardrails for bonding app actions
// Levels: 0=100%, 1=90%, 2=70%, 3=30%, 4=0% automation
// Hysteresis: 3 consecutive readings to change level

export interface GuardrailParams {
  safetyLevel: number;
  priority: number;
  baseDelayMs: number;
}

export interface SystemState {
  spoons: number;
  careScore: number;
  qFactor: number;
  activeMinutes: number;
}

export interface GuardrailEvaluation {
  approved: boolean;
  reason?: string;
}

export class Guardrails {
  private currentLevel: number = 0;
  private consecutiveReadings: number = 0;
  private lastReadingDirection: 'up' | 'down' | null = null;
  private lastTargetLevel: number | null = null;

  // Thresholds for level changes based on qFactor (lower qFactor = higher level)
  private qFactorThresholds = [0.8, 0.6, 0.4, 0.2]; // level 1 if <0.8, level 2 <0.6, etc.
  private readonly REQUIRED_CONSECUTIVE = 3;

  public updateLevel(systemState: SystemState) {
    // Determine target level based on qFactor
    let targetLevel = 0;
    for (let i = 0; i < this.qFactorThresholds.length; i++) {
      if (systemState.qFactor < this.qFactorThresholds[i]) {
        targetLevel = i + 1;
      } else {
        break;
      }
    }
    targetLevel = Math.min(4, targetLevel);

    // Override for extreme spoon counts: if spoons < 2, force level 4
    if (systemState.spoons < 2) {
      targetLevel = 4;
    }

    this.lastTargetLevel = targetLevel;

    const direction = targetLevel > this.currentLevel ? 'up' : targetLevel < this.currentLevel ? 'down' : null;

    // Hysteresis: only change level after REQUIRED_CONSECUTIVE matching readings
    if (targetLevel === this.currentLevel) {
      this.consecutiveReadings = 0;
      this.lastReadingDirection = null;
    } else if (direction === this.lastReadingDirection) {
      this.consecutiveReadings++;
      if (this.consecutiveReadings >= this.REQUIRED_CONSECUTIVE) {
        this.currentLevel = targetLevel;
        this.consecutiveReadings = 0;
        this.lastReadingDirection = null;
        this.lastTargetLevel = null;
      }
    } else {
      this.consecutiveReadings = 1;
      this.lastReadingDirection = direction;
    }
  }

  public evaluateGuardrails(params: GuardrailParams, systemState: SystemState): GuardrailEvaluation {
    // Update level first
    this.updateLevel(systemState);

    // Determine max allowed safetyLevel
    const maxSafetyLevel = 4 - this.currentLevel; // level 0: allow up to 4, level 4: allow up to 0

    if (params.safetyLevel > maxSafetyLevel) {
      return { approved: false, reason: `Guardrail level ${this.currentLevel}: safetyLevel ${params.safetyLevel} exceeds threshold` };
    }

    return { approved: true };
  }

  public checkGuardrail(actionType: string, payload: any): boolean {
    // For compatibility, but not used in action-registry
    const automationPercent = [1.0, 0.9, 0.7, 0.3, 0.0][this.currentLevel];
    return Math.random() < automationPercent;
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public resetHysteresis(): void {
    this.currentLevel = 0;
    this.consecutiveReadings = 0;
    this.lastReadingDirection = null;
    this.lastTargetLevel = null;
  }
}

// Singleton instance
const guardrails = new Guardrails();

// Export named functions that delegate to the singleton
export function evaluateGuardrails(params: GuardrailParams, systemState: SystemState): GuardrailEvaluation {
  return guardrails.evaluateGuardrails(params, systemState);
}

export function getLevel(): number {
  return guardrails.getCurrentLevel();
}

export function resetHysteresis(): void {
  guardrails.resetHysteresis();
}

// Default export as the guardrails instance
export default guardrails;
