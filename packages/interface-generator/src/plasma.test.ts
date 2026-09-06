import { describe, it, expect } from 'vitest';
import type { InterfaceDescription, Widget } from './types';
import {
  createInitialState,
  applyMutation,
  reconstructState,
  undo,
  getEventHistory,
  getVersion,
} from './plasma';

const baseDesc: InterfaceDescription = {
  id: 'test',
  intent: 'hello',
  widgets: [
    { id: 'w1', type: 'Section', props: { title: 'A' } },
    { id: 'w2', type: 'Section', props: { title: 'B' } },
  ],
  metadata: {},
};

describe('createInitialState', () => {
  it('creates state with version 0', () => {
    const state = createInitialState(baseDesc, 's1');
    expect(state.version).toBe(0);
    expect(state.events).toHaveLength(0);
    expect(state.sessionId).toBe('s1');
  });
});

describe('applyMutation', () => {
  it('adds a widget', () => {
    const state = createInitialState(baseDesc, 's1');
    const next = applyMutation(state, {
      type: 'addWidget',
      payload: { widget: { id: 'w3', type: 'Section', props: { title: 'C' } } },
      timestamp: Date.now(),
      sessionId: 's1',
    });
    expect(next.description.widgets).toHaveLength(3);
    expect(next.version).toBe(1);
  });

  it('removes a widget', () => {
    const state = createInitialState(baseDesc, 's1');
    const next = applyMutation(state, {
      type: 'removeWidget',
      payload: { widgetId: 'w1' },
      timestamp: Date.now(),
      sessionId: 's1',
    });
    expect(next.description.widgets).toHaveLength(1);
    expect(next.description.widgets[0].id).toBe('w2');
  });

  it('reorders widgets', () => {
    const state = createInitialState(baseDesc, 's1');
    const next = applyMutation(state, {
      type: 'reorderWidget',
      payload: { fromIndex: 0, toIndex: 1 },
      timestamp: Date.now(),
      sessionId: 's1',
    });
    expect(next.description.widgets[0].id).toBe('w2');
    expect(next.description.widgets[1].id).toBe('w1');
  });

  it('updates a widget', () => {
    const state = createInitialState(baseDesc, 's1');
    const next = applyMutation(state, {
      type: 'updateWidget',
      payload: { widgetId: 'w1', changes: { props: { title: 'Updated' } } },
      timestamp: Date.now(),
      sessionId: 's1',
    });
    expect(next.description.widgets[0].props).toEqual({ title: 'Updated' });
  });

  it('sets intent', () => {
    const state = createInitialState(baseDesc, 's1');
    const next = applyMutation(state, {
      type: 'setIntent',
      payload: { intent: 'new intent' },
      timestamp: Date.now(),
      sessionId: 's1',
    });
    expect(next.description.intent).toBe('new intent');
  });
});

describe('reconstructState', () => {
  it('replays events from genesis', () => {
    const events = [
      {
        type: 'addWidget' as const,
        payload: { widget: { id: 'w3', type: 'Section', props: { title: 'C' } } },
        timestamp: Date.now(),
        sessionId: 's1',
      },
    ];
    const reconstructed = reconstructState(events);
    expect(reconstructed.description.widgets).toHaveLength(1);
    expect(reconstructed.description.widgets[0].id).toBe('w3');
  });

  it('throws on empty events', () => {
    expect(() => reconstructState([])).toThrow();
  });
});

describe('undo', () => {
  it('reverts last mutation', () => {
    let state = createInitialState(baseDesc, 's1');
    state = applyMutation(state, {
      type: 'addWidget',
      payload: { widget: { id: 'w3', type: 'Section', props: { title: 'C' } } },
      timestamp: Date.now(),
      sessionId: 's1',
    });
    expect(state.description.widgets).toHaveLength(3);
    const undone = undo(state);
    expect(undone.description.widgets).toHaveLength(2);
  });
});

describe('getEventHistory', () => {
  it('returns copy of events', () => {
    const state = createInitialState(baseDesc, 's1');
    const next = applyMutation(state, {
      type: 'addWidget',
      payload: { widget: { id: 'w3', type: 'Section', props: { title: 'C' } } },
      timestamp: Date.now(),
      sessionId: 's1',
    });
    const history = getEventHistory(next);
    expect(history).toHaveLength(1);
    expect(history[0].type).toBe('addWidget');
  });
});

describe('getVersion', () => {
  it('returns current version', () => {
    const state = createInitialState(baseDesc, 's1');
    expect(getVersion(state)).toBe(0);
  });
});
