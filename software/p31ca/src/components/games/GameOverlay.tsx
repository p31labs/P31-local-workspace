import { useEffect } from 'react';
import { emit } from '../../lib/arcade-core/eventBus.ts';
import { useSpoonStore } from '../../lib/arcade-core/spoonStore.ts';
import { useSpoonHUD } from '../../lib/arcade-core/useSpoonHUD.ts';
import { type GameEngineState } from '../../lib/arcade-core/useGameEngine.ts';

interface GameOverlayProps {
  gameId: string;
  gameTitle: string;
  gameIcon: string;
  engineState: GameEngineState;
  extraHud?: React.ReactNode;
}

export function GameOverlay({ gameId, gameTitle, gameIcon, engineState, extraHud }: GameOverlayProps) {
  const hud = useSpoonHUD();
  const { setLevel } = useSpoonStore(s => ({ setLevel: s.setLevel }));

  useEffect(() => {
    emit('game:started', { game: gameId, spoons: engineState.spoons });
    return () => emit('game:completed', { game: gameId, score: engineState.score });
  }, [gameId, engineState.spoons, engineState.score]);

  const blocked = engineState.spoons <= 1;

  return (
    <div className="fixed inset-0 z-[90]" style={{ background: '#0f1115' }}>
      {/* HUD top bar */}
      <div className="absolute top-16 left-0 right-0 flex items-center justify-between px-5 z-10">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{gameIcon}</span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold">
            {gameTitle.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-white/35 tracking-widest">
            SCORE: {engineState.score}
          </span>
          <span
            className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded"
            style={{
              color: blocked ? '#cc6247' : engineState.status === 'complete' ? '#3ba372' : '#7ec8e3',
              background: 'rgba(255,255,255,0.05)',
            }}
          >
            {blocked ? 'REST REQUIRED' : engineState.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Extra HUD area (game-specific controls / info) */}
      {extraHud}

      {/* Spoon indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-3 px-5 py-3 rounded-full" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <span className="text-sm">🥄</span>
          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(engineState.spoons / 12) * 100}%`,
                background: engineState.spoons <= 1 ? '#cc6247' : engineState.spoons <= 3 ? '#cda852' : '#4db8a8',
              }}
            />
          </div>
          <span className="text-[11px] font-mono font-bold text-white/80 min-w-[32px] text-right">
            {engineState.spoons}/12
          </span>
        </div>
      </div>

      {/* Blocked overlay */}
      {blocked && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="text-center max-w-xs p-8" style={{ background: 'rgba(15,17,21,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px' }}>
            <p className="text-4xl mb-4">🧘</p>
            <p className="text-base font-bold mb-2" style={{ color: '#cda852' }}>Spoons Critically Low</p>
            <p className="text-sm text-white/60 mb-4">
              Your cognitive energy is at <strong>{engineState.spoons}</strong>. Rest before attempting executive tasks.
            </p>
            <p className="text-xs text-white/40 font-mono">
              Tap to recover (+1 spoon in ~{Math.max(1, 12 - engineState.spoons) * 5} min)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
