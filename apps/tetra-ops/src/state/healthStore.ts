import { create } from 'zustand';

export interface WorkerEntry {
  name: string;
  desc: string;
  url: string;
  binding: string;
}

export const WORKERS: WorkerEntry[] = [
  { name: 'love-ledger',    desc: 'LOVE balance, transfers, arcade scores',         url: 'https://love-ledger.p31ca.org/health',           binding: 'love-ledger' },
  { name: 'intent-resolver',desc: 'Spoon-gated difficulty + creation quotes',       url: 'https://intent-resolver.trimtab-signal.workers.dev/health', binding: 'intent-resolver' },
  { name: 'federation-bridge', desc: 'ActivityPub + SD-JWT VCs + DID Document',    url: 'https://federation.p31ca.org/health',             binding: 'federation-bridge' },
  { name: 'genesis-gate',   desc: 'Central telemetry event bus',                    url: 'https://genesis-gate.trimtab-signal.workers.dev/health', binding: 'genesis-gate' },
  { name: 'ledger-bridge',  desc: 'On-chain attestation relay (Base Sepolia)',      url: 'https://ledger-bridge.trimtab-signal.workers.dev/health', binding: 'ledger-bridge' },
  { name: 'creation-accountant', desc: 'Spoon-delta settlement + receipts',         url: 'https://creation-accountant.trimtab-signal.workers.dev/health', binding: 'creation-accountant' },
  { name: 'care-mesh',      desc: 'Privacy-preserving care data mesh',              url: 'https://care-mesh.trimtab-signal.workers.dev/health', binding: 'care-mesh' },
  { name: 'agent-runtime',  desc: 'Agents SDK notification + care report tools',    url: 'https://agent-runtime.trimtab-signal.workers.dev/health', binding: 'agent-runtime' },
  { name: 'p31-mcp-server', desc: 'MCP front door for P31 tools',                   url: 'https://p31-mcp-server.trimtab-signal.workers.dev/health', binding: 'p31-mcp-server' },
  { name: 'phos-backup',    desc: 'Daily LOVE ledger cold snapshot to R2',          url: 'https://phos-backup.trimtab-signal.workers.dev/health', binding: 'phos-backup' },
  { name: 'fawn-guard',     desc: 'Trauma/trigger pattern detection',               url: 'https://fawn-guard.trimtab-signal.workers.dev/health',  binding: 'fawn-guard' },
  { name: 'governance-engine', desc: 'Care contracts, staking, voting',             url: 'https://governance-engine.trimtab-signal.workers.dev/health', binding: 'governance-engine' },
  { name: 'contract-engine',desc: 'PQC care contracts + settlement',                url: 'https://contract-engine.trimtab-signal.workers.dev/health', binding: 'contract-engine' },
  { name: 'tetra-tools',    desc: 'Nonprofit tetra CRUD (D1)',                      url: 'https://tetra-tools.trimtab-signal.workers.dev/health', binding: 'tetra-tools' },
];

interface HealthState {
  workerHealth: Record<string, boolean | null>;
  lastChecked: number | null;
  start: () => void;
  poll: () => Promise<void>;
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export const useHealthStore = create<HealthState>((set) => ({
  workerHealth: {},
  lastChecked: null,

  start: () => {
    if (intervalId) return;
    const pollFn = () => {
      Promise.allSettled(
        WORKERS.map(async (w) => {
          const res = await fetch(w.url, { signal: AbortSignal.timeout(5000) });
          return { name: w.name, healthy: res.ok };
        })
      ).then((results) => {
        const status: Record<string, boolean | null> = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled') status[r.value.name] = r.value.healthy;
        });
        set({ workerHealth: status, lastChecked: Date.now() });
      });
    };
    pollFn();
    intervalId = setInterval(pollFn, 60000);
  },

  poll: async () => {
    const results = await Promise.allSettled(
      WORKERS.map(async (w) => {
        const res = await fetch(w.url, { signal: AbortSignal.timeout(5000) });
        return { name: w.name, healthy: res.ok };
      })
    );
    const status: Record<string, boolean | null> = {};
    results.forEach((r) => {
      if (r.status === 'fulfilled') status[r.value.name] = r.value.healthy;
    });
    set({ workerHealth: status, lastChecked: Date.now() });
  },
}));
