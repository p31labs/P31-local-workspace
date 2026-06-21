import { describe, it, expect, beforeEach } from 'vitest';
import { CONVERGENCE_DEMOS, Week1Core } from './index';
import { runWeek2Convergence } from './week2-persona-voice';
import { runWeek3Convergence } from './week3-router-voice';
import { runWeek4Convergence } from './week4-visual-core';
import { runWeek5Convergence } from './week5-mesh-visual';
import { runWeek6Convergence } from './week6-predictive-all';
import { runWeek7Convergence } from './week7-guardian-all';
import { runWeek8Convergence } from './week8-final';
import type { PHOSMasterRuntime, ConvergenceReport } from '../master';

function mockStates(activePhases: string[]): Record<string, { status: string }> {
  const allPhases = ['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory'];
  const states: Record<string, { status: string }> = {};
  for (const phase of allPhases) {
    states[phase] = { status: activePhases.includes(phase) ? 'active' : 'disabled' };
  }
  return states;
}

function mockConverge(phaseStates: Record<string, { status: string }>): ConvergenceReport {
  const phaseReports = Object.entries(phaseStates).map(([phaseId, state]) => ({
    phaseId,
    state: {
      status: state.status as 'active' | 'paused' | 'error' | 'initializing',
      lastActivity: Date.now(),
      metrics: {},
    },
    data: {
      week: 0,
      phaseId,
      deliverables: [`${phaseId} runtime`],
      dependencies: [],
      blockers: state.status === 'active' ? [] : ['Phase not active'],
      confidence: state.status === 'active' ? 1.0 : 0,
    },
  }));

  return {
    week: 0,
    timestamp: Date.now(),
    phaseReports,
    integrations: [],
    blockers: phaseReports.flatMap(p => p.data.blockers),
  };
}

function createMockMaster(activePhases: string[]): PHOSMasterRuntime {
  const states = mockStates(activePhases);
  const baseReport = mockConverge(states);

  return {
    converge: async (week: number) => ({
      ...baseReport,
      week,
      timestamp: Date.now(),
    }),
    getAllStates: () => states,
  } as unknown as PHOSMasterRuntime;
}

describe('Convergence Demos', () => {
  it('has all 8 weeks defined', () => {
    expect(CONVERGENCE_DEMOS).toHaveLength(8);
  });

  it('each demo has required fields', () => {
    for (const demo of CONVERGENCE_DEMOS) {
      expect(typeof demo.week).toBe('number');
      expect(typeof demo.name).toBe('string');
      expect(typeof demo.script).toBe('string');
      expect(typeof demo.expectedResult).toBe('string');
      expect(Array.isArray(demo.phasesRequired)).toBe(true);
      expect(demo.phasesRequired.length).toBeGreaterThan(0);
    }
  });

  it('week numbers are 1-8 in order', () => {
    expect(CONVERGENCE_DEMOS.map(d => d.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('required phases are valid phase IDs', () => {
    const validPhases = ['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory'];
    for (const demo of CONVERGENCE_DEMOS) {
      for (const phase of demo.phasesRequired) {
        expect(validPhases).toContain(phase);
      }
    }
  });

  it('week 8 requires all 8 phases', () => {
    const week8 = CONVERGENCE_DEMOS.find(d => d.week === 8);
    expect(week8?.phasesRequired).toHaveLength(8);
  });
});

describe('Week 1 Core', () => {
  let master: PHOSMasterRuntime;

  beforeEach(() => {
    master = createMockMaster(['voice', 'bros', 'router']);
  });

  it('returns convergence report with correct shape', async () => {
    const report = await Week1Core(master);
    expect(report.week).toBe(1);
    expect(report.timestamp).toBeGreaterThan(0);
    expect(Array.isArray(report.phaseReports)).toBe(true);
    expect(Array.isArray(report.integrations)).toBe(true);
    expect(Array.isArray(report.blockers)).toBe(true);
  });

  it('has active phase reports for core phases', async () => {
    const report = await Week1Core(master);
    const activeIds = report.phaseReports
      .filter(p => p.state.status === 'active')
      .map(p => p.phaseId);
    expect(activeIds).toContain('voice');
    expect(activeIds).toContain('bros');
    expect(activeIds).toContain('router');
  });
});

describe('Week 4 Visual', () => {
  it('returns report with visual integration', async () => {
    const master = createMockMaster(['voice', 'bros', 'router', 'visual']);
    const report = await runWeek4Convergence(master);
    expect(report.week).toBe(4);
    const hasVisualIntegration = report.integrations.some(
      i => i.phases.includes('visual')
    );
    expect(hasVisualIntegration).toBe(true);
  });
});

describe('Week 5 Mesh Visual', () => {
  it('returns report for week 5', async () => {
    const master = createMockMaster(['router', 'visual']);
    const report = await runWeek5Convergence(master);
    expect(report.week).toBe(5);
    expect(Array.isArray(report.blockers)).toBe(true);
    expect(report.blockers.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Week 6 Predictive', () => {
  it('returns report with predictive integration', async () => {
    const master = createMockMaster(['voice', 'bros', 'router', 'visual', 'predictive']);
    const report = await runWeek6Convergence(master);
    expect(report.week).toBe(6);
    const hasPredictive = report.integrations.some(
      i => i.phases.includes('predictive')
    );
    expect(hasPredictive).toBe(true);
  });
});

describe('Week 7 Guardian', () => {
  it('returns report with guardian integration', async () => {
    const master = createMockMaster(['voice', 'bros', 'router', 'visual', 'predictive', 'guardian']);
    const report = await runWeek7Convergence(master);
    expect(report.week).toBe(7);
    const hasGuardian = report.integrations.some(
      i => i.phases.includes('guardian')
    );
    expect(hasGuardian).toBe(true);
  });
});

describe('Week 8 Final GA', () => {
  it('passes GA criteria when all 8 phases active', async () => {
    const master = createMockMaster(['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory']);
    const report = await runWeek8Convergence(master, { enableAllPhases: true });
    expect(report.week).toBe(8);
    expect(report.gaReady).toBe(true);
  });

  it('returns GA readiness report', async () => {
    const master = createMockMaster(['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory']);
    const report = await runWeek8Convergence(master, { enableAllPhases: true });
    expect(report.gaReadiness).toBeDefined();
    expect(report.gaReadiness.overallScore).toBeGreaterThan(0.9);
    expect(report.gaReadiness.integrationMatrix.length).toBeGreaterThan(0);
    expect(report.gaReadiness.knownIssues.length).toBeGreaterThanOrEqual(0);
  });

  it('blocks GA when phases are missing', async () => {
    const master = createMockMaster(['voice', 'bros']);
    const report = await runWeek8Convergence(master, { enableAllPhases: true });
    expect(report.week).toBe(8);
    expect(report.gaReady).toBe(false);
    expect(report.blockers.length).toBeGreaterThan(0);
  });
});

describe('Convergence Demo Scenarios', () => {
  it('week8 demo uses comprehensive ecosystem command', () => {
    const week8 = CONVERGENCE_DEMOS.find(d => d.week === 8);
    expect(week8?.script).toBe('PHOS, full ecosystem');
  });
});
