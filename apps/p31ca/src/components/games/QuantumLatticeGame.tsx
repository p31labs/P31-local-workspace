import { useEffect, Suspense, lazy } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine';
import { GameOverlay } from './GameOverlay';

const PosnerLatticeScene = lazy(() => import('./PosnerLatticeScene'));

interface QuantumLatticeGameProps {
  decoherence?: number;
  particleCount?: number;
}

export function QuantumLatticeGame({ decoherence = 0.5, particleCount = 3000 }: QuantumLatticeGameProps) {
  const engine = useGameEngine({ slug: 'quantum-lattice', title: 'Quantum Lattice' });
  const { state, start } = engine;

  useEffect(() => { start(); }, [start]);

  const spoonFactor = Math.max(0, Math.min(12, state.spoons)) / 12;

  return (
    <GameOverlay gameId="quantum-lattice" gameTitle="Quantum Lattice" gameIcon="⚛️" engineState={state}>
      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white/60">Loading…</div>}>
        <PosnerLatticeScene
          decoherence={decoherence * (2 - spoonFactor)}
          particleCount={Math.max(100, Math.round(particleCount * spoonFactor))}
          spoonLevel={state.spoons}
        />
      </Suspense>
    </GameOverlay>
  );
}
