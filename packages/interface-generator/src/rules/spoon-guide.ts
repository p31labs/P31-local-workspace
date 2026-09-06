import type { InterfaceDescription, SpoonRules } from '../types';

export { buildWidgets } from './widget-map';

// Mirrors the DESIGN.md spoon-aware motion table. Motion itself is governed by
// the `[data-spoons]` CSS contract on the host root; this guide drives layout,
// density, navigation and interaction style from the same 0–5 signal.
export function spoonGuide(spoons: number): SpoonRules {
  switch (spoons) {
    case 0:
      return {
        layout: 'focus-mode',
        density: 'minimal',
        navigation: 'hidden',
        interactions: 'guided',
        feedback: 'subtle',
        showNextStep: true,
        nextStepLabel: 'Emergency Rest',
        nextStepAction: '/crisis',
      };
    case 1:
      return {
        layout: 'single-column',
        density: 'minimal',
        navigation: 'top-tabs',
        interactions: 'guided',
        feedback: 'subtle',
        showNextStep: false,
        nextStepLabel: 'Suggested Next Action',
        nextStepAction: '/review',
      };
    case 2:
      return {
        layout: 'single-column',
        density: 'moderate',
        navigation: 'top-tabs',
        interactions: 'guided',
        feedback: 'subtle',
        showNextStep: true,
        nextStepLabel: 'Suggested Next Action',
        nextStepAction: '/review',
      };
    case 3:
      return {
        layout: 'two-column',
        density: 'moderate',
        navigation: 'sidebar',
        interactions: 'direct-manipulation',
        feedback: 'explicit',
        showNextStep: false,
        nextStepLabel: 'Suggested Next Action',
        nextStepAction: '/review',
      };
    case 4:
      return {
        layout: 'grid',
        density: 'detailed',
        navigation: 'sidebar',
        interactions: 'direct-manipulation',
        feedback: 'explicit',
        showNextStep: false,
        nextStepLabel: 'Suggested Next Action',
        nextStepAction: '/review',
      };
    default:
      return {
        layout: 'grid',
        density: 'exhaustive',
        navigation: 'sidebar',
        interactions: 'exploratory',
        feedback: 'explicit',
        showNextStep: false,
        nextStepLabel: 'Suggested Next Action',
        nextStepAction: '/review',
      };
  }
}
