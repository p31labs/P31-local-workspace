import { Card } from '../../../engine/card/core/types.ts';
import { CardView } from './CardView.tsx';

interface DiscardPileProps {
  cards: Card[];
  onTakeCard?: (card: Card) => void;
}

export function DiscardPile({ cards, onTakeCard }: DiscardPileProps) {
  if (cards.length === 0) {
    return (
      <div style={{
        width: 56,
        height: 80,
        border: '2px dashed rgba(255,255,255,0.08)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: 'rgba(232,230,227,0.2)',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        DISCARD
      </div>
    );
  }

  const topCard = cards[cards.length - 1];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
    }}>
      <span style={{
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'rgba(232,230,227,0.3)',
        letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>
        DISCARD ({cards.length})
      </span>
      <div style={{ position: 'relative' }}>
        {cards.length > 1 && (
          <div style={{
            position: 'absolute',
            top: -2,
            left: -2,
            width: 56,
            height: 80,
            border: '2px solid rgba(255,255,255,0.04)',
            borderRadius: 8,
            transform: 'rotate(-2deg)',
          }} />
        )}
        <CardView
          card={topCard}
          onClick={() => onTakeCard?.(topCard)}
        />
      </div>
    </div>
  );
}
