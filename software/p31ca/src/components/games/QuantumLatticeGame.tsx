import { useEffect } from 'react';
import { PosnerLatticeScene } from './PosnerLatticeScene';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine';
import { GameOverlay } from './GameOverlay';

export function QuantumLatticeGame({ decoherence = 0.5, particleCount = 3000 }: QuantumLatticeGameProps) {
  const engine = useGameEngine({ slug: 'quantum-lattice', title: 'Quantum Lattice' });
  const { state, start } = engine;

  useEffect(() => { start(); }, [start]);

  const spoonFactor = Math.max(0, Math.min(12, state.spoons)) / 12;

  return (
    <GameOverlay gameId="quantum-lattice" gameTitle="Quantum Lattice" gameIcon="⚛️" engineState={state}>
      <PosnerLatticeScene
        decoherence={decoherence * (2 - spoonFactor)}
        particleCount={Math.max(100, Math.round(particleCount * spoonFactor))}
        spoonLevel={state.spoons}
      />
    </GameOverlay>
  );
}
