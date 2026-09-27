import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31ca/ui/chrome';
import { GlowButton } from '@p31ca/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function ArtifactPipeline() {
  const { spoons } = useSpoon();
  const key = 'phos:artifact';

  const cards = [{'t': 'Initiation', 'd': 'First LOGE achievement.'}, {'t': 'Bonding', 'd': 'Built a molecule.'}, {'t': 'Sovereignty', 'd': 'Issued a credential.'}];
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-cyan font-mono-tech mb-1">Artifact Pipeline</h1>
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
