// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Tutorial Engine — Guided First Play
//
// Pure data + logic for a step-by-step tutorial.
// CC wires the visual overlay (highlight ring, arrow, toast).
// ═══════════════════════════════════════════════════════

export type TutorialHighlight =
  | 'element_H'
  | 'element_O'
  | 'ghost_site'
  | 'build_another'
  | 'breathe_button'
  | 'mode_seed'
  | 'mode_sprout' // Added for Bash's tutorial
  | 'none';

export interface TutorialStep {
  id: string;
  message: string;
  emoji: string;
  highlight: TutorialHighlight;
  waitFor: TutorialWaitCondition;
  celebration?: string;
}

export type TutorialWaitCondition =
  | { type: 'mode_selected'; mode: string }
  | { type: 'atom_placed'; element: string }
  | { type: 'molecule_complete' }
  | { type: 'button_tapped'; button: string }
  | { type: 'any_tap' };

export interface TutorialState {
  active: boolean;
  tutorialId: string;
  currentStep: number;
  completed: boolean;
}

export interface Tutorial {
  id: string;
  name: string;
  mode: string;
  steps: TutorialStep[];
}

export const WILLOW_TUTORIAL: Tutorial = {
  id: 'first_molecule',
  name: "Willow's First Molecule",
  mode: 'seed',
  steps: [
    {
      id: 'welcome',
      message: 'Hi! Let\'s build something!',
      emoji: '👋',
      highlight: 'none',
      waitFor: { type: 'any_tap' },
    },
    {
      id: 'pick_mode',
      message: 'Tap the seed!',
      emoji: '🌱',
      highlight: 'mode_seed',
      waitFor: { type: 'mode_selected', mode: 'seed' },
      celebration: '🎉 Great pick!',
    },
    {
      id: 'place_h1',
      message: 'Tap the H!',
      emoji: '⚪',
      highlight: 'element_H',
      waitFor: { type: 'atom_placed', element: 'H' },
      celebration: '✨ Hydrogen!',
    },
    {
      id: 'place_h2',
      message: 'Tap H again!',
      emoji: '⚪',
      highlight: 'element_H',
      waitFor: { type: 'atom_placed', element: 'H' },
      celebration: '🎉 You made hydrogen gas!',
    },
    {
      id: 'build_another',
      message: 'Tap Build Another!',
      emoji: '🔄',
      highlight: 'build_another',
      waitFor: { type: 'button_tapped', button: 'build_another' },
    },
    {
      id: 'place_h3',
      message: 'Now tap H!',
      emoji: '⚪',
      highlight: 'element_H',
      waitFor: { type: 'atom_placed', element: 'H' },
    },
    {
      id: 'place_h4',
      message: 'Now tap H again!',
      emoji: '⚪',
      highlight: 'element_H',
      waitFor: { type: 'atom_placed', element: 'H' },
    },
    {
      id: 'place_o',
      message: 'Now tap the red O!',
      emoji: '🔴',
      highlight: 'element_O',
      waitFor: { type: 'atom_placed', element: 'O' },
      celebration: '💧 You made WATER!!!',
    },
    {
      id: 'done',
      message: 'You\'re a scientist now!',
      emoji: '🔬',
      highlight: 'none',
      waitFor: { type: 'any_tap' },
    },
  ],
};

export const BASH_TUTORIAL: Tutorial = {
  id: 'first_challenge',
  name: "Bash's Challenge",
  mode: 'sprout',
  steps: [
    {
      id: 'welcome',
      message: 'Ready to build?',
      emoji: '🧪',
      highlight: 'none',
      waitFor: { type: 'any_tap' },
    },
    {
      id: 'pick_mode',
      message: 'Tap Sprout!',
      emoji: '🌿',
      highlight: 'mode_sprout',
      waitFor: { type: 'mode_selected', mode: 'sprout' },
    },
    {
      id: 'free_build',
      message: 'Build anything! Use C, H, N, and O.',
      emoji: '🔬',
      highlight: 'none',
      waitFor: { type: 'molecule_complete' },
      celebration: '🎉 First molecule!',
    },
    {
      id: 'done',
      message: 'Now try the Kitchen quest! 👈',
      emoji: '🍳',
      highlight: 'none',
      waitFor: { type: 'any_tap' },
    },
  ],
};

const TUTORIALS: Record<string, Tutorial> = {
  seed: WILLOW_TUTORIAL,
  sprout: BASH_TUTORIAL,
};

export function getTutorial(mode: string): Tutorial | null {
  return TUTORIALS[mode] ?? null;
}

export function getFirstTimeTutorial(): Tutorial {
  return WILLOW_TUTORIAL;
}

export function initTutorialState(tutorialId: string): TutorialState {
  return {
    active: true,
    tutorialId,
    currentStep: 0,
    completed: false,
  };
}

export function getCurrentStep(
  tutorial: Tutorial,
  state: TutorialState
): TutorialStep | null {
  if (!state.active || state.completed) {
    return null;
  }
  return tutorial.steps[state.currentStep] ?? null;
}

export function checkStepComplete(
  step: TutorialStep,
  event: {
    type: string;
    mode?: string;
    element?: string;
    button?: string;
  }
): boolean {
  const { waitFor } = step;
  switch (waitFor.type) {
    case 'any_tap':
      return event.type === 'any_tap';
    case 'mode_selected':
      return event.type === 'mode_selected' && event.mode === waitFor.mode;
    case 'atom_placed':
      return event.type === 'atom_placed' && event.element === waitFor.element;
    case 'molecule_complete':
      return event.type === 'molecule_complete';
    case 'button_tapped':
      return event.type === 'button_tapped' && event.button === waitFor.button;
    default:
      return false;
  }
}

export function advanceStep(
  tutorial: Tutorial,
  state: TutorialState
): TutorialState {
  if (state.completed) return state;

  const nextStep = state.currentStep + 1;
  const isCompleted = nextStep >= tutorial.steps.length;

  return {
    ...state,
    currentStep: nextStep,
    completed: isCompleted,
    active: !isCompleted,
  };
}

export function isTutorialComplete(
  tutorial: Tutorial,
  state: TutorialState
): boolean {
    return state.completed || state.currentStep >= tutorial.steps.length;
}

export function shouldShowTutorial(hasPlayedBefore: boolean): boolean {
  return !hasPlayedBefore;
}
