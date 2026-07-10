import { useState, useCallback } from 'react';
import { Card } from '../../../engine/card/core/types.ts';
import { Deck } from '../../../engine/card/core/Deck.ts';
import { createMulberry32 } from '../../../engine/card/rng/mulberry32.ts';
import {
  detectMelds,
  evaluateKnock,
} from '../../../engine/card/rummy/meldDetection.ts';
import { chooseDiscard } from '../../../engine/card/rummy/ai.ts';
import { scoreRound } from '../../../engine/card/rummy/scoring.ts';
import { HandView } from './HandView.tsx';
import { DiscardPile as DiscardPileView } from './DiscardPile.tsx';
import { COLORS } from '../../../lib/arcade-core/theme.ts';

interface RummyGameProps {
  onScoreChange: (delta: number) => void;
  onComplete: () => void;
  onMoveMade: () => void;
}

type Phase = 'draw' | 'discard' | 'opponentTurn' | 'knock' | 'roundOver';

export function RummyGame({ onScoreChange, onComplete, onMoveMade }: RummyGameProps) {
  const [gameState, setGameState] = useState(() => initRummy());
  const [phase, setPhase] = useState<Phase>('draw');
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [message, setMessage] = useState('Draw a card to start');
  const [playerScores, setPlayerScores] = useState([0, 0]);

  const playerHand = gameState.playerHand;
  const opponentHand = gameState.opponentHand;
  const discardPileCards = gameState.deck.discardPile();
  const stockRemaining = gameState.deck.remaining();

  const handleDrawFromStock = useCallback(() => {
    if (phase !== 'draw') return;

    const card = gameState.deck.draw(true);
    if (!card) return;

    const newHand = [...playerHand, card];
    const meldResult = detectMelds(newHand);

    setGameState(prev => ({ ...prev, playerHand: newHand }));
    setSelectedCard(null);
    setPhase('discard');
    setMessage(`Drew: ${cardLabel(card)}. Discard a card.`);

    if (meldResult.isGin) {
      setMessage('GIN! Click any card to knock.');
    } else if (meldResult.canKnock) {
      setMessage(`Deadwood: ${meldResult.deadwoodPoints}. You can knock!`);
    }
    onMoveMade();
  }, [phase, gameState, playerHand, onMoveMade]);

  const handleDrawFromDiscard = useCallback(() => {
    if (phase !== 'draw') return;
    const card = gameState.deck.drawDiscard();
    if (!card) return;

    const newHand = [...playerHand, card];
    const meldResult = detectMelds(newHand);

    setGameState(prev => ({ ...prev, playerHand: newHand }));
    setSelectedCard(null);
    setPhase('discard');
    setMessage(`Took ${cardLabel(card)} from discard. Discard a card.`);

    if (meldResult.isGin) {
      setMessage('GIN! Click any card to knock.');
    } else if (meldResult.canKnock) {
      setMessage(`Deadwood: ${meldResult.deadwoodPoints}. You can knock!`);
    }
    onMoveMade();
  }, [phase, gameState, playerHand, onMoveMade]);

  const handleDiscard = useCallback((card: Card) => {
    if (phase !== 'discard') return;

    const meldResult = detectMelds(playerHand.filter(c => c.id !== card.id));

    if (meldResult.isGin || meldResult.canKnock) {
      handleKnock(card);
      return;
    }

    gameState.deck.discard(card);
    const newHand = playerHand.filter(c => c.id !== card.id);
    setGameState(prev => ({ ...prev, playerHand: newHand }));

    setMessage('Opponent\'s turn...');
    setPhase('opponentTurn');
    onMoveMade();

    setTimeout(() => {
      opponentTurn(gameState, setGameState, setMessage, setPhase, onMoveMade);
    }, 800);
  }, [phase, gameState, playerHand, onMoveMade]);

  const handleKnock = useCallback((discardCard: Card) => {
    const finalHand = playerHand.filter(c => c.id !== discardCard.id);
    const meldResult = detectMelds(finalHand);
    const knockEval = evaluateKnock(meldResult);

    if (!knockEval.isValid) {
      setMessage('Cannot knock. Deadwood too high.');
      return;
    }

    const playerDeadwood = meldResult.deadwoodPoints;
    const oppMelds = detectMelds(opponentHand);
    const oppDeadwood = oppMelds.deadwoodPoints;
    const result = scoreRound(playerDeadwood, oppDeadwood, knockEval.isGin);

    setPlayerScores(prev => {
      const newScores = [...prev];
      newScores[0] += result.total;
      return newScores;
    });
    onScoreChange(result.total);

    setMessage(
      knockEval.isGin
        ? `GIN! +${result.total} points (gin bonus +25)`
        : `Knock! +${result.total} points (deadwood: ${playerDeadwood} vs ${oppDeadwood})`
    );
    setPhase('roundOver');

    setTimeout(() => {
      setGameState(initRummy());
      setPhase('draw');
      setMessage('New round. Draw to start.');
    }, 2000);
  }, [playerHand, opponentHand, onScoreChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700, margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: 'var(--p31-white-2)',
        borderRadius: 12,
        border: '1px solid var(--p31-white-6)',
      }}>
        <span style={{
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'var(--p31-purple)',
        }}>
          Score: You {playerScores[0]} — Opp {playerScores[1]}
        </span>
        {phase === 'draw' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleDrawFromStock}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--p31-cloud-20)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--p31-cloud)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Draw ({stockRemaining})
            </button>
            {discardPileCards.length > 0 && (
              <button
                onClick={handleDrawFromDiscard}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--p31-gold)',
                  background: 'var(--p31-gold-dim)',
                  color: 'var(--p31-gold)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Take Discard
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{
        textAlign: 'center',
        padding: '8px 16px',
        background: 'var(--p31-purple-dim)',
        borderRadius: 8,
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--p31-purple)',
      }}>
        {message}
      </div>

      <div style={{ display: 'flex', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
        <DiscardPileView
          cards={discardPileCards}
          onTakeCard={phase === 'draw' ? handleDrawFromDiscard : undefined}
        />

        <div style={{
          width: 56,
          height: 80,
          borderRadius: 8,
          border: '2px solid var(--p31-purple-border)',
          background: 'linear-gradient(135deg, #2a1f5e, #1a1140)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'var(--p31-cloud-40)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {stockRemaining}
        </div>
      </div>

      <HandView
        cards={playerHand}
        onCardClick={
          phase === 'discard'
            ? (card) => {
                const meldResult = detectMelds(playerHand.filter(c => c.id !== card.id));
                if (meldResult.isGin || meldResult.canKnock) {
                  handleKnock(card);
                } else {
                  handleDiscard(card);
                }
              }
            : undefined
        }
        label="Your Hand"
      />

      <div style={{
        padding: '8px 16px',
        background: 'var(--p31-white-2)',
        borderRadius: 12,
        border: '1px solid var(--p31-white-6)',
        textAlign: 'center',
        fontSize: 12,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'var(--p31-cloud-40)',
      }}>
        Opponent: {opponentHand.length} cards
      </div>
    </div>
  );
}

function cardLabel(card: Card): string {
  const rankLabels: Record<number, string> = {
    1: 'A', 11: 'J', 12: 'Q', 13: 'K',
  };
  return `${rankLabels[card.rank] ?? card.rank}${card.suit}`;
}

function initRummy() {
  const rng = createMulberry32(Math.floor(Math.random() * 2147483647));
  const deck = Deck.new(rng);
  const playerHand = deck.deal(10, true);
  const opponentHand = deck.deal(10, true);
  const topCard = deck.draw(true);
  if (topCard) deck.discard(topCard);
  return {
    deck,
    playerHand,
    opponentHand,
  };
}

function opponentTurn(
  gs: { deck: Deck; playerHand: Card[]; opponentHand: Card[] },
  setGameState: React.Dispatch<React.SetStateAction<{
    deck: Deck; playerHand: Card[]; opponentHand: Card[];
  }>>,
  setMessage: React.Dispatch<React.SetStateAction<string>>,
  setPhase: React.Dispatch<React.SetStateAction<Phase>>,
  onMoveMade: () => void,
) {
  const drawn = gs.deck.draw(true);
  if (!drawn) return;

  const newOppHand = [...gs.opponentHand, drawn];
  const meldResult = detectMelds(newOppHand);

  if (meldResult.canKnock || meldResult.isGin) {
    const discardCard = newOppHand[newOppHand.length - 1];
    gs.deck.discard(discardCard);
    const finalHand = newOppHand.filter(c => c.id !== discardCard.id);
    const oppMelds = detectMelds(finalHand);
    const playerMelds = detectMelds(gs.playerHand);
    const result = scoreRound(oppMelds.deadwoodPoints, playerMelds.deadwoodPoints, oppMelds.isGin);

    setGameState(prev => ({ ...prev, opponentHand: finalHand }));
    setMessage(meldResult.isGin
      ? `Opponent goes GIN! -${result.total}`
      : `Opponent knocks! -${result.total}`
    );
    setPhase('roundOver');
    setTimeout(() => {
      setGameState(initRummy());
      setPhase('draw');
      setMessage('New round. Draw to start.');
    }, 2000);
    onMoveMade();
    return;
  }

  const knownCards = new Set(gs.playerHand.map(c => c.id));
  const deadwood = meldResult.deadwood;
  const discardCard = chooseDiscard(newOppHand, deadwood, knownCards);

  gs.deck.discard(discardCard);
  const finalHand = newOppHand.filter(c => c.id !== discardCard.id);

  setGameState(prev => ({ ...prev, opponentHand: finalHand }));
  setMessage('Your turn. Draw a card.');
  setPhase('draw');
  onMoveMade();
}
