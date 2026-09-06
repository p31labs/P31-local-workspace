import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function MemorySurface() {
  const { spoons } = useSpoon();
  const key = 'phos:memory';

  const [text, setText] = useState('');
  const [out, setOut] = useState('');
  const suggest = () => {
    const pool = ['Try reframing this as a K₄ graph.', 'The Posner molecule protects the core.', 'Parking-lot this impulse, then return.', 'Wye→Delta: fragile center becomes resilient mesh.'];
    setOut(pool[Math.floor(Math.random() * pool.length)]);
  };
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="memorySurface" data-mcp-state={out ? 'hasOutput' : 'idle'}>
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-violet font-mono-tech mb-1">Memory</h1>
        <p className="text-cloud/50 text-sm">Write freely. The prosthetic suggests connections.</p>
      </GlassCard>
      <GlassCard className="p-6 space-y-3">
         <textarea value={text} onChange={e => setText(e.target.value)} placeholder="What are you working through?" className="w-full h-40 bg-void-surface/40 border border-white/10 rounded-xl p-4 text-sm text-ink resize-none focus:border-quantum-violet/40 outline-none" data-mcp-tool="memoryInput" data-mcp-type="input" data-mcp-target="memory-textarea" />
         <GlowButton color="violet" onClick={suggest} data-mcp-tool="suggestMemory" data-mcp-type="action" data-mcp-target="suggest-memory">Suggest</GlowButton>
        {out && <p className="text-sm text-cloud/70 italic">{out}</p>}
      </GlassCard>
    </div>
  );
}
