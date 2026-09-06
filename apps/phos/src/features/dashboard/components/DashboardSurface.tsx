import { useState, use } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface WorkerStatus {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  latency?: number;
  lastChecked?: number;
}

const workers: WorkerStatus[] = [
  { name: 'Gateway', url: 'https://gateway.p31ca.org', status: 'unknown' },
  { name: 'LOVE Ledger', url: 'https://love-ledger.p31ca.org', status: 'unknown' },
  { name: 'Federation', url: 'https://federation.p31ca.org', status: 'unknown' },
  { name: 'Status', url: 'https://status.p31ca.org', status: 'unknown' },
];

async function fetchWorkerHealth(): Promise<WorkerStatus[]> {
  const results = await Promise.allSettled(
    workers.map(async (w) => {
      const start = Date.now();
      try {
        const res = await fetch(w.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
        const latency = Date.now() - start;
        return { ...w, status: res.ok ? 'healthy' as const : 'degraded' as const, latency, lastChecked: Date.now() };
      } catch {
        return { ...w, status: 'down' as const, latency: Date.now() - start, lastChecked: Date.now() };
      }
    })
  );
  return results.map((r, i) => r.status === 'fulfilled' ? r.value : { ...workers[i], status: 'down' as const, latency: undefined, lastChecked: Date.now() });
}

export function DashboardSurface() {
  const [workerPromise, setWorkerPromise] = useState(fetchWorkerHealth);
  const workerStatuses = use(workerPromise);

  const refresh = () => setWorkerPromise(fetchWorkerHealth());

  const statusColor = (s: WorkerStatus['status']) => {
    switch (s) {
      case 'healthy': return 'text-quantum-green';
      case 'degraded': return 'text-quantum-gold';
      case 'down': return 'text-red-400';
      default: return 'text-cloud/30';
    }
  };

  const statusDot = (s: WorkerStatus['status']) => {
    switch (s) {
      case 'healthy': return 'bg-quantum-green';
      case 'degraded': return 'bg-quantum-gold';
      case 'down': return 'bg-red-400';
      default: return 'bg-cloud/20';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="dashboardSurface" data-mcp-state={workerStatuses.some(w => w.status === 'healthy') ? 'healthy' : 'degraded'}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Dashboard</h1>
        <p className="text-cloud/50 text-sm">System status and metrics.</p>
      </GlassCard>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Surfaces', value: 8, color: 'text-quantum-cyan' },
          { label: 'MCP Tools', value: 137, color: 'text-quantum-violet' },
          { label: 'Uptime', value: '99.7%', color: 'text-quantum-green' },
        ].map(m => (
          <GlassCard key={m.label} className="p-4 text-center">
            <p className={`text-2xl font-bold font-mono-tech ${m.color}`}>{m.value}</p>
            <p className="text-cloud/40 text-xs mt-1">{m.label}</p>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Workers</h2>
          <GlowButton color="cyan" size="sm" onClick={refresh} data-mcp-tool="refreshDashboard" data-mcp-type="action" data-mcp-target="dashboard-refresh">Refresh</GlowButton>
        </div>
        <div className="space-y-2">
          {workerStatuses.map(w => (
            <div key={w.name} className="flex items-center gap-3 p-3 rounded-xl bg-void-surface/50 border border-white/[0.04]">
              <div className={`w-2.5 h-2.5 rounded-full ${statusDot(w.status)}`} />
              <div className="flex-1">
                <p className="text-sm text-ink">{w.name}</p>
                <p className="text-xs text-cloud/30 font-mono-tech">{w.url}</p>
              </div>
              <div className="text-right">
                <p className={`text-xs font-mono-tech ${statusColor(w.status)}`}>{w.status}</p>
                {w.latency != null && (
                  <p className="text-xs text-cloud/30 font-mono-tech">{w.latency}ms</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-3">Quick Links</h2>
        <div className="grid grid-cols-2 gap-3">
          <GlowButton color="cyan" onClick={() => window.open('https://status.p31ca.org', '_blank')}>Status Page</GlowButton>
          <GlowButton color="violet" onClick={() => window.location.href = '/developer'}>Developer</GlowButton>
          <GlowButton color="gold" onClick={() => window.location.href = '/ledger'}>LOVE Ledger</GlowButton>
          <GlowButton color="green" onClick={() => window.location.href = '/settings'}>Settings</GlowButton>
        </div>
      </GlassCard>
    </div>
  );
}
