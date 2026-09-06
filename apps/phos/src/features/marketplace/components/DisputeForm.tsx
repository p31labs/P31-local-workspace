import { useState } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';

interface DisputeFormProps {
  tradeId: string;
  onSubmit: (evidenceHash: string, description: string) => void;
  onCancel: () => void;
}

export function DisputeForm({ tradeId, onSubmit, onCancel }: DisputeFormProps) {
  const [evidenceHash, setEvidenceHash] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceHash.trim() || !description.trim()) return;

    setLoading(true);
    try {
      await fetch('https://gateway.p31ca.org/api/marketplace/trades/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tradeId, evidence: evidenceHash, description }),
      });
      onSubmit(evidenceHash, description);
    } catch (err) {
      console.error('Failed to file dispute:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <h2 className="text-xl font-bold text-ink mb-2">File a Dispute</h2>
      <p className="text-sm text-cloud/50 mb-4">
        Disputes are resolved through our Online Dispute Resolution (ODR) system.
        Please provide evidence of the issue.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-cloud/40 block mb-1">Evidence Hash (SHA-256)</label>
          <input
            type="text"
            value={evidenceHash}
            onChange={e => setEvidenceHash(e.target.value)}
            className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink font-mono"
            placeholder="sha256:..."
            required
          />
          <p className="text-xs text-cloud/30 mt-1">
            Upload evidence to IPFS/R2 and paste the SHA-256 hash here.
          </p>
        </div>

        <div>
          <label className="text-xs text-cloud/40 block mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink"
            rows={4}
            placeholder="Describe the issue..."
            required
          />
        </div>

        <div className="flex gap-2">
          <GlowButton color="violet" type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Filing...' : 'File Dispute'}
          </GlowButton>
          <GlowButton color="ghost" onClick={onCancel}>Cancel</GlowButton>
        </div>
      </form>
    </GlassCard>
  );
}
