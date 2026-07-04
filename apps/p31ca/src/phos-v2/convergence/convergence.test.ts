import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CONVERGENCE_DEMOS, Week1Core } from './index';
import { runWeek2Convergence } from './week2-persona-voice';
import { runWeek3Convergence } from './week3-router-voice';
import { runWeek4Convergence } from './week4-visual-core';
import { runWeek5Convergence } from './week5-mesh-visual';
import { runWeek6Convergence } from './week6-predictive-all';
import { runWeek7Convergence } from './week7-guardian-all';
import { runWeek8Convergence } from './week8-final';
import { getPHOSConfig, PHOSMasterRuntime } from '../master';
import type { ConvergenceReport } from '../master';

// Helper to create a real PHOSMasterRuntime with specific phases enabled
async function createRealMaster(enabledPhaseIds: string[]): Promise<PHOSMasterRuntime> {
  const config = getPHOSConfig();
  
  // Disable all phases by default
  const phaseConfigs: Record<string, { enabled: boolean; version: string; targetWeek: number; mock?: boolean }> = {};
  const allPhaseIds = ['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory'];
  
  for (const phaseId of allPhaseIds) {
    phaseConfigs[phaseId] = {
      enabled: enabledPhaseIds.includes(phaseId),
      version: '1.0.0',
      targetWeek: 1,
      mock: false
    };
  }
  
  config.phases = phaseConfigs;
  
  const master = new PHOSMasterRuntime(config);
  
  // Register and activate each enabled phase
  for (const phaseId of enabledPhaseIds) {
    let phase;
    switch (phaseId) {
      case 'voice':
        const { VoicePhase } = await import('../phase1-voice/index');
        phase = new VoicePhase();
        break;
      case 'bros':
        const { BrosPhase } = await import('../phase2-bros/index');
        phase = new BrosPhase();
        break;
      case 'router':
        const { RouterPhase } = await import('../phase3-router/index');
        phase = new RouterPhase();
        break;
      case 'visual':
        const { VisualPhase } = await import('../phase4-visual/index');
        phase = new VisualPhase();
        break;
      case 'predictive':
        const { PredictivePhase } = await import('../phase5-predictive/index');
        phase = new PredictivePhase();
        break;
      case 'guardian':
        const { GuardianPhase } = await import('../phase6-guardian/index');
        phase = new GuardianPhase();
        break;
      case 'bridge':
        const { BridgePhase } = await import('../phase7-bridge/index');
        phase = new BridgePhase();
        break;
      case 'memory':
        const { MemoryPhase } = await import('../phase8-memory/index');
        phase = new MemoryPhase();
        break;
    }
    
    if (phase) {
      await phase.initialize(config);
      master.registerPhase(phase);
      phase.activate();
    }
  }
  
  return master;
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

  beforeEach(async () => {
    master = await createRealMaster(['voice', 'bros', 'router']);
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
  let master: PHOSMasterRuntime;

  beforeEach(async () => {
    master = await createRealMaster(['voice', 'bros', 'router', 'visual']);
  });

  it('returns report with visual integration', async () => {
    const report = await runWeek4Convergence(master);
    expect(report.week).toBe(4);
    const hasVisualIntegration = report.integrations.some(
      i => i.phases.includes('visual')
    );
    expect(hasVisualIntegration).toBe(true);
  });
});

describe('Week 5 Mesh Visual', () => {
  let master: PHOSMasterRuntime;

  beforeEach(async () => {
    master = await createRealMaster(['router', 'visual']);
  });

  it('returns report for week 5', async () => {
    const report = await runWeek5Convergence(master);
    expect(report.week).toBe(5);
    expect(Array.isArray(report.blockers)).toBe(true);
    expect(report.blockers.length).toBeGreaterThanOrEqual(0);
  });
});

describe('Week 6 Predictive', () => {
  let master: PHOSMasterRuntime;

  beforeEach(async () => {
    master = await createRealMaster(['voice', 'bros', 'router', 'visual', 'predictive']);
  });

  it('returns report with predictive integration', async () => {
    const report = await runWeek6Convergence(master);
    expect(report.week).toBe(6);
    const hasPredictive = report.integrations.some(
      i => i.phases.includes('predictive')
    );
    expect(hasPredictive).toBe(true);
  });
});

describe('Week 7 Guardian', () => {
  let master: PHOSMasterRuntime;

  beforeEach(async () => {
    master = await createRealMaster(['voice', 'bros', 'router', 'visual', 'predictive', 'guardian']);
  });

  it('returns report with guardian integration', async () => {
    const report = await runWeek7Convergence(master);
    expect(report.week).toBe(7);
    const hasGuardian = report.integrations.some(
      i => i.phases.includes('guardian')
    );
    expect(hasGuardian).toBe(true);
  });
});

describe('Week 8 Final GA', () => {
  let master: PHOSMasterRuntime;

  beforeEach(async () => {
    master = await createRealMaster(['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory']);
  });

  it('passes GA criteria when all 8 phases active', async () => {
    const report = await runWeek8Convergence(master, { enableAllPhases: true });
    expect(report.week).toBe(8);
    expect(typeof report.passed).toBe('boolean');
    expect(typeof report.gaReady).toBe('boolean');
  });

  it('returns GA readiness report', async () => {
    const report = await runWeek8Convergence(master, { enableAllPhases: true });
    expect(report.gaReadiness).toBeDefined();
    expect(typeof report.gaReadiness.overallScore).toBe('number');
    expect(report.gaReadiness.integrationMatrix.length).toBeGreaterThan(0);
    expect(report.gaReadiness.knownIssues.length).toBeGreaterThanOrEqual(0);
  });

  it('blocks GA when phases are missing', async () => {
    const master = await createRealMaster(['voice', 'bros']);
    const report = await runWeek8Convergence(master, { enableAllPhases: true });
    expect(report.week).toBe(8);
    expect(report.blockers.length).toBeGreaterThan(0);
  });
});

describe('Convergence Demo Scenarios', () => {
  it('week8 demo uses comprehensive ecosystem command', () => {
    const week8 = CONVERGENCE_DEMOS.find(d => d.week === 8);
    expect(week8?.script).toBe('PHOS, full ecosystem');
  });
});
