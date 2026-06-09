// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// New quest chains tests
//
// Pure unit tests. No React. No game imports.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import { NEW_QUESTS, NEW_CHECKPOINTS } from './newQuests';

describe('New Quest Chains', () => {
  const forgeQuest = NEW_QUESTS.find(q => q.id === 'the_forge');
  const labQuest = NEW_QUESTS.find(q => q.id === 'the_lab');

  it('The Forge has 4 steps', () => {
    expect(forgeQuest?.steps).toHaveLength(4);
  });

  it('The Lab has 5 steps', () => {
    expect(labQuest?.steps).toHaveLength(5);
  });

  it('The Forge is sapling mode', () => {
    expect(forgeQuest?.mode).toBe('sapling');
  });

  it('The Lab is sapling mode', () => {
    expect(labQuest?.mode).toBe('sapling');
  });

  it('All quest step targets are valid Hill formulas', () => {
    const allSteps = [...(forgeQuest?.steps ?? []), ...(labQuest?.steps ?? [])];
    const formulaRegex = /^[A-Z][a-z]?\d*([A-Z][a-z]?\d*)*$/;
    for (const step of allSteps) {
      // A simple regex to check if it looks like a formula.
      // This isn't a full validation but checks for the basic structure.
      expect(step.target).toMatch(formulaRegex);
    }
  });

  it('The Forge reward is 100 LOVE', () => {
    expect(forgeQuest?.reward).toBe(100);
  });

  it('The Lab reward is 125 LOVE', () => {
    expect(labQuest?.reward).toBe(125);
  });

  it('NEW_CHECKPOINTS includes FeO', () => {
    const feo = NEW_CHECKPOINTS.find(c => c.formula === 'FeO');
    expect(feo).toBeDefined();
    expect(feo?.displayName).toBe('Wüstite');
    expect(feo?.displayFormula).toBe('FeO');
    expect(feo?.elements).toEqual({ Fe: 1, O: 1 });
  });

  it('Each step has target, hint, and narrative', () => {
    const allSteps = [...(forgeQuest?.steps ?? []), ...(labQuest?.steps ?? [])];
    for (const step of allSteps) {
      expect(typeof step.target).toBe('string');
      expect(typeof step.hint).toBe('string');
      expect(typeof step.narrative).toBe('string');
      expect(step.target.length).toBeGreaterThan(0);
      expect(step.hint.length).toBeGreaterThan(0);
      expect(step.narrative.length).toBeGreaterThan(0);
    }
  });
});
