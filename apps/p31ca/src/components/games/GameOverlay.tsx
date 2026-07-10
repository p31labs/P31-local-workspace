import { useEffect, useRef } from 'react';
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
  children?: React.ReactNode;
}

export function GameOverlay({ gameId, gameTitle, gameIcon, engineState, extraHud, children }: GameOverlayProps) {
  const hud = useSpoonHUD();
  const { setLevel } = useSpoonStore(s => ({ setLevel: s.setLevel }));
  const blockedDialogRef = useRef<HTMLDivElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    emit('game:started', { game: gameId, spoons: engineState.spoons });
    return () => emit('game:completed', { game: gameId, score: engineState.score });
  }, [gameId, engineState.spoons, engineState.score]);

  useEffect(() => {
    if (engineState.spoons > 1 || !blockedDialogRef.current) return;

    const dialog = blockedDialogRef.current;
    const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    lastFocusRef.current = document.activeElement as HTMLElement;
    const firstEl = dialog.querySelector<HTMLElement>(focusableSelector);
    firstEl?.focus();

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        return;
      }
      if (e.key !== 'Tab') return;
      const nodes = dialog.querySelectorAll<HTMLElement>(focusableSelector);
      if (!nodes.length) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    dialog.addEventListener('keydown', handleKey);

    return () => {
      dialog.removeEventListener('keydown', handleKey);
      lastFocusRef.current?.focus();
    };
  }, [engineState.status, gameId, engineState.spoons]);

  const blocked = engineState.spoons <= 1;

  return (
    <div className="fixed inset-0 z-[90]" style={{ background: 'var(--p31-void)' }}>
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
              color: blocked ? 'var(--p31-rust)' : engineState.status === 'complete' ? 'var(--p31-green)' : 'var(--p31-ice)',
              background: 'var(--p31-white-5)',
            }}
          >
            {blocked ? 'REST REQUIRED' : engineState.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Extra HUD area (game-specific controls / info) */}
      {extraHud}

      {/* Game content area */}
      {children}

      {/* Spoon indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <div className="flex items-center gap-3 px-5 py-3 rounded-full" style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--p31-white-8)' }}>
          <span className="text-sm">🥄</span>
          <div className="w-32 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(engineState.spoons / 12) * 100}%`,
                background: engineState.spoons <= 1 ? 'var(--p31-rust)' : engineState.spoons <= 3 ? 'var(--p31-gold)' : 'var(--p31-teal)',
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
        <div
          ref={blockedDialogRef}
          className="absolute inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', outline: 'none' }}
          role="dialog"
          aria-modal="true"
          aria-label="Spoons critically low. Rest required."
        >
          <div className="text-center max-w-xs p-8" style={{ background: 'rgba(15,17,21,0.95)', border: '1px solid var(--p31-white-8)', borderRadius: '16px' }}>
            <p className="text-4xl mb-4">🧘</p>
            <p className="text-base font-bold mb-2" style={{ color: 'var(--p31-gold)' }}>Spoons Critically Low</p>
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
