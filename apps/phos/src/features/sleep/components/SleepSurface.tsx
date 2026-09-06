import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function SleepSurface() {
  const { spoons } = useSpoon();
  const key = 'phos:sleep';

  const [items, setItems] = useState<any[]>(() => { try { return JSON.parse(localStorage.getItem('sleep:items') || '[]'); } catch { return []; } });
  const [draft, setDraft] = useState('');
  useEffect(() => { localStorage.setItem('sleep:items', JSON.stringify(items)); }, [items]);
  const add = () => { if (!draft.trim()) return; setItems(prev => [{ id: crypto.randomUUID(), text: draft.trim(), at: Date.now() }, ...prev]); setDraft(''); };
  const del = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="sleepSurface" data-mcp-state={items.length > 0 ? 'populated' : 'empty'}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Sleep</h1>
        <p className="text-cloud/50 text-sm">Capture and organize your sleep.</p>
      </GlassCard>
      <GlassCard className="p-6 space-y-3">
        <div className="flex gap-2">
          <input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Add an item…" className="flex-1 bg-void-surface/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-ink focus:border-quantum-cyan/40 outline-none" data-mcp-tool="sleepInput" data-mcp-type="input" />
          <GlowButton color="cyan" onClick={add} data-mcp-tool="addSleepItem" data-mcp-type="action">Add</GlowButton>
        </div>
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-void-surface/40 border border-white/[0.06]">
              <span className="text-sm text-ink flex-1">{i.text}</span>
              <button onClick={() => del(i.id)} className="text-mist hover:text-quantum-red text-sm" data-mcp-tool="deleteSleepItem" data-mcp-type="action" data-mcp-target={`sleep-item-${i.id}`}>✕</button>
            </div>
          ))}
          {items.length === 0 && <p className="text-cloud/40 text-sm text-center py-4">Nothing yet.</p>}
        </div>
      </GlassCard>
    </div>
  );
}
