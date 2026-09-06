import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface EscrowStatusProps {
  escrowId: string;
  status: 'LOCKED' | 'PENDING_CONSENSUS' | 'RELEASED' | 'DISPUTED';
  approvals: string[];
  required: number;
  amount: number;
}

export function EscrowStatus({ escrowId, status, approvals, required, amount }: EscrowStatusProps) {
  const progress = Math.min(100, ((approvals.length / required) * 100));

  const statusConfig = {
    LOCKED: { color: 'text-quantum-amber', bg: 'bg-quantum-amber/10', label: 'Locked' },
    PENDING_CONSENSUS: { color: 'text-quantum-cyan', bg: 'bg-quantum-cyan/10', label: 'Awaiting Signatures' },
    RELEASED: { color: 'text-quantum-green', bg: 'bg-quantum-green/10', label: 'Released' },
    DISPUTED: { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Disputed' },
  };

  const config = statusConfig[status] || statusConfig.LOCKED;

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-ink">Escrow</h3>
        <span className={`text-xs px-3 py-1 rounded-full ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-cloud/40 mb-1">Amount</p>
        <p className="text-2xl font-bold text-quantum-rose font-mono-tech">{amount} LOVE</p>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-cloud/40">Signatures</span>
          <span className="text-cloud/60">{approvals.length} / {required}</span>
        </div>
        <div className="w-full bg-void-surface/50 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-quantum-cyan rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-cloud/40">Approvals</p>
        {approvals.map((did, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-4 h-4 rounded-full bg-quantum-green/20 text-quantum-green flex items-center justify-center">✓</span>
            <span className="text-cloud/60 font-mono">{did.slice(0, 12)}...{did.slice(-4)}</span>
          </div>
        ))}
        {Array.from({ length: required - approvals.length }).map((_, i) => (
          <div key={`pending-${i}`} className="flex items-center gap-2 text-xs">
            <span className="w-4 h-4 rounded-full bg-white/5 text-cloud/30 flex items-center justify-center">○</span>
            <span className="text-cloud/30">Awaiting signature...</span>
          </div>
        ))}
      </div>

      {status === 'LOCKED' && (
        <GlowButton color="cyan" className="w-full mt-4">
          Sign to Release
        </GlowButton>
      )}
    </GlassCard>
  );
}
