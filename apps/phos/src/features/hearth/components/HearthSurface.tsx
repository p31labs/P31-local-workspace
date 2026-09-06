import { useState, useEffect } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';
import { QuantumLayer } from '@p31/ui/quantum';
import { useSpoon } from '../../../shared/hooks/useSpoon';

interface Intention {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export function HearthSurface() {
  const { spoons } = useSpoon();
  const [intentions, setIntentions] = useState<Intention[]>(() => {
    try { return JSON.parse(localStorage.getItem('phos:intentions') || '[]'); } catch { return []; }
  });
  const [draft, setDraft] = useState('');
  const [brainDump, setBrainDump] = useState('');
  const [showBrainDump, setShowBrainDump] = useState(false);

  useEffect(() => {
    localStorage.setItem('phos:intentions', JSON.stringify(intentions));
  }, [intentions]);

  const addIntention = () => {
    if (!draft.trim()) return;
    setIntentions(prev => [
      { id: crypto.randomUUID(), text: draft.trim(), done: false, createdAt: Date.now() },
      ...prev,
    ]);
    setDraft('');
  };

  const toggleIntention = (id: string) => {
    setIntentions(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
  };

  const deleteIntention = (id: string) => {
    setIntentions(prev => prev.filter(i => i.id !== id));
  };

  const greeting = spoons <= 1 ? 'Take it slow.' : spoons <= 3 ? 'Welcome back.' : 'Ready to go.';
  const pending = intentions.filter(i => !i.done).length;
  const done = intentions.filter(i => i.done).length;

  return (
    <div>
      <QuantumLayer linkBase="https://p31ca.org" />
        <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="hearthSurface" data-mcp-state={showBrainDump ? 'adding' : 'viewing'}>
        <GlassCard className="p-6">
          <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Hearth</h1>
          <p className="text-cloud/50 text-sm">{greeting}</p>
        </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-3">Daily Intentions</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addIntention()}
            placeholder="What matters today?"
            className="flex-1 bg-void-surface border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-ink placeholder:text-cloud/30 focus:border-quantum-cyan/30 outline-none transition-colors"
            aria-label="New intention"
          />
          <GlowButton color="cyan" size="md" onClick={addIntention} data-mcp-tool="addIntention" data-mcp-type="action">Add</GlowButton>
        </div>

        {intentions.length === 0 ? (
          <p className="text-cloud/30 text-sm text-center py-4">No intentions yet. What matters today?</p>
        ) : (
          <div className="space-y-2">
            {intentions.map(i => (
              <div key={i.id} className="flex items-center gap-3 p-3 rounded-xl bg-void-surface/50 border border-white/[0.04] group">
                <button
                  onClick={() => toggleIntention(i.id)}
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                    i.done ? 'bg-quantum-green/20 border-quantum-green/40 text-quantum-green' : 'border-white/10 hover:border-white/20'
                  }`}
                  aria-label={i.done ? 'Mark incomplete' : 'Mark complete'}
                  data-mcp-tool="toggleIntention" data-mcp-type="action" data-mcp-state={i.done ? 'complete' : 'incomplete'}
                >
                  {i.done && <span className="text-xs">✓</span>}
                </button>
                <span className={`flex-1 text-sm ${i.done ? 'text-cloud/40 line-through' : 'text-ink'}`}>{i.text}</span>
                <button
                  onClick={() => deleteIntention(i.id)}
                  className="opacity-0 group-hover:opacity-100 text-cloud/30 hover:text-red-400 transition-all text-xs"
                  aria-label="Delete intention"
                  data-mcp-tool="deleteIntention" data-mcp-type="action" data-mcp-target={`hearth-item-${i.id}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {intentions.length > 0 && (
          <p className="text-cloud/30 text-xs mt-3 font-mono-tech">{pending} pending · {done} done</p>
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-ink">Brain Dump</h2>
          <GlowButton color="violet" size="sm" onClick={() => setShowBrainDump(!showBrainDump)}>
            {showBrainDump ? 'Close' : 'Open'}
          </GlowButton>
        </div>
        {showBrainDump && (
          <textarea
            value={brainDump}
            onChange={e => setBrainDump(e.target.value)}
            placeholder="Get it out of your head and onto the page. No judgment."
            className="w-full h-40 bg-void-surface border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-ink placeholder:text-cloud/30 focus:border-quantum-violet/30 outline-none transition-colors resize-none"
            aria-label="Brain dump"
          />
        )}
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-ink mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <GlowButton color="cyan" onClick={() => window.location.href = '/passport'}>🪪 Passport</GlowButton>
          <GlowButton color="violet" onClick={() => window.location.href = '/vault'}>🔐 Vault</GlowButton>
          <GlowButton color="gold" onClick={() => window.location.href = '/ledger'}>💰 Ledger</GlowButton>
          <GlowButton color="green" onClick={() => window.location.href = '/settings'}>⚙️ Settings</GlowButton>
        </div>
      </GlassCard>
    </div>
    </div>
  );
}
