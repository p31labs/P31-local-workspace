import { describe, it, expect } from 'vitest';
import { deriveOverlay } from './overlay';
import type { LoomState } from '@p31/canon/loom/events';

function state(partial: Partial<LoomState>): LoomState {
  return {
    focused: null,
    agentCursor: null,
    agentAttention: 1,
    agentPath: [],
    proposals: new Map(),
    saves: [],
    ...partial,
  };
}

const idIndex = new Map([
  ['--p31-accent', 'token:--p31-accent'],
  ['.glass-card', 'class:.glass-card'],
  ['.feature-card', 'class:.feature-card'],
  ['Button', 'component:Button'],
]);

describe('deriveOverlay', () => {
  it('maps bare names to namespaced ids', () => {
    const o = deriveOverlay(state({ focused: '--p31-accent', agentCursor: '.glass-card' }), idIndex);
    expect(o.focusedId).toBe('token:--p31-accent');
    expect(o.cursorId).toBe('class:.glass-card');
  });

  it('leaves unresolved names null', () => {
    const o = deriveOverlay(state({ focused: '--nope', agentCursor: '.nope' }), idIndex);
    expect(o.focusedId).toBeNull();
    expect(o.cursorId).toBeNull();
  });

  it('maps the agent path and skips unknowns', () => {
    const o = deriveOverlay(state({ agentPath: ['--p31-accent', '.nope', '.glass-card'] }), idIndex);
    expect(o.pathIds).toEqual(['token:--p31-accent', 'class:.glass-card']);
  });

  it('projects proposals to ghosts with status', () => {
    const s = state({});
    s.proposals = new Map([
      ['p1', { id: 'p1', node: '.feature-card', body: {}, author: 'unknown', status: 'pending', revision: 0, reviews: [], revisionSurvival: [], overallSurvival: 1.0 }],
    ]);
    const o = deriveOverlay(s, idIndex);
    expect(o.ghosts).toHaveLength(1);
    expect(o.ghosts[0].nodeId).toBe('class:.feature-card');
    expect(o.ghosts[0].status).toBe('pending');
    expect(o.ghosts[0].overallSurvival).toBe(1.0);
  });

  it('carries overallSurvival through to the ghost', () => {
    const s = state({});
    s.proposals = new Map([
      ['p1', { id: 'p1', node: '.feature-card', body: {}, author: 'unknown', status: 'pending', revision: 1, reviews: [], revisionSurvival: [0.3], overallSurvival: 0.3 }],
    ]);
    const o = deriveOverlay(s, idIndex);
    expect(o.ghosts[0].overallSurvival).toBe(0.3);
  });

  it('reports attention', () => {
    const o = deriveOverlay(state({ agentAttention: 0.42 }), idIndex);
    expect(o.attention).toBe(0.42);
  });
});
