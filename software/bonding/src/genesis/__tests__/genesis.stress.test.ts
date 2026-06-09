// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Genesis Block: High-Frequency Stress Tests (WCD-41)
//
// Tests the eventBus, economyStore, and telemetryStore
// under rapid-fire concurrent loads. Verifies:
//   - DAILY_ATOM_CAP enforcement under 100× abuse
//   - spoon clamping (0–12)
//   - eventBus error isolation (SUBSAFE guarantee)
//   - NAV_SELECT dispatch and cleanup
//   - Telemetry no-op guard when uninitialized
//   - 30s incremental flush sends correct event delta
//   - No double-flush of already-sent events
//
// NOTE: telemetryStore is a pure module (not Zustand).
// State is reset via telemetryInit() / telemetryCleanup().
// idb-keyval is mocked — no real IndexedDB in jsdom.
// ═══════════════════════════════════════════════════════

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { eventBus, GameEventType } from '../eventBus';
import { useEconomyStore } from '../economyStore';
import { telemetryInit, telemetryAddEvent, telemetryCleanup } from '../telemetryStore';

// ── idb-keyval mock ────────────────────────────────────

vi.mock('idb-keyval', () => ({
  get: vi.fn().mockResolvedValue(undefined),
  set: vi.fn().mockResolvedValue(undefined),
}));

// ── Shared config ──────────────────────────────────────

const STRESS_CONFIG = {
  sessionId: 'stress-session-01',
  playerId: 'stress-tester-01',
  playerName: 'Tyler',
  roomCode: 'TYLER7',
  relayUrl: 'https://relay.test.local',
};

// ── Test suite ─────────────────────────────────────────

describe('Genesis Block: High-Frequency Stress Tests (WCD-41)', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();

    mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    vi.stubGlobal('navigator', {
      ...globalThis.navigator,
      sendBeacon: vi.fn(),
      vibrate: vi.fn(),
    });

    // Reset economy store to clean session baseline
    useEconomyStore.setState({
      totalLove: 0,
      currentStreak: 1,
      lastActiveDate: null,
      dailyAtomCount: 0,
      _hasHydrated: true,
      spoons: 12,
    });
  });

  afterEach(() => {
    telemetryCleanup(); // nulls sessionId, clears interval, fires seal (void)
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // ════════════════════════════════════════════════════
  // economyStore
  // ════════════════════════════════════════════════════

  describe('economyStore — DAILY_ATOM_CAP enforcement', () => {
    it('caps dailyAtomCount at 50 under 100 rapid-fire _onAtomPlaced calls', () => {
      const { _onAtomPlaced } = useEconomyStore.getState();
      for (let i = 0; i < 100; i++) _onAtomPlaced();

      const { dailyAtomCount, totalLove } = useEconomyStore.getState();
      expect(dailyAtomCount).toBe(50);
      expect(totalLove).toBe(50); // 1 LOVE per atom, capped at 50
    });

    it('rejects all further love increments after cap is reached', () => {
      const { _onAtomPlaced } = useEconomyStore.getState();

      for (let i = 0; i < 60; i++) _onAtomPlaced(); // saturate at 50
      const atCap = useEconomyStore.getState().totalLove;

      for (let i = 0; i < 50; i++) _onAtomPlaced(); // 50 more — should all be no-ops
      const afterAbuse = useEconomyStore.getState().totalLove;

      expect(atCap).toBe(50);
      expect(afterAbuse).toBe(50); // unchanged
    });

    it('molecule completions still add love beyond the atom cap', () => {
      const { _onAtomPlaced, _onMoleculeCompleted } = useEconomyStore.getState();
      for (let i = 0; i < 100; i++) _onAtomPlaced(); // saturate atom cap

      _onMoleculeCompleted(); // +10 LOVE (no cap on molecules)

      expect(useEconomyStore.getState().totalLove).toBe(60);
    });
  });

  describe('economyStore — spoon clamping', () => {
    it('clamps setSpoons to [0, 12]', () => {
      const { setSpoons } = useEconomyStore.getState();

      setSpoons(-999);
      expect(useEconomyStore.getState().spoons).toBe(0);

      setSpoons(999);
      expect(useEconomyStore.getState().spoons).toBe(12);

      setSpoons(7);
      expect(useEconomyStore.getState().spoons).toBe(7);
    });

    it('jitter factor collapses to 0 at spoons=2, expands to 1 at spoons=12', () => {
      const jitterFactor = (spoons: number) =>
        Math.min(1, Math.max(0, (spoons - 4) / 8));

      const { setSpoons } = useEconomyStore.getState();

      setSpoons(2);
      expect(jitterFactor(useEconomyStore.getState().spoons)).toBe(0);

      setSpoons(12);
      expect(jitterFactor(useEconomyStore.getState().spoons)).toBe(1);

      setSpoons(8);
      expect(jitterFactor(useEconomyStore.getState().spoons)).toBe(0.5);
    });
  });

  // ════════════════════════════════════════════════════
  // eventBus
  // ════════════════════════════════════════════════════

  describe('eventBus — error isolation (SUBSAFE guarantee)', () => {
    it('swallows a throwing listener — subsequent listeners still fire', () => {
      const good = vi.fn();
      const unsub1 = eventBus.on(GameEventType.MOLECULE_COMPLETED, () => {
        throw new Error('deliberate kaboom');
      });
      const unsub2 = eventBus.on(GameEventType.MOLECULE_COMPLETED, good);

      expect(() =>
        eventBus.emit(GameEventType.MOLECULE_COMPLETED, {
          moleculeId: 'm1', formula: 'H2O', displayName: 'Water',
          atomCount: 3, difficulty: 'easy', buildTimeMs: 1000, stability: 1,
        }),
      ).not.toThrow();

      expect(good).toHaveBeenCalledOnce();
      unsub1(); unsub2();
    });

    it('500 synchronous ATOM_PLACED emits do not throw', () => {
      const payload = {
        element: 'C', moleculeId: 'mol-stress',
        position: { x: 0, y: 0, z: 0 }, bondSiteIndex: 0,
      };

      expect(() => {
        for (let i = 0; i < 500; i++) eventBus.emit(GameEventType.ATOM_PLACED, payload);
      }).not.toThrow();
    });
  });

  describe('eventBus — NAV_SELECT dispatch', () => {
    it('delivers NAV_SELECT payload intact', () => {
      const handler = vi.fn();
      const unsub = eventBus.on(GameEventType.NAV_SELECT, handler);

      eventBus.emit(GameEventType.NAV_SELECT, {
        pod: 'calcium', label: 'SHELTER', href: '#shelter', vertexId: 'ca_1',
      });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({
        pod: 'calcium', label: 'SHELTER', href: '#shelter', vertexId: 'ca_1',
      });
      unsub();
    });

    it('unsubscribe prevents further delivery', () => {
      const handler = vi.fn();
      const unsub = eventBus.on(GameEventType.NAV_SELECT, handler);
      unsub();

      eventBus.emit(GameEventType.NAV_SELECT, {
        pod: 'nitrogen', label: 'CREATION', href: '#creation', vertexId: 'n_1',
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('all four pod NAV_SELECT events dispatch without error', () => {
      const handler = vi.fn();
      const unsub = eventBus.on(GameEventType.NAV_SELECT, handler);

      const pods = [
        { pod: 'calcium',    label: 'SHELTER',     href: '#shelter',     vertexId: 'ca_1' },
        { pod: 'phosphorus', label: 'TASKS',        href: '#tasks',       vertexId: 'p_1'  },
        { pod: 'oxygen',     label: 'ENVIRONMENT',  href: '#environment', vertexId: 'o_1'  },
        { pod: 'nitrogen',   label: 'CREATION',     href: '#creation',    vertexId: 'n_1'  },
      ];

      for (const p of pods) eventBus.emit(GameEventType.NAV_SELECT, p);

      expect(handler).toHaveBeenCalledTimes(4);
      unsub();
    });
  });

  // ════════════════════════════════════════════════════
  // telemetryStore
  // ════════════════════════════════════════════════════

  describe('telemetryStore — uninitialized guard', () => {
    it('is a no-op before telemetryInit — fetch is never triggered', async () => {
      // sessionId is null after afterEach cleanup; no telemetryInit() here
      await telemetryAddEvent('atom_placed', { element: 'C' });
      await vi.advanceTimersByTimeAsync(30_000);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('telemetryStore — 30s incremental flush', () => {
    it('flushes all events in one POST after the 30s tick', async () => {
      telemetryInit(STRESS_CONFIG);

      for (let i = 0; i < 10; i++) {
        await telemetryAddEvent('atom_placed', { index: i });
      }

      await vi.advanceTimersByTimeAsync(30_000);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('https://relay.test.local/telemetry');

      const body = JSON.parse(options.body as string) as {
        sessionId: string;
        events: Array<{ seq: number }>;
      };
      expect(body.sessionId).toBe('stress-session-01');
      expect(body.events).toHaveLength(10);
      expect(body.events[0].seq).toBe(0);
      expect(body.events[9].seq).toBe(9);
    });

    it('second tick sends nothing when no new events were added', async () => {
      telemetryInit(STRESS_CONFIG);

      for (let i = 0; i < 5; i++) {
        await telemetryAddEvent('ping_sent', { i });
      }

      await vi.advanceTimersByTimeAsync(30_000); // flush 5 events
      expect(mockFetch).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(30_000); // nothing new → early return
      expect(mockFetch).toHaveBeenCalledTimes(1); // still 1, not 2
    });

    it('second flush sends only the delta since last flush', async () => {
      telemetryInit(STRESS_CONFIG);

      // First batch
      for (let i = 0; i < 3; i++) await telemetryAddEvent('atom_placed', { i });
      await vi.advanceTimersByTimeAsync(30_000); // flush seq 0–2

      // Second batch
      for (let i = 3; i < 6; i++) await telemetryAddEvent('atom_placed', { i });
      await vi.advanceTimersByTimeAsync(30_000); // flush seq 3–5

      expect(mockFetch).toHaveBeenCalledTimes(2);

      const [, secondOptions] = mockFetch.mock.calls[1] as [string, RequestInit];
      const secondBody = JSON.parse(secondOptions.body as string) as {
        events: Array<{ seq: number }>;
      };
      expect(secondBody.events).toHaveLength(3);
      expect(secondBody.events[0].seq).toBe(3);
      expect(secondBody.events[2].seq).toBe(5);
    });

    it('each event carries a monotonically incrementing seq', async () => {
      telemetryInit(STRESS_CONFIG);

      for (let i = 0; i < 8; i++) {
        await telemetryAddEvent('difficulty_changed', { from: null, to: 'hard' });
      }

      await vi.advanceTimersByTimeAsync(30_000);

      const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
      const { events } = JSON.parse(options.body as string) as {
        events: Array<{ seq: number }>;
      };

      for (let i = 0; i < events.length; i++) {
        expect(events[i].seq).toBe(i);
      }
    });
  });
});
