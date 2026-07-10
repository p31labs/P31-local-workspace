import { Card } from '../../../engine/card/core/types.ts';
import { CardView } from './CardView.tsx';
import { COLORS } from '../../../lib/arcade-core/theme.ts';

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
          color: 'var(--p31-cloud-40)',
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
        background: 'var(--p31-white-2)',
        borderRadius: 12,
        border: '1px solid var(--p31-white-6)',
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
