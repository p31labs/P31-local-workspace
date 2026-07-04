import { useEffect, useState } from 'react';
import { useGameEngine } from '../../../lib/arcade-core/useGameEngine.ts';
import { LiquidSculptorGame } from './LiquidSculptorGame.tsx';

export function LiquidSculptorShell() {
  const engine = useGameEngine({ slug: 'liquid', title: 'Liquid Sculptor', autoSave: true });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) { engine.start(); setStarted(true); }
  }, [started]);

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', paddingTop: 12 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(232,230,227,0.2)', margin: 0 }}>
          Click and drag to sculpt fluid
        </p>
      </div>
      <LiquidSculptorGame />
    </div>
  );
}
