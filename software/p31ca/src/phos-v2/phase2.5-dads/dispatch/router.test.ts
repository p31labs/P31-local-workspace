import { describe, it, expect } from 'vitest';
import { TaskDispatcher } from './router';

describe('TaskDispatcher', () => {
  it('registers and retrieves actors', () => {
    const dispatcher = new TaskDispatcher();
    dispatcher.registerActor({ id: 'will', displayName: 'Will', relationshipType: 'operator' });
    dispatcher.registerActor({ id: 'sj', displayName: 'S.J.', relationshipType: 'child' });

    expect(dispatcher.getActor('will')).toBeDefined();
    expect(dispatcher.getActor('will')?.displayName).toBe('Will');
    expect(dispatcher.getActorCount()).toBe(2);
  });

  it('filters available actors by relationship', () => {
    const dispatcher = new TaskDispatcher();
    dispatcher.registerActor({ id: 'will', displayName: 'Will', relationshipType: 'parent' });
    dispatcher.registerActor({ id: 'sj', displayName: 'S.J.', relationshipType: 'child' });
    dispatcher.registerActor({ id: 'cj', displayName: 'C.J.', relationshipType: 'parent' });

    const parents = dispatcher.getActorsByRelationship('parent');
    expect(parents.length).toBe(2);
    const children = dispatcher.getActorsByRelationship('child');
    expect(children.length).toBe(1);
  });

  it('matches intent to actors', () => {
    const dispatcher = new TaskDispatcher();
    dispatcher.registerActor({ id: 'will', displayName: 'Will', relationshipType: 'parent', trustScore: 1.0 });
    dispatcher.registerActor({ id: 'sj', displayName: 'S.J.', relationshipType: 'child', trustScore: 0.9 });
    dispatcher.registerActor({ id: 'cj', displayName: 'C.J.', relationshipType: 'parent', trustScore: 0.8 });

    const delegateCandidates = dispatcher.matchIntentToActor('delegate');
    expect(delegateCandidates.length).toBe(3); // all 3 have trustScore > 0.6
  });

  it('logs dispatches', () => {
    const dispatcher = new TaskDispatcher();
    dispatcher.registerActor({ id: 'will', displayName: 'Will', relationshipType: 'operator' });

    const task = {
      id: 'test-1',
      type: 'ping' as const,
      intent: 'connect' as const,
      title: 'Test',
      description: '',
      fromActor: 'will',
      toActor: 'will',
      priority: 'normal' as const,
      status: 'pending' as const,
      createdAt: Date.now(),
      expiresAt: null,
      metadata: {},
    };

    dispatcher.dispatch(task);
    const log = dispatcher.getDispatchLog();
    expect(log.length).toBe(1);
    expect(log[0].event).toBe('dispatched');
    expect(log[0].taskId).toBe('test-1');
  });

  it('updates trust scores via injection', () => {
    const dispatcher = new TaskDispatcher();
    dispatcher.registerActor({ id: 'will', displayName: 'Will', relationshipType: 'operator', trustScore: 0.5 });
    dispatcher.registerActor({ id: 'sj', displayName: 'S.J.', relationshipType: 'child', trustScore: 0.5 });

    dispatcher.updateTrustScores(new Map([
      ['will', 0.9],
      ['sj', 0.7],
    ]));
    expect(dispatcher.getActor('will')!.trustScore).toBeCloseTo(0.9);
    expect(dispatcher.getActor('sj')!.trustScore).toBeCloseTo(0.7);
  });
});
