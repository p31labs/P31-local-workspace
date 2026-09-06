import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { fetchTelemetryFrom, activeSource, type TelemetrySource } from '../lib/telemetrySource';
import { snapshotAlive } from '../lib/mockTelemetry';
import { type DashboardData } from '../lib/mapTopology';
import { notify } from './notificationStore';

export type Status = 'idle' | 'loading' | 'ok' | 'degraded';

interface TelemetryState {
  data: DashboardData | null;
  lastFetched: number;
  status: Status;
  error: string | null;
  unreachable: boolean;
  source: TelemetrySource;
  setSource: (s: TelemetrySource) => void;
  fetchTelemetry: () => Promise<void>;
  retry: () => void;
}

const CACHE_KEY = 'tetra-telemetry';

const SEED: DashboardData = {
  vertices: [
    { id: 1, host: 'p31ca.org', role: 'Apex — Technical Hub', accent: 'gold', alive: false, edges: ['E1', 'E2', 'E3'] },
    { id: 2, host: 'phosphorus31.org', role: 'Nonprofit Portal', accent: 'cyan', alive: false, edges: ['E1', 'E4', 'E5'] },
    { id: 3, host: 'phos.p31ca.org', role: 'Ambient Workspace', accent: 'violet', alive: false, edges: ['E2', 'E4', 'E6'] },
    { id: 4, host: 'willow.p31ca.org', role: 'Quantum Companion', accent: 'green', alive: false, edges: ['E3', 'E5', 'E6'] },
  ],
  edges: [
    { id: 'E1', from: 1, to: 2, label: 'Hub ↔ NP' },
    { id: 'E2', from: 1, to: 3, label: 'Hub ↔ OS' },
    { id: 'E3', from: 1, to: 4, label: 'Hub ↔ Willow' },
    { id: 'E4', from: 2, to: 3, label: 'NP ↔ OS' },
    { id: 'E5', from: 2, to: 4, label: 'NP ↔ Willow' },
    { id: 'E6', from: 3, to: 4, label: 'OS ↔ Willow' },
  ],
  stats: { vertices: 4, edges: 6, rigid: true, gatheredAt: null },
};

let prevAlive: Record<number, boolean> | null = null;

function diffAlive(next: DashboardData) {
  if (!prevAlive) {
    prevAlive = snapshotAlive(next);
    return;
  }
  const now = snapshotAlive(next);
  for (const v of next.vertices) {
    const was = prevAlive[v.id];
    if (was === v.alive) continue;
    if (v.alive) {
      notify({ severity: 'success', title: `V${v.id} recovered`, message: `${v.host} is back online.` });
    } else {
      notify({ severity: 'error', title: `V${v.id} down`, message: `${v.host} is unreachable.` });
    }
  }
  prevAlive = now;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  data: SEED,
  lastFetched: 0,
  status: 'idle',
  error: null,
  unreachable: false,
  source: activeSource(),

  setSource: (s) => {
    set({ source: s, unreachable: false, error: null });
    void get().fetchTelemetry();
  },

  fetchTelemetry: async () => {
    if (get().unreachable) return;
    set({ status: 'loading' });
    const source = get().source;
    try {
      const data = await fetchTelemetryFrom(source);
      await idbSet(CACHE_KEY, data).catch(() => undefined);
      diffAlive(data);
      const wasUnreachable = get().unreachable;
      set({ data, lastFetched: Date.now(), status: 'ok', error: null, unreachable: false });
      if (wasUnreachable && source === 'mock') {
        notify({ severity: 'success', title: 'Telemetry reconnected', message: 'Live feed restored.' });
      }
    } catch (err) {
      const cached = (await idbGet(CACHE_KEY)) as DashboardData | undefined;
      const msg = err instanceof Error ? err.message : 'fetch-failed';
      set({
        data: cached ?? get().data ?? SEED,
        status: cached ? 'degraded' : 'idle',
        error: msg,
        unreachable: true,
      });
      if (msg === 'worker-unreachable') {
        notify({ severity: 'warning', title: 'Worker unreachable', message: 'Showing cached seed topology.' });
      }
    }
  },

  retry: () => {
    set({ unreachable: false, status: 'idle' });
    void get().fetchTelemetry();
  },
}));
