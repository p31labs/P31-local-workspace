import { useState, useEffect } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';
import { justiceRpc, sha256 } from '../lib/justiceClient';

interface JusticeCase {
  id: string;
  title: string;
  status: string;
  party_a_did: string;
  party_b_did: string;
}

interface SealedRecord {
  entryId: string;
  type: string;
  desc: string;
  payloadHash: string;
  chainHash: string;
  caseId: string;
  uploaderDid: string;
  sealedAt: string;
  verified?: boolean;
}

export function SovereignJustice() {
  const { spoons } = useSpoon();
  const key = 'phos:justice';

  const [cases, setCases] = useState<JusticeCase[]>([]);
  const [caseId, setCaseId] = useState('');
  const [uploaderDid, setUploaderDid] = useState('did:key:zSelfAttested');
  const [hubStatus, setHubStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [hubError, setHubError] = useState('');
  const [ev, setEv] = useState<SealedRecord[]>(() => { try { return JSON.parse(localStorage.getItem('justice:ev') || '[]'); } catch { return []; } });
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('Engagement');
  const [busy, setBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState<string | null>(null);
  useEffect(() => { localStorage.setItem('justice:ev', JSON.stringify(ev)); }, [ev]);

  useEffect(() => {
    (async () => {
      try {
        const data = await justiceRpc('justice_case_list', { status: 'open' });
        setCases(data.cases || []);
        if (data.cases?.[0]) setCaseId(data.cases[0].id);
        setHubStatus('connected');
      } catch (e: any) {
        setHubError(e.message || String(e));
        setHubStatus('error');
      }
    })();
  }, []);

  const add = async () => {
    if (!desc.trim() || busy || spoons === 0 || !caseId) return;
    setBusy(true);
    try {
      const payloadHash = await sha256(desc.trim());
      const data = await justiceRpc('justice_evidence_deposit', {
        caseId,
        uploaderDid,
        payloadHash,
        metadata: { type, description: desc.trim() },
      });
      setEv(prev => [{
        entryId: data.entryId,
        type,
        desc: desc.trim(),
        payloadHash,
        chainHash: data.chainHash,
        caseId,
        uploaderDid,
        sealedAt: new Date(data.ts).toISOString(),
        verified: false,
      }, ...prev]);
      setDesc('');
    } catch (e: any) {
      setHubError(`Deposit failed: ${e.message || e}`);
      setHubStatus('error');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (record: SealedRecord) => {
    setVerifyBusy(record.entryId);
    try {
      const data = await justiceRpc('justice_evidence_verify', { entryId: record.entryId });
      setEv(prev => prev.map(r => r.entryId === record.entryId ? { ...r, verified: data.valid === true } : r));
    } catch (e: any) {
      setHubError(`Verify failed: ${e.message || e}`);
    } finally {
      setVerifyBusy(null);
    }
  };

  const hubNotice = hubStatus === 'error'
    ? <p className="text-sm text-quantum-gold/80">Justice hub not reachable — {hubError}</p>
    : hubStatus === 'loading'
      ? <p className="text-sm text-mist/70">Connecting to justice hub…</p>
      : cases.length > 0
        ? <p className="text-sm text-quantum-green/80">{cases.length} open case{cases.length === 1 ? '' : 's'} on the hub</p>
        : <p className="text-sm text-quantum-gold/80">Hub connected but no open cases — create one via justice_case_create.</p>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-gold font-mono-tech mb-1">Sovereign Justice</h1>
        <p className="text-cloud/50 text-sm">Court-admissible evidence chain (SHA-256). Sealed + verified against p31-justice-hub.</p>
        {hubNotice}
      </GlassCard>
      {spoons === 0 ? (
        <GlassCard className="p-6">
          <p className="text-sm text-quantum-gold">Crisis mode — evidence logging paused. Rest when you can.</p>
        </GlassCard>
      ) : (
        <GlassCard className="p-6 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <select value={type} onChange={e => setType(e.target.value)} className="bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink">
              <option>Engagement</option><option>Communication</option><option>Financial</option><option>Medical</option>
            </select>
            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe evidence…" className="flex-1 bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink" />
            <GlowButton color="gold" onClick={add} disabled={busy || !caseId || !desc.trim()}>{busy ? 'Sealing…' : 'Seal + Log'}</GlowButton>
          </div>
          <div className="flex gap-2 flex-wrap items-center text-xs text-mist">
            <label className="inline-flex items-center gap-1">
              Case
              <select value={caseId} onChange={e => setCaseId(e.target.value)} className="bg-void-surface/50 border border-white/10 rounded px-2 py-1 text-ink">
                {cases.length === 0 && <option value="">No open cases</option>}
                {cases.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label className="inline-flex items-center gap-1">
              DID
              <input value={uploaderDid} onChange={e => setUploaderDid(e.target.value)} className="bg-void-surface/50 border border-white/10 rounded px-2 py-1 text-ink font-mono-tech" />
            </label>
            <span className="text-cloud/40">self-attested — DID registry verification is an open P1 item</span>
          </div>
          <div className="space-y-2">
            {ev.length === 0 && <p className="text-sm text-mist/60">No evidence sealed yet. Describe it above and seal it to the chain.</p>}
            {ev.map(e => (
              <div key={e.entryId} className="p-3 rounded-xl bg-void-surface/40 border border-white/[0.06]">
                <div className="flex justify-between text-xs">
                  <span className="text-quantum-cyan font-mono-tech">{e.type}</span>
                  <span className={e.verified === true ? 'text-quantum-green' : e.verified === false ? 'text-quantum-gold' : 'text-mist'}>{e.verified === undefined ? 'sealed' : e.verified ? 'verified' : 'invalid'}</span>
                </div>
                <p className="text-sm text-ink/80 mt-1">{e.desc}</p>
                <p className="text-xs text-mist font-mono-tech truncate">entry {e.entryId}</p>
                <p className="text-xs text-mist font-mono-tech truncate">sha256 {e.payloadHash}</p>
                <div className="flex gap-2 mt-2">
                  <GlowButton color="cyan" onClick={() => verify(e)} disabled={verifyBusy === e.entryId}>
                    {verifyBusy === e.entryId ? 'Verifying…' : e.verified === true ? 'Re-verify' : 'Verify'}
                  </GlowButton>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}