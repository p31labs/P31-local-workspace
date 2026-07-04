import { useState } from 'react';
import { useGameEngine } from '../../lib/arcade-core/useGameEngine.ts';
import { emit } from '../../lib/arcade-core/eventBus.ts';
import { GameOverlay } from '../../components/games/GameOverlay.tsx';
import { KlondikeSolitaire } from './cards/KlondikeSolitaire.tsx';
import { RummyGame } from './cards/RummyGame.tsx';

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
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.04)',
          color: 'rgba(232,230,227,0.6)',
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
            background: 'rgba(139,124,201,0.1)',
            border: '1px solid rgba(139,124,201,0.2)',
            color: '#8b7cc9',
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
                color: '#8b7cc9',
                marginBottom: 12,
              }}>
                CARD TABLE
              </h1>
              <p style={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(232,230,227,0.5)',
                lineHeight: 1.6,
              }}>
                Klondike Solitaire &amp; Gin Rummy
              </p>
            </div>

            {lastResult && (
              <div style={{
                padding: '12px 24px',
                background: 'rgba(59,163,114,0.1)',
                border: '1px solid rgba(59,163,114,0.2)',
                borderRadius: 12,
                fontFamily: "'Press Start 2P', cursive",
                fontSize: 9,
                color: '#3ba372',
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
                  border: '2px solid rgba(139,124,201,0.3)',
                  background: 'rgba(139,124,201,0.08)',
                  color: '#8b7cc9',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(139,124,201,0.15)';
                  e.currentTarget.style.borderColor = '#8b7cc9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(139,124,201,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(139,124,201,0.3)';
                }}
              >
                ♠ SOLITAIRE
              </button>
              <button
                onClick={() => handleGameStart('rummy')}
                style={{
                  padding: '16px 32px',
                  borderRadius: 12,
                  border: '2px solid rgba(205,168,82,0.3)',
                  background: 'rgba(205,168,82,0.08)',
                  color: '#cda852',
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(205,168,82,0.15)';
                  e.currentTarget.style.borderColor = '#cda852';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(205,168,82,0.08)';
                  e.currentTarget.style.borderColor = 'rgba(205,168,82,0.3)';
                }}
              >
                ♥ GIN RUMMY
              </button>
            </div>

            <div style={{
              padding: 16,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)',
              width: '100%',
            }}>
              <p style={{
                fontSize: 10,
                fontFamily: "'JetBrains Mono', monospace",
                color: 'rgba(232,230,227,0.3)',
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
