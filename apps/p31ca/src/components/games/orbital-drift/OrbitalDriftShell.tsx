import { useEffect, useState } from 'react';
import { useGameEngine } from '../../../lib/arcade-core/useGameEngine.ts';
import { OrbitalDriftGame } from './OrbitalDriftGame.tsx';

export function OrbitalDriftShell() {
  const engine = useGameEngine({ slug: 'orbital', title: 'Orbital Drift', autoSave: true });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) { engine.start(); setStarted(true); }
  }, [started]);

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', paddingTop: 12 }}>
      <div style={{ textAlign: 'center', marginBottom: 4 }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(232,230,227,0.2)', margin: 0 }}>
          Click to place bodies — watch them orbit
        </p>
      </div>
      <OrbitalDriftGame />
    </div>
  );
}
