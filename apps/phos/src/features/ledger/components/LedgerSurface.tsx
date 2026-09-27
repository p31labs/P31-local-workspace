import { useState } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';

interface Transaction {
  id: string;
  type: 'mint' | 'transfer' | 'receive' | 'attest';
  amount: number;
  description: string;
  timestamp: number;
}

const sampleTransactions: Transaction[] = [
  { id: '1', type: 'attest', amount: 10, description: 'Care attestation verified', timestamp: Date.now() - 3600000 },
  { id: '2', type: 'receive', amount: 5, description: 'Virtual hug from Sarah', timestamp: Date.now() - 7200000 },
  { id: '3', type: 'mint', amount: 20, description: 'Daily wellness check completed', timestamp: Date.now() - 86400000 },
];

export function LedgerSurface() {
  const [transactions] = useState<Transaction[]>(() => {
    try {
      const stored = localStorage.getItem('phos:ledger');
      return stored ? JSON.parse(stored) : sampleTransactions;
    } catch { return sampleTransactions; }
  });
  const [filter, setFilter] = useState<'all' | 'mint' | 'transfer' | 'receive' | 'attest'>('all');

  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  const typeColor = (t: Transaction['type']) => {
    switch (t) {
      case 'mint': return 'text-quantum-green';
      case 'receive': return 'text-quantum-cyan';
      case 'attest': return 'text-quantum-violet';
      case 'transfer': return 'text-quantum-gold';
    }
  };

  const typeIcon = (t: Transaction['type']) => {
    switch (t) {
      case 'mint': return '✨';
      case 'receive': return '💌';
      case 'attest': return '📝';
      case 'transfer': return '→';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="ledgerSurface" data-mcp-state={filter}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Ledger</h1>
        <p className="text-cloud/50 text-sm">LOVE token transactions and care attestations.</p>
      </GlassCard>

      <GlassCard className="p-6 text-center" strong>
        <p className="text-cloud/40 text-xs mb-1">Total LOVE</p>
        <p className="text-4xl font-bold text-quantum-cyan font-mono-tech">{total}</p>
        <p className="text-cloud/30 text-xs mt-1 font-mono-tech">LOVE tokens</p>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex gap-2 mb-4 flex-wrap">
          {(['all', 'mint', 'receive', 'attest', 'transfer'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                filter === f ? 'border-quantum-cyan/30 text-quantum-cyan bg-quantum-cyan/10' : 'border-white/10 text-cloud/40 hover:border-white/20'
              }`}
              data-mcp-tool="setLedgerFilter" data-mcp-target={`ledger-filter-${f}`} data-mcp-state={filter === f ? 'active' : 'inactive'}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map(tx => (
            <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-void-surface/50 border border-white/[0.04]">
              <span className="text-lg">{typeIcon(tx.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-ink truncate">{tx.description}</p>
                <p className="text-xs text-cloud/30 font-mono-tech">{new Date(tx.timestamp).toLocaleString()}</p>
              </div>
              <p className={`text-sm font-bold font-mono-tech ${typeColor(tx.type)}`}>
                {tx.type === 'transfer' ? '-' : '+'}{tx.amount}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
