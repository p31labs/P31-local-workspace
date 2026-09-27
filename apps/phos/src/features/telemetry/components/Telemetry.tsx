import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function Telemetry() {
  const { spoons } = useSpoon();
  const key = 'phos:telemetry';

  const cards = [{'t': 'Workers Online', 'd': '8 / 8'}, {'t': 'LOVE Ledger', 'd': '1,247 balance'}, {'t': 'Spoon Level', 'd': '3 / 5'}, {'t': 'XP Total', 'd': '4,096'}];
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Telemetry</h1>
      </GlassCard>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {cards.map(c => (
          <GlassCard key={c.t} className="p-4">
            <h3 className="font-bold text-ink text-sm">{c.t}</h3>
            <p className="text-xs text-cloud/50 mt-1">{c.d}</p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
