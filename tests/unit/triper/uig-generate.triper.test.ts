import { describe, it, expect } from 'vitest';
import { generateInterface } from '../../../software/packages/interface-generator/src/generator';
import { generateInterfaceFromIntent } from '../../../software/packages/interface-generator/src/intent-generator';
import type { InterfaceDescription } from '../../../software/packages/interface-generator/src/types';

function isValidDescription(d: InterfaceDescription): boolean {
  return (
    typeof d.layout === 'string' &&
    typeof d.density === 'string' &&
    Array.isArray(d.widgets) &&
    d.widgets.every(
      (w) => typeof w.id === 'string' && typeof w.type === 'string' && typeof w.title === 'string',
    )
  );
}

describe('UIG TRIPER — generateInterface', () => {
  it('participant with empty viewData has fallback widget', () => {
    const d = generateInterface({ role: 'participant', spoons: 3, passport: null, viewData: {} });
    expect(isValidDescription(d)).toBe(true);
    expect(d.widgets.length).toBeGreaterThan(0);
    expect(d.crisisMode).toBe(false);
  });

  it('coordinator with viewData produces stat cards', () => {
    const d = generateInterface({
      role: 'coordinator',
      spoons: 3,
      passport: null,
      viewData: { participants_count: 5, sessions_count: 10 },
    });
    expect(isValidDescription(d)).toBe(true);
    expect(d.widgets.some((w) => w.type === 'stat-card')).toBe(true);
  });

  it('researcher with viewData produces widgets', () => {
    const d = generateInterface({
      role: 'researcher',
      spoons: 3,
      passport: null,
      viewData: { wcag_pass_rate: 0.92 },
    });
    expect(isValidDescription(d)).toBe(true);
    expect(d.widgets.some((w) => w.type === 'stat-card')).toBe(true);
  });

  it('grant-reviewer with viewData produces widgets', () => {
    const d = generateInterface({
      role: 'grant-reviewer',
      spoons: 3,
      passport: null,
      viewData: { days_until_aug1: 21 },
    });
    expect(isValidDescription(d)).toBe(true);
  });

  for (const spoons of [0, 1, 2, 3, 4, 5]) {
    it(`produces valid description at spoons=${spoons}`, () => {
      const d = generateInterface({ role: 'participant', spoons, passport: null, viewData: {} });
      expect(isValidDescription(d)).toBe(true);
      expect(d.crisisMode).toBe(spoons === 0);
    });
  }

  it('crisis mode at spoons=0 sets flag', () => {
    const d = generateInterface({ role: 'participant', spoons: 0, passport: null, viewData: {} });
    expect(d.crisisMode).toBe(true);
    expect(d.layout).toBe('focus-mode');
    expect(d.density).toBe('minimal');
  });

  it('respects viewData for widget data bindings', () => {
    const viewData = { participants_count: 5, sessions_count: 10 };
    const d = generateInterface({ role: 'coordinator', spoons: 4, passport: null, viewData });
    expect(d.widgets.length).toBeGreaterThan(0);
  });
});

describe('UIG TRIPER — generateInterfaceFromIntent', () => {
  it('produces valid description from love-ledger prompt', () => {
    const d = generateInterfaceFromIntent({ prompt: 'Show me my love ledger balance', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(d.crisisMode).toBe(false);
    expect(d.widgets.some((w) => w.type === 'stat-card')).toBe(true);
  });

  it('produces valid description from deadline prompt', () => {
    const d = generateInterfaceFromIntent({ prompt: 'What deadlines are coming up?', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(d.widgets.some((w) => w.type === 'deadline-list')).toBe(true);
  });

  it('produces valid description from compliance prompt', () => {
    const d = generateInterfaceFromIntent({ prompt: 'Check WCAG compliance status', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(d.widgets.some((w) => w.type === 'alert-list')).toBe(true);
  });

  it('produces valid description from crisis prompt', () => {
    const d = generateInterfaceFromIntent({ prompt: 'I need help, this is an emergency', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(d.widgets.some((w) => w.type === 'action-button')).toBe(true);
  });

  it('crisis mode overrides at spoons=0', () => {
    const d = generateInterfaceFromIntent({ prompt: 'Show me my dashboard', spoons: 0 });
    expect(d.crisisMode).toBe(true);
    expect(d.layout).toBe('focus-mode');
    expect(d.density).toBe('minimal');
  });

  it('truncates widgets at low spoons', () => {
    const lowSpoons = generateInterfaceFromIntent({ prompt: 'Show me everything', spoons: 1 });
    const highSpoons = generateInterfaceFromIntent({ prompt: 'Show me everything', spoons: 5 });
    expect(lowSpoons.widgets.length).toBeLessThanOrEqual(highSpoons.widgets.length);
  });

  it('fallback prompt produces valid description', () => {
    const d = generateInterfaceFromIntent({ prompt: 'asdfghjkl', spoons: 3 });
    expect(isValidDescription(d)).toBe(true);
    expect(d.widgets.length).toBeGreaterThan(0);
  });
});

describe('UIG TRIPER — cross-generator invariants', () => {
  it('both generators produce valid layout values', () => {
    const layouts = ['single-column', 'two-column', 'grid', 'focus-mode', 'guided'];
    const d1 = generateInterface({ role: 'participant', spoons: 3, passport: null, viewData: {} });
    const d2 = generateInterfaceFromIntent({ prompt: 'Show me a dashboard', spoons: 3 });
    expect(layouts).toContain(d1.layout);
    expect(layouts).toContain(d2.layout);
  });

  it('both generators produce valid density values', () => {
    const densities = ['minimal', 'moderate', 'detailed', 'exhaustive'];
    const d1 = generateInterface({ role: 'participant', spoons: 3, passport: null, viewData: {} });
    const d2 = generateInterfaceFromIntent({ prompt: 'Show me a dashboard', spoons: 3 });
    expect(densities).toContain(d1.density);
    expect(densities).toContain(d2.density);
  });

  it('widget IDs are unique within a description', () => {
    const d = generateInterfaceFromIntent({ prompt: 'Show me everything', spoons: 5 });
    const ids = d.widgets.map((w) => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
