import { describe, it, expect, beforeEach } from 'vitest';
import guardrails, { evaluateGuardrails, getLevel, resetHysteresis } from './guardrails';

describe('Guardrails', () => {
  beforeEach(() => {
    resetHysteresis();
  });

  it('should start at level 0', () => {
    expect(getLevel()).toBe(0);
  });

  it('should not change level on single reading', () => {
    const state = { spoons: 5, careScore: 1, qFactor: 0.7, activeMinutes: 60 };
    guardrails.updateLevel(state);
    expect(getLevel()).toBe(0);
  });

  it('should change level after 3 consecutive readings', () => {
    const stateLow = { spoons: 5, careScore: 1, qFactor: 0.7, activeMinutes: 60 };
    const stateHigh = { spoons: 5, careScore: 1, qFactor: 0.9, activeMinutes: 60 };

    guardrails.updateLevel(stateLow);
    expect(getLevel()).toBe(0);

    guardrails.updateLevel(stateLow);
    expect(getLevel()).toBe(0);

    guardrails.updateLevel(stateLow);
    expect(getLevel()).toBe(1);

    guardrails.updateLevel(stateHigh);
    guardrails.updateLevel(stateHigh);
    guardrails.updateLevel(stateHigh);
    expect(getLevel()).toBe(0);
  });

  it('should force level 4 on low spoons', () => {
    const stateLowSpoons = { spoons: 1, careScore: 1, qFactor: 0.9, activeMinutes: 60 };
    guardrails.updateLevel(stateLowSpoons);
    guardrails.updateLevel(stateLowSpoons);
    guardrails.updateLevel(stateLowSpoons);
    expect(getLevel()).toBe(4);
  });

  it('should evaluate guardrails correctly at level 0', () => {
    const params = { safetyLevel: 3, priority: 5, baseDelayMs: 0 };
    const stateGood = { spoons: 5, careScore: 1, qFactor: 0.9, activeMinutes: 60 };
    const evalGoodResult = evaluateGuardrails(params, stateGood);
    expect(evalGoodResult.approved).toBe(true);
  });

  it('should evaluate guardrails correctly at level 4', () => {
    const params = { safetyLevel: 3, priority: 5, baseDelayMs: 0 };
    const stateBad = { spoons: 1, careScore: 1, qFactor: 0.1, activeMinutes: 60 };
    guardrails.updateLevel(stateBad);
    guardrails.updateLevel(stateBad);
    guardrails.updateLevel(stateBad);
    const evalBadResult = evaluateGuardrails(params, stateBad);
    expect(evalBadResult.approved).toBe(false);
  });

  it('should handle mid-action spoon drop', () => {
    const stateGood = { spoons: 5, careScore: 1, qFactor: 0.9, activeMinutes: 60 };
    guardrails.updateLevel(stateGood);
    guardrails.updateLevel(stateGood);
    guardrails.updateLevel(stateGood);

    const params = { safetyLevel: 1, priority: 5, baseDelayMs: 0 };
    let evalResult = evaluateGuardrails(params, stateGood);
    expect(evalResult.approved).toBe(true);

    const stateBad = { spoons: 1, careScore: 1, qFactor: 0.7, activeMinutes: 60 };
    guardrails.updateLevel(stateBad);
    guardrails.updateLevel(stateBad);
    guardrails.updateLevel(stateBad);

    evalResult = evaluateGuardrails(params, stateBad);
    expect(evalResult.approved).toBe(false);
  });
});
