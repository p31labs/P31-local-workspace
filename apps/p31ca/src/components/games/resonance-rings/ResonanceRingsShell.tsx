import { useEffect, useState } from 'react';
import { useGameEngine } from '../../../lib/arcade-core/useGameEngine.ts';
import { ResonanceRingsGame } from './ResonanceRingsGame.tsx';
import { COLORS } from '../../../lib/arcade-core/theme.ts';

export function ResonanceRingsShell() {
  const engine = useGameEngine({ slug: 'resonance', title: 'Resonance Rings', autoSave: true });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) { engine.start(); setStarted(true); }
  }, [started]);

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', paddingTop: 12 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'var(--p31-cloud-20)', margin: 0 }}>
          Click to create resonance rings
        </p>
      </div>
      <ResonanceRingsGame />
    </div>
  );
}
