// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Tutorial Engine tests
//
// Pure unit tests. No React. No game imports.
// Uses Vitest.
// ═══════════════════════════════════════════════════════

import { describe, it, expect } from 'vitest';
import {
  getTutorial,
  getFirstTimeTutorial,
  initTutorialState,
  getCurrentStep,
  checkStepComplete,
  advanceStep,
  isTutorialComplete,
  shouldShowTutorial,
  WILLOW_TUTORIAL,
  BASH_TUTORIAL,
} from './tutorial';
import type { TutorialState, TutorialStep } from './tutorial';

describe('Tutorial Engine', () => {
  it('getTutorial("seed") returns WILLOW_TUTORIAL', () => {
    expect(getTutorial('seed')).toBe(WILLOW_TUTORIAL);
  });

  it('getTutorial("sprout") returns BASH_TUTORIAL', () => {
    expect(getTutorial('sprout')).toBe(BASH_TUTORIAL);
  });

  it('getTutorial("sapling") returns null (no tutorial for advanced)', () => {
    expect(getTutorial('sapling')).toBeNull();
  });

  it('getFirstTimeTutorial returns WILLOW_TUTORIAL', () => {
    expect(getFirstTimeTutorial()).toBe(WILLOW_TUTORIAL);
  });

  it('initTutorialState sets step 0, active true, completed false', () => {
    const state = initTutorialState('first_molecule');
    expect(state).toEqual({
      active: true,
      tutorialId: 'first_molecule',
      currentStep: 0,
      completed: false,
    });
  });

  it('getCurrentStep returns first step initially', () => {
    const state = initTutorialState(WILLOW_TUTORIAL.id);
    const step = getCurrentStep(WILLOW_TUTORIAL, state);
    expect(step).toBe(WILLOW_TUTORIAL.steps[0]);
  });

  it('getCurrentStep returns null when completed', () => {
    const state: TutorialState = {
      active: false,
      tutorialId: WILLOW_TUTORIAL.id,
      currentStep: WILLOW_TUTORIAL.steps.length,
      completed: true,
    };
    const step = getCurrentStep(WILLOW_TUTORIAL, state);
    expect(step).toBeNull();
  });

  it('checkStepComplete matches mode_selected condition', () => {
    const step = WILLOW_TUTORIAL.steps[1] as TutorialStep;
    const event = { type: 'mode_selected', mode: 'seed' };
    expect(checkStepComplete(step, event)).toBe(true);
    const wrongEvent = { type: 'mode_selected', mode: 'sprout' };
    expect(checkStepComplete(step, wrongEvent)).toBe(false);
  });

  it('checkStepComplete matches atom_placed with correct element', () => {
    const step = WILLOW_TUTORIAL.steps[2] as TutorialStep;
    const event = { type: 'atom_placed', element: 'H' };
    expect(checkStepComplete(step, event)).toBe(true);
  });

  it('checkStepComplete returns false for wrong element', () => {
    const step = WILLOW_TUTORIAL.steps[2] as TutorialStep;
    const event = { type: 'atom_placed', element: 'O' };
    expect(checkStepComplete(step, event)).toBe(false);
  });

  it('checkStepComplete matches molecule_complete', () => {
    const step = BASH_TUTORIAL.steps[2] as TutorialStep;
    const event = { type: 'molecule_complete' };
    expect(checkStepComplete(step, event)).toBe(true);
  });

  it('checkStepComplete matches any_tap', () => {
    const step = WILLOW_TUTORIAL.steps[0] as TutorialStep;
    const event = { type: 'any_tap' };
    expect(checkStepComplete(step, event)).toBe(true);
  });

  it('advanceStep increments currentStep', () => {
    const state = initTutorialState(WILLOW_TUTORIAL.id);
    const newState = advanceStep(WILLOW_TUTORIAL, state);
    expect(newState.currentStep).toBe(1);
  });

  it('advanceStep sets completed on last step', () => {
    let state = initTutorialState(WILLOW_TUTORIAL.id);
    for (let i = 0; i < WILLOW_TUTORIAL.steps.length - 1; i++) {
      state = advanceStep(WILLOW_TUTORIAL, state);
    }
    expect(state.completed).toBe(false);
    state = advanceStep(WILLOW_TUTORIAL, state);
    expect(state.completed).toBe(true);
    expect(state.active).toBe(false);
  });

  it('isTutorialComplete returns true when all steps done', () => {
    const state: TutorialState = {
        active: false,
        tutorialId: WILLOW_TUTORIAL.id,
        currentStep: WILLOW_TUTORIAL.steps.length,
        completed: true,
    };
    expect(isTutorialComplete(WILLOW_TUTORIAL, state)).toBe(true);
  });

  it('shouldShowTutorial returns true for new player', () => {
    expect(shouldShowTutorial(false)).toBe(true);
  });

  it('shouldShowTutorial returns false for returning player', () => {
    expect(shouldShowTutorial(true)).toBe(false);
  });

  it('WILLOW_TUTORIAL has 9 steps', () => {
    expect(WILLOW_TUTORIAL.steps).toHaveLength(9);
  });

  it('BASH_TUTORIAL has 4 steps', () => {
    expect(BASH_TUTORIAL.steps).toHaveLength(4);
  });
});
