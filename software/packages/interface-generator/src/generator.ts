import type { GeneratorInput, InterfaceDescription } from './types';
import { spoonGuide } from './rules/spoon-guide';
import { buildWidgets } from './rules/widget-map';

// Deterministic generator: given the (normalized) passport, the server view
// data, and the current spoon state, produce a declarative InterfaceDescription.
// The LLM/agent "rebuild on the fly" step is a later phase; this is the safe,
// predictable, COGA-aligned core.
export function generateInterface(input: GeneratorInput): InterfaceDescription {
  const { viewData, role, spoons } = input;
  const rules = spoonGuide(spoons);
  const widgets = buildWidgets(viewData, role, spoons);

  return {
    layout: rules.layout,
    density: rules.density,
    navigation: rules.navigation,
    interactions: rules.interactions,
    feedback: rules.feedback,
    widgets: spoons <= 2 ? widgets.slice(0, 3) : widgets,
    nextStep:
      spoons <= 2 || rules.showNextStep
        ? { label: rules.nextStepLabel, action: rules.nextStepAction }
        : undefined,
    crisisMode: spoons === 0,
  };
}
