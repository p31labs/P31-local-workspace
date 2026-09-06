import { useState, useEffect, useRef } from 'react';
import { GlassCard } from '@p31/ui/chrome';
import { GlowButton } from '@p31/ui/chrome';
import { useSpoon } from '../../../shared/hooks/useSpoon';

export function RegulationSurface() {
  const { spoons } = useSpoon();
  const key = 'phos:regulation';

  const [courses] = useState([{n:'Spoon Awareness',p:100},{n:'Sovereign Identity',p:60},{n:'Care Economics',p:30},{n:'PQC Basics',p:10}]);
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6" data-mcp-tool="regulationSurface" data-mcp-state="idle">
      <GlassCard className="p-6">
        <h1 className="text-2xl font-bold text-quantum-green font-mono-tech mb-1">Regulation</h1>
        <p className="text-cloud/50 text-sm">Your learning path.</p>
      </GlassCard>
      <GlassCard className="p-6 space-y-4">
        {courses.map(c => (
          <div key={c.n}>
            <div className="flex justify-between text-sm mb-1"><span className="text-ink">{c.n}</span><span className="text-mist font-mono-tech">{c.p}%</span></div>
            <div className="h-2 rounded-full bg-void-surface"><div className="h-2 rounded-full bg-quantum-green" style={{width: c.p + '%'}} /></div>
          </div>
        ))}
      </GlassCard>
    </div>
  );
}
