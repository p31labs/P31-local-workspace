import { useEffect, useRef, useState } from 'react';

export type WorkerHealthStatus = 'healthy' | 'degraded' | 'offline';

export interface WorkerHealthEntry {
  id: string;
  name: string;
  status: WorkerHealthStatus;
  latency: number | null;
}

const WORKER_HEALTH_ENDPOINTS: { id: string; name: string; url: string }[] = [
  { id: 'vibe-generate', name: 'Vibe Generate', url: 'https://vibe-generate.trimtab-signal.workers.dev/health' },
  { id: 'app-supervisor', name: 'App Supervisor', url: 'https://app-supervisor.trimtab-signal.workers.dev/health' },
  { id: 'portal-chat', name: 'Portal Chat', url: 'https://portal-chat.trimtab-signal.workers.dev/health' },
  { id: 'ledger-bridge', name: 'Ledger Bridge', url: 'https://ledger-bridge.trimtab-signal.workers.dev/health' },
  { id: 'federation-bridge', name: 'Federation Bridge', url: 'https://federation-bridge.trimtab-signal.workers.dev/health' },
  { id: 'agent-runtime', name: 'Agent Runtime', url: 'https://agent-runtime.trimtab-signal.workers.dev/health' },
  { id: 'care-mesh', name: 'Care Mesh', url: 'https://care-mesh.trimtab-signal.workers.dev/health' },
];

const POLL_MS = 10_000;
const MAX_BACKOFF = 4;
const TIMEOUT_MS = 5000;

async function probe(worker: { id: string; name: string; url: string }): Promise<WorkerHealthEntry> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(worker.url, { cache: 'no-store', signal: controller.signal });
    window.clearTimeout(timer);
    const latency = Math.round(performance.now() - start);
    if (!res.ok) {
      return { id: worker.id, name: worker.name, status: 'offline', latency: null };
    }
    let degraded = false;
    try {
      const body = (await res.json()) as { healthy?: boolean; status?: string; ok?: boolean };
      degraded = !!(body && (body.healthy === false || body.status === 'degraded' || body.ok === false));
    } catch {
      degraded = false;
    }
    return {
      id: worker.id,
      name: worker.name,
      status: degraded ? 'degraded' : 'healthy',
      latency,
    };
  } catch {
    return { id: worker.id, name: worker.name, status: 'offline', latency: null };
  }
}

export function useWorkerHealth(): Record<string, WorkerHealthEntry> {
  const [health, setHealth] = useState<Record<string, WorkerHealthEntry>>({});
  const stateRef = useRef<{
    nextProbeAt: Record<string, number>;
    failures: Record<string, number>;
  }>({ nextProbeAt: {}, failures: {} });

  useEffect(() => {
    let alive = true;
    let interval: number | null = null;

    const poll = async () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      const now = Date.now();
      const state = stateRef.current;
      const due = WORKER_HEALTH_ENDPOINTS.filter((w) => (state.nextProbeAt[w.id] ?? 0) <= now);
      const dueIds = new Set(due.map((w) => w.id));

      const results = await Promise.allSettled(due.map(probe));
      if (!alive) return;

      setHealth((prev) => {
        const next = { ...prev };
        results.forEach((r) => {
          if (r.status !== 'fulfilled') return;
          const entry = r.value;
          if (entry.status === 'offline') {
            const failures = (state.failures[entry.id] ?? 0) + 1;
            state.failures[entry.id] = failures;
            state.nextProbeAt[entry.id] = now + POLL_MS * Math.pow(2, Math.min(failures, MAX_BACKOFF));
          } else {
            state.failures[entry.id] = 0;
            state.nextProbeAt[entry.id] = now + POLL_MS;
          }
          next[entry.id] = entry;
        });
        return next;
      });
    };

    poll();
    interval = window.setInterval(poll, POLL_MS);
    return () => {
      alive = false;
      if (interval) window.clearInterval(interval);
    };
  }, []);

  return health;
}
