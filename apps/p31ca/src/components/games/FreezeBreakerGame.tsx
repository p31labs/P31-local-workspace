import { useCallback, useEffect, Suspense, lazy } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine';
import { GameOverlay } from './GameOverlay';

const FreezeBreakerOverlay = lazy(() => import('./FreezeBreakerOverlay'));

export function FreezeBreakerGame() {
  const engine = useGameEngine({ slug: 'freeze-breaker', title: 'Freeze Breaker' });
  const { state, start, complete, addScore } = engine;

  useEffect(() => { start(); }, [start]);

  const handleComplete = useCallback(() => {
    addScore(10);
    complete();
  }, [addScore, complete]);

  return (
    <GameOverlay gameId="freeze-breaker" gameTitle="Freeze Breaker" gameIcon="🧊" engineState={state}>
      {state.status === 'running' && !engine.state.isLowSpoon && (
        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center text-white/60">Loading…</div>}>
          <FreezeBreakerOverlay onComplete={handleComplete} thresholdTime={3} spoonLevel={state.spoons} />
        </Suspense>
      )}
    </GameOverlay>
  );
}
