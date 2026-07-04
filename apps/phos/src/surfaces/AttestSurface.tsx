import React, { useState, useCallback } from 'react';
import { generateAuthToken } from '../lib/did-auth';

const EVIDENCE_VAULT = 'https://sovereign-justice-evidence.trimtab-signal.workers.dev';

interface AttestResult {
  edgeId: string;
  chainHash: string;
  partyA: string;
  partyB: string;
  edgeType: string;
}

const EDGE_TYPES = ['co-parent', 'parent-child', 'advocate', 'kinship'];

const DEFAULT_TERMS = JSON.stringify(
  { agreement: 'We commit to using SanctuarySurface for all communications' },
  null,
  2
);

export function AttestSurface({ spoons }: { spoons: number }) {
  const [myDid, setMyDid] = useState('');
  const [signingKey, setSigningKey] = useState('');
  const [peerDid, setPeerDid] = useState('');
  const [peerKey, setPeerKey] = useState('');
  const [edgeType, setEdgeType] = useState('co-parent');
  const [termsJson, setTermsJson] = useState(DEFAULT_TERMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AttestResult | null>(null);

  const handleAttest = useCallback(async () => {
    if (!myDid || !signingKey || !peerDid || !peerKey || !termsJson) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let terms: Record<string, unknown>;
      try {
        terms = JSON.parse(termsJson);
      } catch {
        throw new Error('Terms must be valid JSON');
      }

      const payload = JSON.stringify({
        partyA: myDid,
        partyB: peerDid,
        edgeType,
        terms,
        transferable: false,
        timestamp: Date.now(),
      });

      const token = await generateAuthToken(myDid, signingKey, payload);

      const res = await fetch(`${EVIDENCE_VAULT}/api/evidence/attest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partyADid: myDid,
          partyBDid: peerDid,
          edgeType,
          terms,
          transferable: false,
          metadata: {
            attestedBy: myDid,
            attestedAt: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult({
        edgeId: data.edgeId,
        chainHash: data.chainHash,
        partyA: data.partyA || myDid,
        partyB: data.partyB || peerDid,
        edgeType: data.edgeType || edgeType,
      });
    } catch (e: any) {
      setError(e?.message || 'Attestation failed');
    } finally {
      setLoading(false);
    }
  }, [myDid, signingKey, peerDid, peerKey, edgeType, termsJson]);

  if (spoons <= 1) {
    return (
      <div className="space-y-4 w-full" data-spoons={spoons}>
        <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center">
          ATTEST // Emergency
        </div>
        <div className="p-6 border border-amber-500/30 bg-amber-950/10 rounded-xl text-center">
          <p className="text-sm font-medium text-amber-400">Low Spoon Mode</p>
          <p className="text-xs text-slate-300 mt-2">
            Relationship attestation requires cognitive energy.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Come back when you have more spoons.
          </p>
        </div>
      </div>
    );
  }

  if (spoons <= 2) {
    return (
      <div className="space-y-4 w-full" data-spoons={spoons}>
        <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center">
          ATTEST // Low Energy
        </div>
        <div className="space-y-2">
          <input
            placeholder="Your DID"
            value={myDid}
            onChange={(e) => setMyDid(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
          <input
            placeholder="Signing Key"
            type="password"
            value={signingKey}
            onChange={(e) => setSigningKey(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
          <input
            placeholder="Peer DID"
            value={peerDid}
            onChange={(e) => setPeerDid(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
          <input
            placeholder="Peer Signing Key"
            type="password"
            value={peerKey}
            onChange={(e) => setPeerKey(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
          <button
            onClick={handleAttest}
            disabled={loading || !myDid || !peerDid || !signingKey || !peerKey}
            className="w-full px-4 py-2 text-sm font-mono border border-purple-500/30 rounded text-purple-300 hover:bg-purple-950/20 disabled:opacity-40"
          >
            {loading ? 'Attesting…' : 'Attest Relationship'}
          </button>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {result && (
            <div className="p-3 border border-emerald-500/30 bg-emerald-950/10 rounded">
              <p className="text-emerald-400 text-xs font-mono">Edge attested</p>
              <p className="text-slate-400 text-[10px] font-mono truncate">
                {result.edgeId}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full" data-spoons={spoons}>
      <div className="text-xs font-mono tracking-widest uppercase opacity-60 text-center">
        ATTEST // Relationship Edge
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-mono text-slate-400">Your DID</label>
          <input
            placeholder="did:key:z6M..."
            value={myDid}
            onChange={(e) => setMyDid(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-slate-400">Your Signing Key</label>
          <input
            placeholder="Ed25519 private key (hex)"
            type="password"
            value={signingKey}
            onChange={(e) => setSigningKey(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-mono text-slate-400">Peer DID</label>
          <input
            placeholder="did:key:z6M..."
            value={peerDid}
            onChange={(e) => setPeerDid(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-slate-400">Peer Signing Key</label>
          <input
            placeholder="Ed25519 private key (hex)"
            type="password"
            value={peerKey}
            onChange={(e) => setPeerKey(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-slate-400">Edge Type</label>
        <select
          value={edgeType}
          onChange={(e) => setEdgeType(e.target.value)}
          className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200"
        >
          {EDGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-[10px] font-mono text-slate-400">Terms (JSON)</label>
        <textarea
          value={termsJson}
          onChange={(e) => setTermsJson(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 text-xs font-mono bg-black/40 border border-purple-500/20 rounded text-slate-200 placeholder-slate-600 resize-none"
        />
      </div>

      <button
        onClick={handleAttest}
        disabled={loading || !myDid || !peerDid || !signingKey || !peerKey || !termsJson}
        className="w-full px-4 py-3 text-sm font-mono border border-purple-500/30 rounded text-purple-300 hover:bg-purple-950/20 disabled:opacity-40 transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⟳</span> Attesting…
          </span>
        ) : (
          'Create Attestation (Both Parties Sign)'
        )}
      </button>

      {error && (
        <div className="p-3 border border-red-500/30 bg-red-950/10 rounded">
          <p className="text-red-400 text-xs font-mono">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 border border-emerald-500/30 bg-emerald-950/10 rounded space-y-2">
          <p className="text-emerald-400 text-sm font-mono">Attestation Created</p>
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <span className="text-slate-400">Edge ID</span>
            <span className="text-slate-200 truncate">{result.edgeId}</span>
            <span className="text-slate-400">Chain Hash</span>
            <span className="text-slate-200 truncate">
              {result.chainHash.slice(0, 24)}…
            </span>
            <span className="text-slate-400">Parties</span>
            <span className="text-slate-200">
              {result.partyA.slice(0, 12)}… ↔ {result.partyB.slice(0, 12)}…
            </span>
            <span className="text-slate-400">Type</span>
            <span className="text-slate-200">{result.edgeType}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            Non-transferable. Court-admissible. SHA-512 chain-of-custody.
          </p>
        </div>
      )}

      <p className="text-[9px] font-mono opacity-40 text-center">
        Both parties must sign. Attestation is permanent and non-transferable.
      </p>
    </div>
  );
}

export default AttestSurface;
