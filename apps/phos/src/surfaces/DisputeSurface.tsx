import React, { useState, useCallback } from 'react';
import { generateAuthToken } from '../lib/did-auth';

const K4_CORE = 'https://k4-cage.trimtab-signal.workers.dev';

interface DisputeRecord {
  id: string;
  settlementId: string;
  fromVertex: string;
  toVertex: string;
  reason: string;
  status: string;
  createdAt: string;
}

export function DisputeSurface() {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [did, setDid] = useState('');
  const [signingKey, setSigningKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settlementId, setSettlementId] = useState('');

  const fetchDisputes = useCallback(async () => {
    if (!settlementId || !did || !signingKey) return;
    setLoading(true);
    setError(null);
    try {
      const token = await generateAuthToken(did, signingKey, JSON.stringify({ settlementId }));
      const res = await fetch(`${K4_CORE}/api/dispute/list?settlementId=${encodeURIComponent(settlementId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDisputes(data.disputes ?? []);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch disputes');
    } finally {
      setLoading(false);
    }
  }, [settlementId, did, signingKey]);

  return (
    <div className="space-y-4 w-full">
      <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center">
        DISPUTE // Justice Wire
      </div>

      <div className="flex gap-2">
        <input
          placeholder="Your DID"
          value={did}
          onChange={(e) => setDid(e.target.value)}
          className="flex-1 px-3 py-2 text-[10px] font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
        />
        <input
          placeholder="Signing key (hex)"
          value={signingKey}
          onChange={(e) => setSigningKey(e.target.value)}
          type="password"
          className="flex-1 px-3 py-2 text-[10px] font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
        />
      </div>

      <div className="flex gap-2">
        <input
          placeholder="Settlement ID"
          value={settlementId}
          onChange={(e) => setSettlementId(e.target.value)}
          className="flex-1 px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
        />
        <button
          onClick={fetchDisputes}
          disabled={loading || !settlementId || !did || !signingKey}
          className="px-3 py-2 text-xs font-mono border border-purple-500/30 rounded text-purple-300 hover:bg-purple-950/20 disabled:opacity-40"
        >
          {loading ? '...' : 'Fetch'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      {!loading && disputes.length === 0 && settlementId && (
        <p className="text-xs text-slate-500 text-center">No disputes found.</p>
      )}

      {disputes.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {disputes.map((d) => (
            <div key={d.id} className="p-3 border border-purple-500/10 bg-black/30 rounded text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-purple-300">{d.fromVertex} &rarr; {d.toVertex}</span>
                <span className={d.status === 'filed' ? 'text-amber-400' : 'text-green-400'}>{d.status}</span>
              </div>
              <p className="text-slate-400">{d.reason}</p>
              <p className="text-[10px] text-slate-600">{new Date(d.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}

      {!settlementId && (
        <p className="text-xs text-slate-500 text-center">
          Enter a Settlement ID to view related disputes.
        </p>
      )}
    </div>
  );
}

export default DisputeSurface;
