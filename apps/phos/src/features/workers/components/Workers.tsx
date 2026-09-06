import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function Workers() {
  const { spoons } = useSpoon();
  const key = 'phos:workers';

  const rows = [{'name': 'membrane-coordinator', 'status': 'online', 'uptime': '99.8%', 'cpu': 2}, {'name': 'multiplayer-room', 'status': 'online', 'uptime': '99.9%', 'cpu': 5}, {'name': 'device-registry', 'status': 'online', 'uptime': '100%', 'cpu': 1}, {'name': 'genesis-gate', 'status': 'online', 'uptime': '99.7%', 'cpu': 3}, {'name': 'care-api', 'status': 'online', 'uptime': '99.9%', 'cpu': 4}, {'name': 'CBS-wasm-worker', 'status': 'online', 'uptime': '100%', 'cpu': 8}];
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Workers</h1>
        <p className="text-cloud/50 text-sm">Live status.</p>
      </GlassCard>
      <GlassCard className="p-6 space-y-2">
        {rows.map(r => (
          <div key={r.name} className="flex items-center gap-3 p-2 rounded-lg bg-void-surface/40 border border-white/[0.06]">
            <span className={"w-2 h-2 rounded-full " + (r.status==='online'?'bg-quantum-green':'bg-quantum-red')} />
            <span className="text-sm text-ink flex-1 font-mono-tech">{r.name}</span>
            <span className="text-xs text-mist">{r.uptime}</span>
            <span className="text-xs text-mist">{r.cpu}% cpu</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
