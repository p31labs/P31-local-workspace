import { useEffect } from 'react';
import { AbyssalNodeScene } from './AbyssalNodeScene';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine';
import { GameOverlay } from './GameOverlay';

export function AbyssalNodeGame() {
  const engine = useGameEngine({ slug: 'abyssal-node', title: 'Abyssal Node' });
  const { state, start } = engine;

  useEffect(() => { start(); }, [start]);

  return (
    <GameOverlay gameId="abyssal-node" gameTitle="Abyssal Node" gameIcon="🌊" engineState={state}>
      <AbyssalNodeScene spoonLevel={state.spoons} />
    </GameOverlay>
  );
}
