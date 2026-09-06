import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ALL_EGGS, FOUNDING_SLOTS } from '../services/eggTracker';

// vi.hoisted ensures store is declared before vi.mock factory runs
const { store } = vi.hoisted(() => {
  const store: Record<string, string> = {};
  return { store };
});

vi.mock('fs', () => ({
  default: {
    existsSync: () => false,
    readFileSync: (p: string) => store[p] ?? (p.includes('founding') ? '[]' : '{}'),
    writeFileSync: (p: string, data: string) => { store[p] = data; },
  },
}));

beforeEach(async () => {
  Object.keys(store).forEach(k => delete store[k]);
  vi.resetModules();
});

describe('constants', () => {
  it('ALL_EGGS has 4 entries', () => {
    expect(ALL_EGGS).toHaveLength(4);
    expect(ALL_EGGS).toContain('bashium');
    expect(ALL_EGGS).toContain('willium');
    expect(ALL_EGGS).toContain('missing_node');
    expect(ALL_EGGS).toContain('tetrahedron');
  });

  it('FOUNDING_SLOTS is 4', () => {
    expect(FOUNDING_SLOTS).toBe(4);
  });
});

describe('eggTracker', () => {
  it('recordDiscovery returns true on first find', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    expect(eggTracker.recordDiscovery('user-1', 'bashium')).toBe(true);
  });

  it('recordDiscovery returns false on duplicate', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    eggTracker.recordDiscovery('user-1', 'bashium');
    expect(eggTracker.recordDiscovery('user-1', 'bashium')).toBe(false);
  });

  it('getUserProgress returns discovered eggs', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    eggTracker.recordDiscovery('user-2', 'willium');
    eggTracker.recordDiscovery('user-2', 'tetrahedron');
    const progress = eggTracker.getUserProgress('user-2');
    expect(progress).toContain('willium');
    expect(progress).toContain('tetrahedron');
    expect(progress).toHaveLength(2);
  });

  it('getUserProgress returns empty array for unknown user', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    expect(eggTracker.getUserProgress('nobody')).toEqual([]);
  });

  it('hasCompletedAll returns false until all 4 found', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    eggTracker.recordDiscovery('user-3', 'bashium');
    eggTracker.recordDiscovery('user-3', 'willium');
    eggTracker.recordDiscovery('user-3', 'missing_node');
    expect(eggTracker.hasCompletedAll('user-3')).toBe(false);
  });

  it('hasCompletedAll returns true when all 4 found', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    for (const egg of ALL_EGGS) {
      eggTracker.recordDiscovery('user-4', egg);
    }
    expect(eggTracker.hasCompletedAll('user-4')).toBe(true);
  });

  it('claimFoundingNode assigns sequential slots', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    expect(eggTracker.claimFoundingNode('node-1')).toBe(1);
    expect(eggTracker.claimFoundingNode('node-2')).toBe(2);
  });

  it('claimFoundingNode returns existing slot on re-claim', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    eggTracker.claimFoundingNode('node-1');
    expect(eggTracker.claimFoundingNode('node-1')).toBe(1);
  });

  it('claimFoundingNode returns null when all slots filled', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    for (let i = 1; i <= FOUNDING_SLOTS; i++) {
      eggTracker.claimFoundingNode(`node-${i}`);
    }
    expect(eggTracker.claimFoundingNode('latecomer')).toBeNull();
  });

  it('getFoundingNodes returns list of claimed node IDs', async () => {
    const { eggTracker } = await import('../services/eggTracker');
    eggTracker.claimFoundingNode('node-A');
    eggTracker.claimFoundingNode('node-B');
    const nodes = eggTracker.getFoundingNodes();
    expect(nodes).toContain('node-A');
    expect(nodes).toContain('node-B');
  });
});
