import React, { useState, useEffect, useCallback } from 'react';
import { getRoutingLogs, getRoutingStats, type RoutingLogEntry } from '../lib/OpenLedger';
import { getBalanceAtomic, getLedgerHistory, type KarmaEvent } from '../lib/KarmaEngine';

export function OpenLedgerSurface({ spoons }: { spoons: number }) {
  const [logs, setLogs] = useState<RoutingLogEntry[]>([]);
  const [stats, setStats] = useState({ total: 0, localRate: 0, avgConfidence: 0 });
  const [tokens, setTokens] = useState(0);
  const [history, setHistory] = useState<KarmaEvent[]>([]);

  const refresh = useCallback(async () => {
    const [l, s, t, h] = await Promise.all([
      getRoutingLogs(25),
      getRoutingStats(),
      getBalanceAtomic(),
      getLedgerHistory(10),
    ]);
    setLogs(l);
    setStats(s);
    setTokens(t);
    setHistory(h);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="p-6 bg-purple-950/10 text-slate-100 min-h-screen font-mono border border-purple-500/20">
      <header className="border-b border-purple-500/20 pb-4 mb-6">
        <h1 className="text-2xl text-purple-400 font-bold tracking-wider">OPEN LEDGER</h1>
        <p className="text-xs text-slate-400">SOVEREIGN TRANSPARENCY DASHBOARD — ZERO TELEMETRY</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="phos-glass rounded-xl p-4">
          <h3 className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Routing Volume</h3>
          <p className="text-2xl font-bold text-purple-300">{stats.total}</p>
          <p className="text-[10px] opacity-60">total inferences</p>
        </div>
        <div className="phos-glass rounded-xl p-4">
          <h3 className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Local Intercept Rate</h3>
          <p className="text-2xl font-bold text-emerald-400">{(stats.localRate * 100).toFixed(1)}%</p>
          <p className="text-[10px] opacity-60">sovereign {stats.localRate > 0.7 ? '✓ resilient' : '⚠ bridging'}</p>
        </div>
        <div className="phos-glass rounded-xl p-4">
          <h3 className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Avg Confidence</h3>
          <p className="text-2xl font-bold text-[#FFB347]">{stats.avgConfidence.toFixed(2)}</p>
          <p className="text-[10px] opacity-60">across all routes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="phos-glass rounded-xl p-4">
          <h2 className="text-sm tracking-widest text-purple-300 font-bold uppercase mb-3">Recent Routing Decisions</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-xs opacity-40">No routing activity yet.</p>
            ) : logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between text-xs p-2 rounded bg-white/5 border border-white/5">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${log.route === 'local' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[#FFB347]/20 text-[#FFB347]'}`}>
                    {log.route.toUpperCase()}
                  </span>
                  <span className="opacity-70 font-mono">#{log.promptHash}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="opacity-60">{(log.confidence * 100).toFixed(0)}%</span>
                  <span className="opacity-40 text-[10px]">{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="phos-glass rounded-xl p-4">
          <h2 className="text-sm tracking-widest text-purple-300 font-bold uppercase mb-3">L.O.V.E. Token Stream</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">BALANCE</span>
              <span className="text-purple-300 font-bold">{tokens} PoC</span>
            </div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {history.map((entry) => (
                <div key={entry.signature} className="flex justify-between items-center text-xs p-2 rounded bg-white/5">
                  <div className="flex items-center gap-2">
                    <span className={entry.delta >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {entry.delta >= 0 ? '+' : ''}{entry.delta}
                    </span>
                    <span className="opacity-70">{entry.kind}</span>
                  </div>
                  <span className="opacity-40 text-[10px]">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
