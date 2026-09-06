// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Cognitive Load Engine tests
//
// Pure unit tests. No React.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  getLoadLevel,
  getUIAdaptation,
  inferLoadFromBehavior,
  getDefaultLoadForMode,
  clampLoad,
} from './cognitiveLoad';

describe('Cognitive Load Engine', () => {
  it('getLoadLevel 0 → crisis', () => expect(getLoadLevel(0)).toBe('crisis'));
  it('getLoadLevel 10 → crisis', () => expect(getLoadLevel(10)).toBe('crisis'));
  it('getLoadLevel 11 → low', () => expect(getLoadLevel(11)).toBe('low'));
  it('getLoadLevel 50 → medium', () => expect(getLoadLevel(50)).toBe('medium'));
  it('getLoadLevel 80 → high', () => expect(getLoadLevel(80)).toBe('high'));
  it('getLoadLevel 100 → full', () => expect(getLoadLevel(100)).toBe('full'));

  it('getUIAdaptation crisis hides everything', () => {
    const ui = getUIAdaptation(5);
    expect(ui.showFormula).toBe(false);
    expect(ui.showStability).toBe(false);
    expect(ui.showQuestHUD).toBe(false);
  });

  it('getUIAdaptation crisis shows crisisButton', () => {
    const ui = getUIAdaptation(5);
    expect(ui.crisisButton).toBe(true);
    expect(ui.buttonCount).toBe(1);
  });

  it('getUIAdaptation low hides formula', () => {
    const ui = getUIAdaptation(20);
    expect(ui.showFormula).toBe(false);
  });

  it('getUIAdaptation full shows everything', () => {
    const ui = getUIAdaptation(95);
    expect(ui.showFormula).toBe(true);
    expect(ui.showStability).toBe(true);
    expect(ui.showQuestHUD).toBe(true);
    expect(ui.crisisButton).toBe(false);
  });

  it('getUIAdaptation medium shows formula but not stability', () => {
    const ui = getUIAdaptation(50);
    expect(ui.showFormula).toBe(true);
    expect(ui.showStability).toBe(false);
  });

  const baselineMetrics = { timeSinceLastAction: 0, errorsInLastMinute: 0, sessionDuration: 0, timeOfDay: 12, moleculesCompleted: 0 };
  it('inferLoadFromBehavior baseline is ~70', () => {
    expect(inferLoadFromBehavior(baselineMetrics)).toBe(70);
  });

  it('inferLoadFromBehavior long pause drops score', () => {
    expect(inferLoadFromBehavior({ ...baselineMetrics, timeSinceLastAction: 70000 })).toBe(62);
    expect(inferLoadFromBehavior({ ...baselineMetrics, timeSinceLastAction: 130000 })).toBe(55);
  });
  
  it('inferLoadFromBehavior errors drop score significantly', () => {
    expect(inferLoadFromBehavior({ ...baselineMetrics, errorsInLastMinute: 2 })).toBe(50);
  });

  it('inferLoadFromBehavior late night drops score', () => {
    expect(inferLoadFromBehavior({ ...baselineMetrics, timeOfDay: 23 })).toBe(60);
    expect(inferLoadFromBehavior({ ...baselineMetrics, timeOfDay: 4 })).toBe(60);
  });

  it('inferLoadFromBehavior momentum boosts score', () => {
    expect(inferLoadFromBehavior({ ...baselineMetrics, moleculesCompleted: 4 })).toBe(80);
  });
  
  it('inferLoadFromBehavior never returns below 0', () => {
    const extremeMetrics = { timeSinceLastAction: 200000, errorsInLastMinute: 10, sessionDuration: 8000000, timeOfDay: 23, moleculesCompleted: 0 };
    expect(inferLoadFromBehavior(extremeMetrics)).toBe(0);
  });

  it('inferLoadFromBehavior never returns above 100', () => {
    const bestMetrics = { timeSinceLastAction: 0, errorsInLastMinute: 0, sessionDuration: 0, timeOfDay: 12, moleculesCompleted: 10 };
    expect(inferLoadFromBehavior(bestMetrics)).toBeLessThanOrEqual(100);
  });

  it('getDefaultLoadForMode seed → 40', () => {
    expect(getDefaultLoadForMode('seed')).toBe(40);
  });

  it('getDefaultLoadForMode sapling → 85', () => {
    expect(getDefaultLoadForMode('sapling')).toBe(85);
  });

  it('clampLoad handles negatives → 0', () => {
    expect(clampLoad(-10)).toBe(0);
  });

  it('clampLoad handles >100 → 100', () => {
    expect(clampLoad(110)).toBe(100);
  });
});
