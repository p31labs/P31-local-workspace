import { useEffect } from 'react';
import { PosnerLatticeScene } from './PosnerLatticeScene';
import { useSpoonStore } from '../lib/arcade-core/spoonStore.js';
import { emit } from '../lib/arcade-core/eventBus.js';

export function QuantumLatticeGame({ decoherence = 0.5, particleCount = 3000 }: QuantumLatticeGameProps) {
  const { state: spoon } = useSpoonStore();

  useEffect(() => {
    emit('game:started', { game: 'quantum-lattice', spoons: spoon.level });
    return () => emit('game:completed', { game: 'quantum-lattice' });
  }, []);

  return (
    <div className="fixed inset-0">
      <PosnerLatticeScene 
        decoherence={decoherence} 
        particleCount={particleCount} 
        spoonLevel={spoon.level} 
      />
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-black/40 border border-white/10">
          <span className="text-sm">🥄</span>
          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(spoon.level / 12) * 100}%`,
                background: spoon.level <= 1 ? '#cc6247' : spoon.level <= 3 ? '#cda852' : '#4db8a8',
              }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-white/80 min-w-[32px] text-right">
            {spoon.level}/12
          </span>
        </div>
      </div>
    </div>
  );
}
