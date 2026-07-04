import { useEffect, useState } from 'react';
import { useGameEngine } from '../../../lib/arcade-core/useGameEngine.ts';
import { StrategyBoardGame } from './StrategyBoardGame.tsx';

export function StrategyBoardGameShell() {
  const engine = useGameEngine({ slug: 'strategy', title: 'Strategy Board', autoSave: true });
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) { engine.start(); setStarted(true); }
  }, [started]);

  if (!started) return null;

  return (
    <div style={{ minHeight: 'calc(100vh - 52px)', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20 }}>
      <StrategyBoardGame
        onScoreChange={delta => engine.addScore(delta)}
        onComplete={() => engine.complete()}
      />
    </div>
  );
}
