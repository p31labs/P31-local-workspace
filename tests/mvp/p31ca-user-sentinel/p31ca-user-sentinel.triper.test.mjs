// TRIPER MVP suite — P31CA USER SENTINEL (P31CA USER SENTINEL — E2E swarm)
// Validates the 6 TRIPER axes (Task · Resilience · Interface · Purity · E2E · Regression)
// against the interface-generator's output for the p31ca-user-sentinel domain.
import { describe, it, expect } from 'vitest';
import {
  generateInterface,
  generateInterfaceFromIntent,
  isValidDescription,
  triperScorecard,
} from '../_triper.mjs';

const scenario = {
  role: 'researcher',
  spoons: 3,
  passport: null,
  viewData: { swarms: 2, alerts: 1, findings_by_severity: 1, wcag_pass_rate: 0.98 },
};

describe('TRIPER · P31CA USER SENTINEL — P31CA USER SENTINEL — E2E swarm', () => {
  it('Task: produces a purpose-built interface with widgets', () => {
    const d = generateInterface(scenario);
    expect(isValidDescription(d)).toBe(true);
    expect(triperScorecard(d, scenario).Task).toBe(true);
    expect(d.widgets.length).toBeGreaterThan(0);
  });

  it('Resilience: spoons=0 engages crisis mode without throwing', () => {
    const d = generateInterface({ ...scenario, spoons: 0 });
    expect(d.crisisMode).toBe(true);
    expect(d.layout).toBe('focus-mode');
    expect(d.density).toBe('minimal');
    expect(isValidDescription(d)).toBe(true);
  });

  it('Resilience: malformed input degrades gracefully', () => {
    expect(() => generateInterfaceFromIntent({ prompt: '???', spoons: 3 })).not.toThrow();
    const d = generateInterfaceFromIntent({ prompt: '???', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
  });

  it('Interface: structurally valid description', () => {
    const d = generateInterface(scenario);
    expect(isValidDescription(d)).toBe(true);
    expect(triperScorecard(d).Interface).toBe(true);
  });

  it('Purity: deterministic for identical input', () => {
    const a = JSON.stringify(generateInterface(scenario));
    const b = JSON.stringify(generateInterface(scenario));
    expect(a).toBe(b);
  });

  it('E2E: intent path yields a valid interface', () => {
    const d = generateInterfaceFromIntent({ prompt: 'Show user sentinel swarm health', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(triperScorecard(d).E2E).toBe(true);
  });

  it('Regression: stable widget shape for fixed input', () => {
    const d = generateInterface(scenario);
    expect(d.widgets.every((w) => typeof w.type === 'string')).toBe(true);
    expect(d.widgets.length).toBeGreaterThan(0);
  });
});
