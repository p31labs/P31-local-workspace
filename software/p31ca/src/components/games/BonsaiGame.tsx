import { useCallback, useEffect } from 'react';
import { CyberneticBonsaiScene } from './CyberneticBonsaiScene';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine';
import { GameOverlay } from './GameOverlay';
import { emit } from '../../lib/arcade-core/eventBus.ts';

export function BonsaiGame() {
  const engine = useGameEngine({ slug: 'cybernetic-bonsai', title: 'Cybernetic Bonsai' });
  const { state, start } = engine;

  useEffect(() => { start(); }, [start]);

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.code === 'KeyS') {
      emit('p31:pidAction', { type: 'sigh' });
    }
    if (e.code === 'KeyP') emit('p31:pidAction', { type: 'sleep' });
    if (e.code === 'KeyD') emit('p31:pidAction', { type: 'task' });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <GameOverlay
      gameId="cybernetic-bonsai"
      gameTitle="Cybernetic Bonsai"
      gameIcon="🌳"
      engineState={state}
      extraHud={
        <div className="absolute top-20 left-5 z-20">
          <div className="px-4 py-2 rounded-lg text-[10px] tracking-widest uppercase font-bold"
            style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.08)', color: '#cda852' }}>
            🧠 PID CONTROLLER ACTIVE
          </div>
          <p className="text-[10px] text-white/40 mt-2 font-mono">
            S = sigh (P) &nbsp;|&nbsp; P = pause (I) &nbsp;|&nbsp; D = task (D)
          </p>
        </div>
      }
    >
      <CyberneticBonsaiScene spoonLevel={state.spoons} />
    </GameOverlay>
  );
}
