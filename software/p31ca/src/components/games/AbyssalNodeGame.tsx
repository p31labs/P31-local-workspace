import { useEffect, Suspense, lazy } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine';
import { GameOverlay } from './GameOverlay';

const AbyssalNodeScene = lazy(() => import('./AbyssalNodeScene'));

export function AbyssalNodeGame() {
  const engine = useGameEngine({ slug: 'abyssal-node', title: 'Abyssal Node' });
  const { state, start } = engine;

  useEffect(() => { start(); }, [start]);

  return (
    <GameOverlay gameId="abyssal-node" gameTitle="Abyssal Node" gameIcon="🌊" engineState={state}>
      <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white/60">Loading…</div>}>
        <AbyssalNodeScene spoonLevel={state.spoons} />
      </Suspense>
    </GameOverlay>
  );
}
