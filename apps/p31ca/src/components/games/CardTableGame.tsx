import { useState } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine.ts';
import { emit } from '../../lib/arcade-core/eventBus.ts';
import { GameOverlay } from '../../components/games/GameOverlay.tsx';
import { KlondikeSolitaire } from './cards/KlondikeSolitaire.tsx';
import { RummyGame } from './cards/RummyGame.tsx';
import { COLORS } from '../../lib/arcade-core/theme.ts';

type GameVariant = 'solitaire' | 'rummy';
type Screen = { phase: 'menu' } | { phase: 'game'; variant: GameVariant };

export function CardTableGame() {
  const engine = useGameEngine({ slug: 'cards', title: 'Card Table', autoSave: true });
  const [screen, setScreen] = useState<Screen>({ phase: 'menu' });
  const [lastResult, setLastResult] = useState<string | null>(null);

  function handleGameStart(variant: GameVariant) {
    engine.start();
    setScreen({ phase: 'game', variant });
  }

  function handleScoreChange(delta: number) {
    engine.addScore(delta);
    emit('p31:cards:moveMade', { delta });
  }

  function handleMoveMade() {
    emit('p31:cards:moveMade', {});
  }

  async function handleComplete() {
    await engine.complete();
    setLastResult(`Final Score: ${engine.state.score}`);
    emit('p31:cards:gameComplete', { score: engine.state.score });
  }

  function handleBackToMenu() {
    engine.reset();
    setScreen({ phase: 'menu' });
    setLastResult(null);
  }

  const extraHud = screen.phase === 'game' ? (
    <div
      className="absolute top-32 left-1/2 -translate-x-1/2 z-10"
      style={{
        display: 'flex',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <button
        onClick={handleBackToMenu}
        style={{
          padding: '6px 14px',
          borderRadius: 8,
          border: '1px solid var(--p31-white-10)',
          background: 'var(--p31-white-4)',
          color: 'var(--p31-cloud-60)',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          cursor: 'pointer',
        }}
      >
        ← MENU
      </button>
      {screen.phase === 'game' && (
        <span
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            background: 'var(--p31-purple-dim)',
            border: '1px solid var(--p31-purple-border)',
            color: 'var(--p31-purple)',
            fontFamily: "'Press Start 2P', cursive",
            fontSize: 9,
          }}
        >
          {screen.variant === 'solitaire' ? 'SOLITAIRE' : 'GIN RUMMY'}
        </span>
      )}
    </div>
  ) : null;

  return (
    <GameOverlay
      gameId="cards"
      gameTitle="Card Table"
      gameIcon="🃏"
      engineState={engine.state}
      extraHud={extraHud}
    >
      <div className="flex items-center justify-center min-h-screen pt-24 pb-24 px-4">
        {screen.phase === 'menu' && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            maxWidth: 500,
            width: '100%',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🃏</div>
              <h1 style={{
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 18,
                color: 'var(--p31-purple)',
                marginBottom: 12,
              }}>
                CARD TABLE
              </h1>
              <p style={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--p31-cloud-50)',
                lineHeight: 1.6,
              }}>
                Klondike Solitaire &amp; Gin Rummy
              </p>
            </div>

            {lastResult && (
              <div style={{
                padding: '12px 24px',
                background: 'var(--p31-green-dim)',
                border: '1px solid var(--p31-green-border)',
                borderRadius: 12,
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 9,
                color: 'var(--p31-green)',
              }}>
                {lastResult}
              </div>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              width: '100%',
              maxWidth: 320,
            }}>
              <button
                onClick={() => handleGameStart('solitaire')}
                style={{
                  padding: '16px 32px',
                  borderRadius: 12,
                  border: '2px solid var(--p31-purple-border)',
                  background: 'var(--p31-purple-dim)',
                  color: 'var(--p31-purple)',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--p31-purple-dim)';
                  e.currentTarget.style.borderColor = 'var(--p31-purple)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--p31-purple-dim)';
                  e.currentTarget.style.borderColor = 'var(--p31-purple-border)';
                }}
              >
                ♠ SOLITAIRE
              </button>
              <button
                onClick={() => handleGameStart('rummy')}
                style={{
                  padding: '16px 32px',
                  borderRadius: 12,
                  border: '2px solid var(--p31-gold-border)',
                  background: 'var(--p31-gold-dim)',
                  color: 'var(--p31-gold)',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--p31-gold-border)';
                  e.currentTarget.style.borderColor = 'var(--p31-gold)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--p31-gold-dim)';
                  e.currentTarget.style.borderColor = 'var(--p31-gold-border)';
                }}
              >
                ♥ GIN RUMMY
              </button>
            </div>

            <div style={{
              padding: 16,
              background: 'var(--p31-white-2)',
              borderRadius: 12,
              border: '1px solid var(--p31-white-6)',
              width: '100%',
            }}>
              <p style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--p31-cloud-30)',
                textAlign: 'center',
                lineHeight: 1.8,
              }}>
                Score: {engine.state.score} | High: {engine.state.highScore} | Spoons: {engine.state.spoons}/12
              </p>
            </div>
          </div>
        )}

        {screen.phase === 'game' && screen.variant === 'solitaire' && (
          <div style={{ width: '100%', maxWidth: 900 }}>
            <KlondikeSolitaire
              onScoreChange={handleScoreChange}
              onComplete={handleComplete}
              onMoveMade={handleMoveMade}
            />
          </div>
        )}

        {screen.phase === 'game' && screen.variant === 'rummy' && (
          <div style={{ width: '100%', maxWidth: 700 }}>
            <RummyGame
              onScoreChange={handleScoreChange}
              onComplete={handleComplete}
              onMoveMade={handleMoveMade}
            />
          </div>
        )}
      </div>
    </GameOverlay>
  );
}
