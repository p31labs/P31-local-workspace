import React, { useState, useEffect, useCallback } from 'react';
import { getBalanceAtomic, getLedgerHistory, verifyLedgerIntegrity } from '../lib/KarmaEngine';

interface LedgerEntry {
  kind: string;
  delta: number;
  timestamp: number;
  signature: string;
  prevSignature: string;
}

interface LedgerData {
  loveTokens: number;
  deferredSlices: number;
  sablierStreamRate: string;
  integrity: { valid: boolean; count: number } | null;
  history: LedgerEntry[];
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function LedgerSurface({ theme }: { theme: Record<string, string> }) {
  const [data, setData] = useState<LedgerData>({
    loveTokens: 0,
    deferredSlices: 0,
    sablierStreamRate: '0.000000',
    integrity: null,
    history: [],
  });

  const refresh = useCallback(async () => {
    const [b, h, i] = await Promise.all([
      getBalanceAtomic(),
      getLedgerHistory(20),
      verifyLedgerIntegrity(),
    ]);
    setData((prev) => ({ ...prev, loveTokens: b, history: h, integrity: i }));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="p-6 bg-purple-950/20 text-slate-100 min-h-screen font-mono border border-purple-500/30">
      <header className="border-b border-purple-500/30 pb-4 mb-6">
        <h1 className="text-2xl text-purple-400 font-bold tracking-wider">PHOS BIFURCATED BALANCE LEDGER</h1>
        <p className="text-xs text-slate-400">STATUS: AUDIT-COMPLIANT | JURISPRUDENTIAL ISOLATION ACTIVE</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TRANCHE 1: OPERATIONAL LEDGER (THE VAN CAMP SHIELD) */}
        <section className="border border-purple-500/20 bg-black/40 p-4 rounded-sm shadow-inner">
          <h2 className="text-sm tracking-widest text-purple-300 font-bold uppercase mb-3 border-b border-purple-500/10 pb-1">
            Tranche 1: Operational Base Payroll (Intellectual Energy)
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">SABLIER STREAM RATE:</span>
              <span className="text-green-400 font-bold">{data.sablierStreamRate} USDC/sec</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DEFERRED SLICING PIE DEBT:</span>
              <span className="text-amber-400 font-bold">{data.deferredSlices} SLICES (2x/4x Multiplier Loaded)</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-4 leading-normal italic">
            Notice: This data tracks corporate operational inputs at fair market rates, fully compensating the marital community and triggering the Van Camp protective shield.
          </p>
        </section>

        {/* TRANCHE 3: ONTOLOGICAL LEDGER (THE L.O.V.E. ECONOMY) */}
        <section className="border border-purple-500/20 bg-black/40 p-4 rounded-sm shadow-inner">
          <h2 className="text-sm tracking-widest text-purple-300 font-bold uppercase mb-3 border-b border-purple-500/10 pb-1">
            Tranche 3: Ontological Care Ledger (Emotional Energy)
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">FOUNDING NODE DIVIDEND WEIGHT:</span>
              <span className="text-purple-400 font-bold">50.00% (Sovereignty Pool Locked)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">ACCUMULATED L.O.V.E. BALANCE:</span>
              <span className="text-purple-300 font-bold">{data.loveTokens} PoC Tokens</span>
            </div>
            {data.integrity && (
              <div className="flex justify-between">
                <span className="text-slate-400">CHAIN INTEGRITY:</span>
                <span className={data.integrity.valid ? 'text-emerald-400' : 'text-red-400'}>
                  {data.integrity.valid ? '✓ VALID' : '⚠ TAMPERED'} ({data.integrity.count} entries)
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-4 leading-normal italic">
            Notice: L.O.V.E. tokens are soulbound assets tracking direct biological and physical care metrics via Proof of Care consensus. Completely separate from business labor assets.
          </p>
        </section>
      </div>

      {/* TRANSACTION HISTORY */}
      {data.history.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-xs font-mono uppercase opacity-40">Transaction History</h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {data.history.map((entry, i) => (
              <div key={i} className="flex justify-between items-center text-xs font-mono p-2 rounded bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className={entry.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                    {entry.delta >= 0 ? '+' : ''}{entry.delta}
                  </span>
                  <span className="opacity-70">{entry.kind}</span>
                </div>
                <div className="flex items-center gap-2">
                  {entry.signature && (
                    <span className="text-[8px] font-mono opacity-20">
                      {entry.signature.substring(0, 8)}…
                    </span>
                  )}
                  <span className="opacity-40 text-[10px]">{relativeTime(entry.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
