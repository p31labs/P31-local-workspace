import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  generateInterface,
  InterfaceRenderer,
  CrisisOverlay,
} from '@p31/interface-generator';

// Minimal view payload mirroring the jitterbug-api /uig/generate contract.
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

// Replicates the spoon clamping the MCP tool does before calling the endpoint.
function clampSpoons(s: unknown): number {
  const n = Number.isFinite(Number(s)) ? Number(s) : 4;
  return Math.max(0, Math.min(5, Math.round(n)));
}

describe('uig-generate-dashboard MCP tool logic', () => {
  it('returns an adaptive InterfaceDescription for a given spoons value', () => {
    const spoons = clampSpoons(3);
    const desc = generateInterface({ passport: {}, viewData: base, role: 'coordinator', spoons });
    expect(desc.crisisMode).toBe(false);
    expect(desc.layout).toBe('two-column');
    expect(Array.isArray(desc.widgets)).toBe(true);
    expect(desc.widgets.length).toBeGreaterThan(0);
  });

  it('clamps out-of-range spoon input (MCP normalization step)', () => {
    expect(clampSpoons(99)).toBe(5);
    expect(clampSpoons(-3)).toBe(0);
    expect(clampSpoons('2.4')).toBe(2);
  });

  it('maps role + coherence data into role-specific widgets at high spoons', () => {
    const researcher = generateInterface({ passport: {}, viewData: base, role: 'researcher', spoons: 5 });
    expect(researcher.widgets.some((w) => w.type === 'alert-list' && w.dataBinding === 'findings_by_severity')).toBe(true);
    const coordinator = generateInterface({ passport: {}, viewData: base, role: 'coordinator', spoons: 5 });
    expect(coordinator.widgets.some((w) => w.type === 'metric-grid' && w.dataBinding === 'participants_by_cohort')).toBe(true);
  });

  it('triggers CrisisOverlay behavior at spoons 0 (crisisMode + no chrome rendered)', () => {
    const desc = generateInterface({ passport: {}, viewData: base, role: 'participant', spoons: 0 });
    expect(desc.crisisMode).toBe(true);
    expect(desc.layout).toBe('focus-mode');
    // InterfaceRenderer yields no chrome in crisis mode; the host shows CrisisOverlay.
    const html = renderToStaticMarkup(React.createElement(InterfaceRenderer, { description: desc, data: {} }));
    expect(html).toBe('');
    // CrisisOverlay is the component the host mounts separately in crisis mode.
    expect(typeof CrisisOverlay).toBe('function');
  });
});
