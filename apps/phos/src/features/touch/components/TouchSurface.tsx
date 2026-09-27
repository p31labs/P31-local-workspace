import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function TouchSurface() {
  const { spoons } = useSpoon();
  const key = 'phos:touch';

  const vars = ['--p31-void','--p31-accent','--p31-accent-violet','--p31-accent-gold','--p31-accent-green','--p31-accent-red','--p31-text-primary','--p31-surface'];
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="touchSurface" data-mcp-state="idle">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Touch</h1>
        <p className="text-cloud/50 text-sm">Live design tokens from @p31ca/design-core.</p>
      </GlassCard>
      <GlassCard className="p-6 grid grid-cols-2 gap-3">
        {vars.map((v) => (
          <div key={v} className="flex items-center gap-3 p-2 rounded-lg bg-void-surface/40 border border-white/[0.06]">
            <span className="w-8 h-8 rounded-lg border border-white/10" style={{background: `var(${v})`}} />
            <span className="text-xs text-mist font-mono-tech">{v}</span>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
