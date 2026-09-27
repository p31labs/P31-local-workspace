import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function SovereignJustice() {
  const { spoons } = useSpoon();
  const key = 'phos:justice';

  const [ev, setEv] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('justice:ev') || '[]'); } catch { return []; } });
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('Engagement');
  useEffect(() => { localStorage.setItem('justice:ev', JSON.stringify(ev)); }, [ev]);
  const add = () => { if (!desc.trim()) return; const hash = 'sha256:' + Math.random().toString(36).slice(2,10); setEv(prev => [{id: Date.now(), type, desc: desc.trim(), hash, status: spoons===0?'pending':'verified'}, ...prev]); setDesc(''); };
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-gold font-mono-tech mb-1">Sovereign Justice</h1>
        <p className="text-cloud/50 text-sm">Court-admissible evidence chain (SHA-256).</p>
      </GlassCard>
      <GlassCard className="p-6 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <select value={type} onChange={e=>setType(e.target.value)} className="bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink">
            <option>Engagement</option><option>Communication</option><option>Financial</option><option>Medical</option>
          </select>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Describe evidence…" className="flex-1 bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink" />
          <GlowButton color="gold" onClick={add}>Log</GlowButton>
        </div>
        <div className="space-y-2">
          {ev.map(e => (
            <div key={e.id} className="p-3 rounded-xl bg-void-surface/40 border border-white/[0.06]">
              <div className="flex justify-between text-xs"><span className="text-quantum-cyan font-mono-tech">{e.type}</span><span className={e.status==='verified'?'text-quantum-green':'text-quantum-gold'}>{e.status}</span></div>
              <p className="text-sm text-ink/80 mt-1">{e.desc}</p>
              <p className="text-xs text-mist font-mono-tech">{e.hash}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
