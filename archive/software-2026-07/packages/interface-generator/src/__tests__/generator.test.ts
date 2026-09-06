import { describe, it, expect } from 'vitest';
import { generateInterface } from '../generator';
import { normalizePassport } from '../adapters/passport';

const base = {
  participants_count: 3,
  sessions_count: 2,
  payments_pending: 1,
  days_until_aug1: 22,
  participants_by_cohort: { A: 3 },
  sessions_by_phase: { '1': 2 },
  findings_by_severity: { '1': 1 },
  wcag_pass_rate: 0,
  avg_spoons_start: 3,
  avg_spoons_end: 3,
  spoon_fit: 'neutral',
  nlnet_deliverables: [{ id: 'LOVE', status: 'ready' }],
  ada_compliance: { wcag_2_1_aa: false, eidas_2_0: false },
  deadlines: [{ id: 1, label: 'X', due_date: '2026-08-01', met: 0 }],
};

describe('generateInterface', () => {
  it('enters crisisMode at spoons 0', () => {
    const d = generateInterface({ passport: {}, viewData: base, role: 'coordinator', spoons: 0 });
    expect(d.crisisMode).toBe(true);
    expect(d.layout).toBe('focus-mode');
    expect(d.navigation).toBe('hidden');
  });

  it('caps widgets to <=3 at low spoons', () => {
    const d = generateInterface({ passport: {}, viewData: base, role: 'coordinator', spoons: 1 });
    expect(d.widgets.length).toBeLessThanOrEqual(3);
  });

  it('maps coordinator widgets from view data', () => {
    const d = generateInterface({ passport: {}, viewData: base, role: 'coordinator', spoons: 5 });
    expect(d.widgets.some((w) => w.type === 'metric-grid' && w.dataBinding === 'participants_by_cohort')).toBe(true);
    expect(d.widgets.some((w) => w.type === 'deadline-list')).toBe(true);
  });

  it('maps researcher findings', () => {
    const d = generateInterface({ passport: {}, viewData: base, role: 'researcher', spoons: 5 });
    expect(d.widgets.some((w) => w.type === 'alert-list' && w.dataBinding === 'findings_by_severity')).toBe(true);
  });

  it('maps participant sessions to a transaction feed', () => {
    const v = {
      ...base,
      sessions: [{ id: 1, phase: 1, format: 'remote', spoons_start: 3, spoons_end: 3, paid: false, payment_amount: 25 }],
    };
    const d = generateInterface({ passport: {}, viewData: v, role: 'participant', spoons: 5 });
    expect(d.widgets[0].type).toBe('transaction-feed');
  });

  it('falls back to a text block when participant has no sessions', () => {
    const d = generateInterface({ passport: {}, viewData: base, role: 'participant', spoons: 5 });
    expect(d.widgets[0].type).toBe('text-block');
  });
});

describe('normalizePassport', () => {
  it('returns a default for empty input', () => {
    expect(normalizePassport({}).schemaVersion).toBe('p31.cognitivePassport/4.1.0');
  });

  it('normalizes the usePassportConsumer shape', () => {
    const p = normalizePassport({
      cognitiveStyle: 'visual',
      triggers: ['noise'],
      accommodations: { screenComfort: 70, motionPreference: 'full' },
      baselineSpoons: 4,
    });
    expect(p.cognition.processingStyle).toBe('visual');
    expect(p.accessibility.motionPreference).toBe('full');
    expect(p.baselineSpoons).toBe(4);
  });

  it('passes through an already v4.1 passport', () => {
    const raw = { schemaVersion: 'p31.cognitivePassport/4.1.0', identity: {}, cognition: {}, accessibility: {} };
    expect(normalizePassport(raw)).toBe(raw);
  });
});
