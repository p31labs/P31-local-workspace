import { Card } from '../../../engine/card/core/types.ts';
import { CardView } from './CardView.tsx';

interface HandViewProps {
  cards: Card[];
  selectedId?: string;
  onCardClick?: (card: Card) => void;
  label?: string;
}

export function HandView({ cards, selectedId, onCardClick, label }: HandViewProps) {
  if (cards.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <span style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: 'rgba(232,230,227,0.4)',
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}>
          {label} ({cards.length})
        </span>
      )}
      <div style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        minHeight: 90,
      }}>
        {cards.map((card) => (
          <CardView
            key={card.id}
            card={card}
            selected={card.id === selectedId}
            onClick={() => onCardClick?.(card)}
          />
        ))}
      </div>
    </div>
  );
}
