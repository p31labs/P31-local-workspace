import { useCallback, useEffect } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine';
import { GameOverlay } from './GameOverlay';
import { FreezeBreakerOverlay } from './FreezeBreakerOverlay';

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
        <FreezeBreakerOverlay onComplete={handleComplete} thresholdTime={3} spoonLevel={state.spoons} />
      )}
    </GameOverlay>
  );
}
