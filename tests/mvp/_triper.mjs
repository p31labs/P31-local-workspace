// Shared TRIPER helpers for the 12 MVP certification suites (tests/mvp/*).
// Ground truth: software/packages/interface-generator (generateInterface / generateInterfaceFromIntent).
import { generateInterface } from '../../software/packages/interface-generator/src/generator';
import { generateInterfaceFromIntent } from '../../software/packages/interface-generator/src/intent-generator';

export { generateInterface, generateInterfaceFromIntent };

export function isValidDescription(d) {
  return (
    typeof d?.layout === 'string' &&
    typeof d?.density === 'string' &&
    Array.isArray(d?.widgets) &&
    d.widgets.length > 0 &&
    d.widgets.every(
      (w) => typeof w?.id === 'string' && typeof w?.type === 'string' && typeof w?.title === 'string'
    )
  );
}

// Returns the 6-axis TRIPER scorecard for a generated description.
// Purity (determinism) and Regression (snapshot) are asserted separately by each suite.
export function triperScorecard(d, scenario = {}) {
  const ok = isValidDescription(d);
  const spoons = scenario?.spoons ?? 3;
  return {
    Task: ok && d.widgets.length > 0,
    Resilience: ok && d.crisisMode === (spoons === 0),
    Interface: ok,
    Purity: ok,
    E2E: ok && d.widgets.length > 0,
    Regression: ok,
  };
}
