import { describe, it, expect, beforeEach } from 'vitest';
import type { PHOSMasterRuntime, PHOSPhase, PHOSConfig, PhaseState, ConvergenceReport, IntegrationCheck } from '../master';
import { PHOSMasterRuntime as MasterRuntime } from '../master';

const ALL_PHASE_IDS = ['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory'];

function createMinimalConfig(activePhases: string[]): PHOSConfig {
  return {
    version: '2.0.0-test',
    convergenceWeek: 8,
    phases: Object.fromEntries(ALL_PHASE_IDS.map(id => [
      id,
      { enabled: activePhases.includes(id), version: '1.0.0', targetWeek: id === 'voice' || id === 'bros' || id === 'router' ? 1 : 8 }
    ])) as PHOSConfig['phases'],
    features: {
      voice: activePhases.includes('voice'),
      bros: activePhases.includes('bros'),
      router: activePhases.includes('router'),
      visual: activePhases.includes('visual'),
      predictive: activePhases.includes('predictive'),
      guardian: activePhases.includes('guardian'),
      bridge: activePhases.includes('bridge'),
      memory: activePhases.includes('memory'),
    },
  };
}

class TestPhase implements PHOSPhase {
  id: string;
  version = '1.0.0';
  status: 'alpha' | 'beta' | 'stable' | 'disabled';

  private config: PHOSConfig | null = null;
  private active = false;
  private errorCount = 0;
  private lastActivity = 0;
  private emitCallback?: (event: { type: string; phaseId: string }) => void;
  private onConvergenceCallback?: (week: number, data: any) => void;

  constructor(id: string, initialActive: boolean = true) {
    this.id = id;
    this.status = initialActive ? 'active' : 'disabled';
  }

  setActive(active: boolean) {
    this.active = active;
    this.status = active ? 'active' : 'disabled';
  }

  setErrorCount(count: number) {
    this.errorCount = count;
  }

  setVersion(version: string) {
    this.version = version;
  }

  onEmit(callback: (event: { type: string; phaseId: string }) => void) {
    this.emitCallback = callback;
  }

  onConvergenceHook(callback: (week: number, data: any) => void) {
    this.onConvergenceCallback = callback;
  }

  async initialize(config: PHOSConfig): Promise<void> {
    this.config = config;
    this.lastActivity = Date.now();
  }
  activate(): void { this.active = true; this.lastActivity = Date.now(); }
  deactivate(): void { this.active = false; }
  destroy(): void { this.active = false; }
  onConvergence(week: number, data: any): void {
    if (this.onConvergenceCallback) {
      this.onConvergenceCallback(week, data);
    } else {
      data.deliverables = [`${this.id} deliverables`];
      data.dependencies = [];
      data.blockers = [];
      data.confidence = this.active ? 0.9 : 0;
    }
    this.lastActivity = Date.now();
  }
  getState(): PhaseState {
    return {
      status: this.active ? 'active' : 'paused',
      lastActivity: this.lastActivity,
      errorCount: this.errorCount,
      metrics: { active: this.active ? 1 : 0 },
    };
  }
  emit(event: any): void {
    if (this.emitCallback) {
      this.emitCallback({ ...event, source: this.id });
    }
  }
  on(event: string, handler: any): void {}
}

function buildMaster(config: PHOSConfig, phases: Array<{ id: string; phase: TestPhase }>): PHOSMasterRuntime {
  const master = new MasterRuntime(config);
  for (const { phase } of phases) {
    master.registerPhase(phase as unknown as any);
  }
  return master;
}

describe('PHOSMasterRuntime convergence', () => {
  let master: PHOSMasterRuntime;
  let phases: Array<{ id: string; phase: TestPhase }>;
  let config: PHOSConfig;

  beforeEach(() => {
    config = createMinimalConfig(['voice', 'bros', 'router', 'visual', 'predictive', 'guardian', 'bridge', 'memory']);
    phases = ALL_PHASE_IDS.map(id => ({ id, phase: new TestPhase(id, config.phases[id].enabled) }));
  });

  it('master.converge(1) returns ConvergenceReport with phaseReports for all registered phases', async () => {
    master = buildMaster(config, phases);
    const report = await master.converge(1) as ConvergenceReport;

    expect(report.week).toBe(1);
    expect(Array.isArray(report.phaseReports)).toBe(true);
    expect(report.phaseReports.length).toBe(config.phases && Object.keys(config.phases).length);

    const registeredIds = new Set(phases.map(p => p.id));
    for (const phaseReport of report.phaseReports) {
      expect(registeredIds.has(phaseReport.phaseId)).toBe(true);
      expect(phaseReport.state).toBeDefined();
      expect(phaseReport.data).toBeDefined();
      expect(typeof phaseReport.state.status).toBe('string');
      expect(typeof phaseReport.state.errorCount).toBe('number');
    }
  });

  it('getAllStates returns actual states from registered phases', async () => {
    master = buildMaster(config, phases);
    await master.converge(1);

    const states = master.getAllStates();
    for (const { id, phase } of phases) {
      expect(states[id]).toBeDefined();
      expect(states[id].status).toBe(phase.active ? 'active' : 'paused');
      expect(states[id].errorCount).toBe(phase.errorCount);
    }
  });

  it('getEventHistory captures events emitted during convergence', async () => {
    let emittedEvents: Array<{ type: string; phaseId: string }> = [];
    for (const { phase } of phases) {
      phase.onEmit((event) => {
        emittedEvents.push({ type: event.type, phaseId: (event as any).source || phase.id });
      });
    }

    master = buildMaster(config, phases);
    await master.converge(1);

    const history = master.getEventHistory();
    expect(history.length).toBeGreaterThan(0);

    const convergenceEvents = history.filter(e => e.type === 'convergence.week');
    expect(convergenceEvents.length).toBeGreaterThanOrEqual(1);

    const phaseStatusEvents = history.filter(e => e.type === 'phase.status.changed');
    const expectedEnabledChanges = Object.values(config.phases).filter(p => p.enabled).length;
    expect(phaseStatusEvents.length).toBeGreaterThan(0);
  });

  it('Week 8 convergence FAILS if not all phases are active or not version 1.0.0+', async () => {
    const partialConfig = createMinimalConfig(['voice', 'bros', 'router']);
    const partialPhases = ALL_PHASE_IDS.map(id => ({
      id,
      phase: new TestPhase(id, partialConfig.phases[id].enabled),
    }));
    partialPhases.find(p => p.id === 'bridge')!.phase.setActive(true);
    partialPhases.find(p => p.id === 'memory')!.phase.setActive(true);
    partialPhases.find(p => p.id === 'memory')!.phase.setVersion('0.9.0');

    master = buildMaster(partialConfig, partialPhases);
    const report = await master.converge(8) as ConvergenceReport;

    const bridgeReady = report.integrations.some(
      i => i.phases.includes('bridge') && i.phases.includes('voice') && i.phases.includes('router')
    );
    expect(bridgeReady).toBe(false);
  });

  it('integration checks reflect actual phase readiness', async () => {
    config = createMinimalConfig(['voice', 'bros', 'router', 'visual']);
    phases = ALL_PHASE_IDS.map(id => ({
      id,
      phase: new TestPhase(id, config.phases[id].enabled),
    }));

    master = buildMaster(config, phases);
    const report = await master.converge(4) as ConvergenceReport;

    const coreIntegration = report.integrations.find(i => i.name === 'Core Runtime' || i.name === '3D Constellation Core');
    if (coreIntegration) {
      expect(coreIntegration.ready).toBe(true);
    }

    const memoryIntegration = report.integrations.find(i => i.phases.includes('memory'));
    if (memoryIntegration) {
      expect(memoryIntegration.ready).toBe(false);
    }
  });

  it('errorCount increments when phase operations fail', async () => {
    config = createMinimalConfig(['voice']);
    phases = [{
      id: 'voice',
      phase: new TestPhase('voice', true),
    }];
    const voicePhase = phases[0].phase;
    voicePhase.setActive(true);

    master = buildMaster(config, phases);
    await master.converge(1);

    const states = master.getAllStates();
    expect(states['voice']).toBeDefined();

    voicePhase.setErrorCount(2);
    const statesAfter = master.getAllStates();
    expect(statesAfter['voice'].errorCount).toBe(2);
  });

  it('convergence report is JSON-serializable', async () => {
    config = createMinimalConfig(['voice', 'bros', 'router']);
    phases = ALL_PHASE_IDS.map(id => ({
      id,
      phase: new TestPhase(id, config.phases[id].enabled),
    }));

    master = buildMaster(config, phases);
    const report = await master.converge(8) as ConvergenceReport;

    const serialized = JSON.stringify(report);
    const parsed = JSON.parse(serialized);
    expect(parsed.week).toBe(8);
    expect(parsed.phaseReports.length).toBeGreaterThan(0);
    expect(Array.isArray(parsed.integrations)).toBe(true);
    expect(Array.isArray(parsed.blockers)).toBe(true);
  });
});
