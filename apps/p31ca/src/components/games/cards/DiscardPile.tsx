import { Card } from '../../../engine/card/core/types.ts';
import { CardView } from './CardView.tsx';
import { COLORS } from '../../../lib/arcade-core/theme.ts';

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
        border: '2px dashed var(--p31-white-8)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        color: 'var(--p31-cloud-20)',
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
        color: 'var(--p31-cloud-30)',
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
            border: '2px solid var(--p31-white-4)',
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
