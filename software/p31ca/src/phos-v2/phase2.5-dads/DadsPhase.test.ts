import { describe, it, expect } from 'vitest';
import { DadsPhase } from './DadsPhase';

describe('DadsPhase', () => {
  it('can be initialized with a config', async () => {
    const dads = new DadsPhase();
    const mockConfig = {
      version: '2.0.0-alpha.1',
      convergenceWeek: 1,
      phases: { dads: { enabled: true, version: '0.1.0', targetWeek: 1 } },
      features: { voice: true, bros: true, router: true, visual: true, predictive: false, guardian: false, bridge: false, memory: false },
    };

    await dads.initialize(mockConfig as any);
    dads.activate();

    expect(dads.active).toBe(true);
    expect(dads.id).toBe('dads');
  });

  it('registers actors from CogPass profiles', () => {
    const dads = new DadsPhase();

    dads.registerActorFromCogPass({
      id: 'will',
      displayName: 'Will',
      relationshipType: 'operator',
      trustScore: 1.0,
    });

    dads.registerActorFromCogPass({
      id: 'sj',
      displayName: 'S.J.',
      relationshipType: 'child',
      trustScore: 0.9,
    });

    expect(dads.getActor('will')).toBeDefined();
    expect(dads.getActor('will')?.displayName).toBe('Will');
    expect(dads.getActor('sj')?.relationshipType).toBe('child');
  });

  it('dispatches a task', () => {
    const dads = new DadsPhase();
    dads.registerActorFromCogPass({ id: 'will', displayName: 'Will', relationshipType: 'operator' });
    dads.registerActorFromCogPass({ id: 'sj', displayName: 'S.J.', relationshipType: 'child' });

    const task = dads.dispatchTask({
      type: 'check-in',
      intent: 'checkin',
      title: 'How are you?',
      fromActor: 'will',
      toActor: 'sj',
      priority: 'normal',
    });

    expect(task.id).toBeDefined();
    expect(task.type).toBe('check-in');
    expect(task.fromActor).toBe('will');
    expect(task.toActor).toBe('sj');
    expect(task.status).toBe('pending');
  });

  it('returns available actors', () => {
    const dads = new DadsPhase();
    dads.registerActorFromCogPass({ id: 'a', displayName: 'A', relationshipType: 'parent' });
    dads.registerActorFromCogPass({ id: 'b', displayName: 'B', relationshipType: 'child' });
    dads.registerActorFromCogPass({ id: 'c', displayName: 'C', relationshipType: 'sibling' });

    const available = dads.getAvailableActors();
    expect(available.length).toBe(3);
  });

  it('reports state with metrics', () => {
    const dads = new DadsPhase();
    dads.registerActorFromCogPass({ id: 'will', displayName: 'Will', relationshipType: 'operator' });
    dads.dispatchTask({ type: 'ping', intent: 'connect', title: 'Test', fromActor: 'will', toActor: 'will' });

    const state = dads.getState();
    expect(state.metrics.dispatchCount).toBe(1);
    expect(state.metrics.actorCount).toBe(1);
  });

  it('accepts injected trust scores', () => {
    const dads = new DadsPhase();
    dads.registerActorFromCogPass({ id: 'will', displayName: 'Will', relationshipType: 'operator', trustScore: 0.5 });
    dads.registerActorFromCogPass({ id: 'sj', displayName: 'S.J.', relationshipType: 'child', trustScore: 0.5 });

    dads.injectTrustScores(new Map([
      ['will', 1.0],
      ['sj', 0.95]
    ]));

    expect(dads.getActor('will')?.trustScore).toBe(1.0);
    expect(dads.getActor('sj')?.trustScore).toBe(0.95);
  });

  it('onConvergence sets realistic values', () => {
    const dads = new DadsPhase();
    const data = { week: 5, phaseId: 'dads', deliverables: [], dependencies: [], blockers: [], confidence: 0 };
    dads.onConvergence(5, data);

    expect(data.deliverables.length).toBeGreaterThan(0);
    expect(data.dependencies).toContain('bros');
    expect(data.confidence).toBe(0.85);
  });
});
