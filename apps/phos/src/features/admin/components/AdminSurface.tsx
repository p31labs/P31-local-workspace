import { useState } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: number;
  details: string;
  level: 'info' | 'warn' | 'error';
}

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

const sampleLogs: AuditLog[] = [
  { id: '1', action: 'User login', user: 'sarah@p31.org', timestamp: Date.now() - 3600000, details: 'Successful authentication via DID:key', level: 'info' },
  { id: '2', action: 'Care attestation', user: 'dr.chen@p31.org', timestamp: Date.now() - 7200000, details: 'Attestation issued for user #14', level: 'info' },
  { id: '3', action: 'Worker restart', user: 'system', timestamp: Date.now() - 10800000, details: 'love-ledger worker restarted due to D1 timeout', level: 'warn' },
  { id: '4', action: 'Failed login', user: 'unknown', timestamp: Date.now() - 14400000, details: 'Invalid DID signature from 0x...', level: 'error' },
  { id: '5', action: 'Data export', user: 'admin@p31.org', timestamp: Date.now() - 86400000, details: 'Full vault export to R2', level: 'info' },
];

const defaultFlags: FeatureFlag[] = [
  { id: '1', name: 'WebLLM', enabled: false, description: 'On-device AI inference' },
  { id: '2', name: 'PGLite', enabled: false, description: 'Local-first PostgreSQL' },
  { id: '3', name: 'Three.js', enabled: true, description: '3D visualisations' },
  { id: '4', name: 'Collaboration', enabled: false, description: 'Real-time Yjs collab' },
  { id: '5', name: 'Taler', enabled: false, description: 'GNU Taler payments' },
  { id: '6', name: 'MCP Tools', enabled: true, description: 'Model Context Protocol tools' },
];

export function AdminSurface() {
  const [logs] = useState<AuditLog[]>(sampleLogs);
  const [flags, setFlags] = useState<FeatureFlag[]>(defaultFlags);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const toggleFlag = (id: string) => {
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  const filteredLogs = logFilter === 'all' ? logs : logs.filter(l => l.level === logFilter);

  const levelColor = (level: AuditLog['level']) => {
    switch (level) {
      case 'info': return 'text-quantum-cyan';
      case 'warn': return 'text-quantum-gold';
      case 'error': return 'text-red-400';
    }
  };

  const levelDot = (level: AuditLog['level']) => {
    switch (level) {
      case 'info': return 'bg-quantum-cyan';
      case 'warn': return 'bg-quantum-gold';
      case 'error': return 'bg-red-400';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="adminSurface" data-mcp-state={logFilter}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Admin</h1>
        <p className="text-cloud/50 text-sm">System management and audit logs.</p>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-4">Feature Flags</h2>
        <div className="space-y-2">
          {flags.map(f => (
            <button
              key={f.id}
              onClick={() => toggleFlag(f.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-void-surface/50 border border-white/[0.04] hover:border-white/[0.08] transition-colors text-left"
              data-mcp-tool="toggleFlag"
              data-mcp-target={`flag-${f.id}`}
              data-mcp-state={f.enabled ? 'on' : 'off'}
            >
              <div>
                <p className="text-sm text-ink">{f.name}</p>
                <p className="text-xs text-cloud/40">{f.description}</p>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${f.enabled ? 'bg-quantum-green/30' : 'bg-white/10'}`}>
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${f.enabled ? 'left-4.5 bg-quantum-green' : 'left-0.5 bg-cloud/40'}`} />
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink">Audit Logs</h2>
          <div className="flex gap-1">
            {(['all', 'info', 'warn', 'error'] as const).map(f => (
              <button
                key={f}
                onClick={() => setLogFilter(f)}
                className={`px-2 py-1 rounded text-xs border transition-colors ${
                  logFilter === f ? 'border-quantum-cyan/30 text-quantum-cyan bg-quantum-cyan/10' : 'border-white/10 text-cloud/40'
                }`}
                data-mcp-tool="setLogFilter"
                data-mcp-target={`filter-${f}`}
                data-mcp-state={logFilter === f ? 'active' : 'inactive'}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-3 rounded-xl bg-void-surface/50 border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2 h-2 rounded-full ${levelDot(log.level)}`} />
                <p className="text-sm text-ink font-semibold">{log.action}</p>
                <span className={`text-xs font-mono-tech ${levelColor(log.level)}`}>{log.level}</span>
              </div>
              <p className="text-xs text-cloud/40 ml-4">{log.details}</p>
              <div className="flex items-center gap-2 ml-4 mt-1">
                <span className="text-xs text-cloud/30">{log.user}</span>
                <span className="text-xs text-cloud/20 font-mono-tech">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
