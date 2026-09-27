import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function BreathSurface() {
  const { spoons } = useSpoon();
  const key = 'phos:breath';

  const [breath, setBreath] = useState<'in'|'out'>('in');
  useEffect(() => { const t = setInterval(() => setBreath(b => b==='in'?'out':'in'), 4000); return () => clearInterval(t); }, []);
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="breathSurface" data-mcp-state="breathing">
      <GlassCard className="p-6 text-center">
        <h1 className="text-2xl font-bold text-quantum-green font-mono-tech mb-1">Breath</h1>
        <div className="relative w-40 h-40 mx-auto my-8">
          <div className="absolute inset-0 rounded-full border-4 border-quantum-cyan transition-transform duration-[4000ms]" style={{transform: breath==='in'?'scale(0.85)':'scale(1.15)', opacity: breath==='in'?0.5:1}} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-mono-tech text-quantum-cyan">{breath==='in'?'⬆':'⬇'}</div>
        </div>
        <p className="text-cloud/60 font-mono-tech">{breath==='in'?'Breathe in…':'Breathe out…'}</p>
      </GlassCard>
    </div>
  );
}
