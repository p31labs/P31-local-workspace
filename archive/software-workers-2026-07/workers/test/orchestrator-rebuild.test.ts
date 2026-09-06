/**
 * Orchestrator State Rebuild Tests
 * Run with: cd /home/p31/andromeda/software/workers && npx vitest run
 */

import { describe, it, expect, vi } from 'vitest';

/** Constructor schedules work in blockConcurrencyWhile; allow that async init to finish. */
async function drainDOInit() {
  for (let i = 0; i < 20; i++) {
    await new Promise<void>((r) => setImmediate(r));
  }
}

// Mock DurableObjectState and Env
function createMockDO() {
  const storage = new Map<string, any>();
  const state = {
    // Must await — real DO waits for storage; otherwise meshState stays default in CI.
    blockConcurrencyWhile: async (fn: () => Promise<void>) => {
      await fn();
    },
    storage: {
      get: vi.fn((key: string) => Promise.resolve(storage.get(key))),
      put: vi.fn((key: string, value: any) => {
        storage.set(key, value);
        return Promise.resolve();
      }),
      delete: vi.fn((key: string) => {
        storage.delete(key);
        return Promise.resolve();
      })
    }
  };

  const env = {
    ORCHESTRATOR_DO: {} as any,
    ORCHESTRATOR_D1: {
      prepare: vi.fn().mockReturnThis(),
      bind: vi.fn().mockReturnThis(),
      all: vi.fn().mockResolvedValue({ results: [] }),
      first: vi.fn().mockResolvedValue(null),
      run: vi.fn().mockResolvedValue({})
    },
    SPOONS_KV: {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined)
    }
  };

  return { state, env, storage };
}

describe('Orchestrator State Rebuild', () => {
  describe('Cold Start Detection', () => {
    it('triggers rebuild when lastSync > 5 minutes', async () => {
      const { state, env, storage } = createMockDO();

      // Simulate stale lastSync (>5 min ago)
      const staleSync = Date.now() - 6 * 60 * 1000;
      storage.set('state', {
        level: 4,
        lastCheck: staleSync,
        pendingLevel: null,
        hysteresisCount: 0,
        mesh: {
          careScore: 0.5,
          qFactor: 0.0,
          activeMinutes: 0,
          vertices: {},
          lastMeshSync: staleSync
        }
      });

      // Import and instantiate DO
      const { EventBusDO } = await import('../orchestrator-event-bus.js');
      const doInstance = new EventBusDO(state as any, env as any);
      await drainDOInit();

      // Stale sync triggers rebuild; implementation sets lastMeshSync to "now" (see rebuildStateFromKV)
      expect(doInstance.meshState.lastMeshSync).toBeGreaterThan(staleSync);
    });

    it('skips rebuild when lastSync is fresh (< 5 min)', async () => {
      const { state, env, storage } = createMockDO();

      // Simulate fresh lastSync (<5 min ago)
      const freshSync = Date.now() - 2 * 60 * 1000;
      storage.set('state', {
        level: 2,
        lastCheck: freshSync,
        pendingLevel: null,
        hysteresisCount: 0,
        mesh: {
          careScore: 0.8,
          qFactor: 0.5,
          activeMinutes: 30,
          vertices: { will: { status: 'active', lastSeen: Date.now() } },
          lastMeshSync: freshSync
        }
      });

      const { EventBusDO } = await import('../orchestrator-event-bus.js');
      const doInstance = new EventBusDO(state as any, env as any);
      await drainDOInit();

      // Should NOT rebuild (fresh sync) — lastMeshSync stays loaded from DO storage
      expect(doInstance.meshState.lastMeshSync).toBe(freshSync);
    });
  });

  describe('State Rebuild from KV', () => {
    it('rebuilds state correctly from KV data', async () => {
      const { state, env } = createMockDO();

      // Mock KV returning spoons and mesh state
      env.SPOONS_KV.get = vi.fn().mockImplementation((key: string) => {
        if (key === 'spoons:will') return Promise.resolve('5');
        if (key === 'mesh:state') {
          return Promise.resolve(JSON.stringify({
            careScore: 0.9,
            qFactor: 0.7,
            activeMinutes: 45,
            vertices: { will: { status: 'active', lastSeen: Date.now() } }
          }));
        }
        return Promise.resolve(null);
      });

      const { EventBusDO } = await import('../orchestrator-event-bus.js');
      const doInstance = new EventBusDO(state as any, env as any);

      // Call rebuild
      await doInstance.rebuildStateFromKV();

      // Verify state was rebuilt
      expect(doInstance.meshState.careScore).toBe(0.9);
      expect(doInstance.meshState.qFactor).toBe(0.7);
      expect(doInstance.meshState.activeMinutes).toBe(45);
      expect(doInstance.meshState.lastMeshSync).toBeGreaterThan(0);
    });

    it('handles missing KV data gracefully', async () => {
      const { state, env } = createMockDO();

      // Mock KV returning null
      env.SPOONS_KV.get = vi.fn().mockResolvedValue(null);

      const { EventBusDO } = await import('../orchestrator-event-bus.js');
      const doInstance = new EventBusDO(state as any, env as any);

      // Should not throw
      await expect(doInstance.rebuildStateFromKV()).resolves.not.toThrow();

      // Should have default values
      expect(doInstance.meshState.careScore).toBe(0.5); // Default
    });
  });

  describe('State Consistency After Restart', () => {
    it('maintains guardrail level across simulated restart', async () => {
      const { state, env, storage } = createMockDO();

      // First instantiation - set state
      const { EventBusDO: DO1 } = await import('../orchestrator-event-bus.js');
      const do1 = new DO1(state as any, env as any);
      do1.currentGuardrailLevel = 2;
      do1.pendingLevel = null;
      do1.hysteresisCount = 0;
      do1.meshState = {
        careScore: 0.9,
        qFactor: 0.6,
        activeMinutes: 60,
        vertices: { will: { status: 'active', lastSeen: Date.now() } },
        lastMeshSync: Date.now()
      };

      // Persist state
      await state.storage.put('state', {
        level: do1.currentGuardrailLevel,
        lastCheck: Date.now(),
        pendingLevel: do1.pendingLevel,
        hysteresisCount: do1.hysteresisCount,
        mesh: do1.meshState
      });

      // Simulate restart - new DO instance
      const { EventBusDO: DO2 } = await import('../orchestrator-event-bus.js');
      const do2 = new DO2(state as any, env as any);
      await drainDOInit();

      // State should be restored
      expect(do2.currentGuardrailLevel).toBe(2);
      expect(do2.meshState.careScore).toBe(0.9);
      expect(do2.meshState.qFactor).toBe(0.6);
    });
  });
});
