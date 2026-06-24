import { useState, useCallback } from 'react';
import { Card } from '../../../engine/card/core/types.ts';

import { Deck } from '../../../engine/card/core/Deck.ts';
import { createMulberry32 } from '../../../engine/card/rng/mulberry32.ts';
import {
  KlondikeState,
  PileState,
  isValidTableauMove,
  isValidFoundationMove,
  isKlondikeWon,
} from '../../../engine/card/solitaire/validator.ts';
import {
  dealFromStock,
  runAutoComplete,
  canAutoComplete,
} from '../../../engine/card/solitaire/autocomplete.ts';
import { CardTableView } from './CardTableView.tsx';

interface KlondikeSolitaireProps {
  onScoreChange: (delta: number) => void;
  onComplete: () => void;
  onMoveMade: () => void;
}

export function KlondikeSolitaire({ onScoreChange, onComplete, onMoveMade }: KlondikeSolitaireProps) {
  const [state, setState] = useState<KlondikeState>(() => dealSolitaire());
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedSource, setSelectedSource] = useState<{
    type: 'tableau' | 'waste';
    index: number;
  } | null>(null);
  const [won, setWon] = useState(false);

  const handleStockClick = useCallback(() => {
    setState(prev => {
      const next = dealFromStock(prev, 1);
      onMoveMade();
      return next;
    });
    setSelectedCard(null);
    setSelectedSource(null);
  }, [onMoveMade]);

  const handleWasteClick = useCallback((card: Card) => {
    if (selectedCard) {
      setSelectedCard(null);
      setSelectedSource(null);
      return;
    }
    setSelectedCard(card);
    setSelectedSource({ type: 'waste', index: 0 });
  }, [selectedCard]);

  const handleTableauClick = useCallback((pileIndex: number) => {
    if (!selectedCard) {
      const pile = state.tableau[pileIndex];
      const faceUpCards = pile.cards.filter(c => c.faceUp);
      if (faceUpCards.length === 0) return;
      const topCard = faceUpCards[faceUpCards.length - 1];
      setSelectedCard(topCard);
      setSelectedSource({ type: 'tableau', index: pileIndex });
      return;
    }

    if (selectedSource && selectedSource.type === 'waste') {
      const targetPile = state.tableau[pileIndex];
      if (isValidTableauMove(selectedCard, targetPile)) {
        setState(prev => {
          const newTableau = prev.tableau.map(p => ({ ...p, cards: [...p.cards] }));
          const newWaste = prev.waste.filter(c => c.id !== selectedCard.id);
          newTableau[pileIndex] = {
            ...newTableau[pileIndex],
            cards: [...newTableau[pileIndex].cards, selectedCard],
          };
          const next = { ...prev, tableau: newTableau, waste: newWaste, moves: prev.moves + 1 };
          checkWin(next);
          return next;
        });
        onScoreChange(5);
        onMoveMade();
      }
      setSelectedCard(null);
      setSelectedSource(null);
      return;
    }

    if (selectedSource && selectedSource.type === 'tableau') {
      const sourceIndex = selectedSource.index;
      if (sourceIndex === pileIndex) {
        setSelectedCard(null);
        setSelectedSource(null);
        return;
      }

      const sourcePile = state.tableau[sourceIndex];
      const cardIdx = sourcePile.cards.indexOf(selectedCard);
      if (cardIdx === -1) {
        setSelectedCard(null);
        setSelectedSource(null);
        return;
      }

      const movingCards = sourcePile.cards.slice(cardIdx);
      const remainingCards = sourcePile.cards.slice(0, cardIdx);
      const targetPile = state.tableau[pileIndex];

      const firstInStack = movingCards[0];
      if (isValidTableauMove(firstInStack, targetPile)) {
        setState(prev => {
          const newTableau = prev.tableau.map(p => ({ ...p, cards: [...p.cards] }));
          newTableau[sourceIndex] = { ...newTableau[sourceIndex], cards: remainingCards };
          if (remainingCards.length > 0) {
            const lastIdx = remainingCards.length - 1;
            if (!remainingCards[lastIdx].faceUp) {
              newTableau[sourceIndex].cards[lastIdx] = { ...remainingCards[lastIdx], faceUp: true };
            }
          }
          newTableau[pileIndex] = {
            ...newTableau[pileIndex],
            cards: [...newTableau[pileIndex].cards, ...movingCards],
          };
          const next = { ...prev, tableau: newTableau, moves: prev.moves + 1 };
          checkWin(next);
          return next;
        });
        onScoreChange(5);
        onMoveMade();
      }
      setSelectedCard(null);
      setSelectedSource(null);
    }
  }, [state, selectedCard, selectedSource, onScoreChange, onMoveMade]);

  const handleFoundationClick = useCallback((pileIndex: number) => {
    if (!selectedCard) return;

    const targetPile = state.foundations[pileIndex];
    if (isValidFoundationMove(selectedCard, targetPile)) {
      setState(prev => {
        const newFoundations = prev.foundations.map(p => ({ ...p, cards: [...p.cards] }));
        const wasFromWaste = prev.waste.some(c => c.id === selectedCard.id);
        const wasFromTableau = prev.tableau.some(p =>
          p.cards.some(c => c.id === selectedCard.id)
        );

        newFoundations[pileIndex] = {
          ...newFoundations[pileIndex],
          cards: [...newFoundations[pileIndex].cards, selectedCard],
        };

        let newTableau = prev.tableau.map(p => ({ ...p, cards: [...p.cards] }));
        let newWaste = [...prev.waste];
        let points = 0;

        if (wasFromWaste) {
          newWaste = prev.waste.filter(c => c.id !== selectedCard.id);
          points = 10;
        } else if (wasFromTableau) {
          newTableau = prev.tableau.map(p => {
            const idx = p.cards.findIndex(c => c.id === selectedCard.id);
            if (idx === -1) return { ...p, cards: [...p.cards] };
            const newCards = p.cards.slice(0, idx);
            if (newCards.length > 0) {
              const lastIdx = newCards.length - 1;
              if (!newCards[lastIdx].faceUp) {
                newCards[lastIdx] = { ...newCards[lastIdx], faceUp: true };
              }
            }
            return { ...p, cards: newCards };
          });
          points = 10;
        }

        const next = {
          ...prev,
          foundations: newFoundations,
          tableau: newTableau,
          waste: newWaste,
          score: prev.score + points,
          moves: prev.moves + 1,
        };
        checkWin(next);
        return next;
      });
      onScoreChange(10);
      onMoveMade();
    }

    setSelectedCard(null);
    setSelectedSource(null);
  }, [selectedCard, state, onScoreChange, onMoveMade]);

  const handleAutoComplete = useCallback(() => {
    setState(prev => {
      const completed = runAutoComplete(prev);
      checkWin(completed);
      return completed;
    });
    onMoveMade();
  }, [onMoveMade]);

  const checkWin = useCallback((s: KlondikeState) => {
    if (isKlondikeWon(s) && !won) {
      setWon(true);
      setTimeout(() => onComplete(), 500);
    }
  }, [onComplete, won]);

  const canAuto = canAutoComplete(state);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 12,
        padding: '8px 0',
      }}>
        {won && (
          <span style={{
            fontSize: 16,
            fontFamily: "'Press Start 2P', cursive",
            color: '#3ba372',
          }}>
            YOU WIN!
          </span>
        )}
        {canAuto && !won && (
          <button
            onClick={handleAutoComplete}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: '1px solid #8b7cc9',
              background: 'rgba(139,124,201,0.1)',
              color: '#8b7cc9',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: 9,
              cursor: 'pointer',
            }}
          >
            AUTO COMPLETE
          </button>
        )}
      </div>
      <CardTableView
        tableau={state.tableau}
        foundations={state.foundations}
        stockCount={state.stock.length}
        waste={state.waste}
        onStockClick={handleStockClick}
        onWasteClick={handleWasteClick}
        onTableauClick={handleTableauClick}
        onFoundationClick={handleFoundationClick}
        selectedCard={selectedCard}
      />
      <div style={{
        textAlign: 'center',
        fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'rgba(232,230,227,0.3)',
      }}>
        Moves: {state.moves} | Score: {state.score}
      </div>
    </div>
  );
}

function dealSolitaire(): KlondikeState {
  const rng = createMulberry32(Math.floor(Math.random() * 2147483647));
  const deck = Deck.new(rng);

  const tableau: PileState[] = [];
  for (let i = 1; i <= 7; i++) {
    const cards = deck.deal(i, false);
    if (cards.length > 0) {
      cards[cards.length - 1].faceUp = true;
    }
    tableau.push({ cards, faceUpCount: 1 });
  }

  const stock = deck.drawPile().slice();

  return {
    tableau,
    foundations: Array.from({ length: 4 }, () => ({ cards: [], faceUpCount: 0 })),
    stock,
    waste: [],
    moves: 0,
    score: 0,
  };
}
