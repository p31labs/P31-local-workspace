import { Card as CardType, cardLabel, suitIcon, cardColor } from '../../../engine/card/core/types.ts';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
  small?: boolean;
}

const STYLES: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.15s ease',
    fontFamily: "'JetBrains Mono', monospace",
    fontWeight: 700,
    position: 'relative',
    border: '2px solid rgba(255,255,255,0.10)',
  },
  faceUp: {
    background: 'rgba(255,255,255,0.06)',
  },
  faceDown: {
    background: 'linear-gradient(135deg, #2a1f5e, #1a1140)',
    border: '2px solid rgba(139,124,201,0.2)',
  },
  selected: {
    transform: 'translateY(-8px)',
    boxShadow: '0 8px 24px rgba(139,124,201,0.4)',
    borderColor: '#8b7cc9',
  },
  disabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
};

export function CardView({ card, onClick, selected, disabled, small }: CardProps) {
  const size = small ? { width: 44, height: 64, fontSize: 12 } : { width: 56, height: 80, fontSize: 14 };
  const isRed = cardColor(card.suit) === 'red';
  const colorStyle: React.CSSProperties = isRed ? { color: '#e06c75' } : { color: '#cda852' };

  const style: React.CSSProperties = {
    ...STYLES.base,
    ...size,
    ...(card.faceUp ? STYLES.faceUp : STYLES.faceDown),
    ...(selected ? STYLES.selected : {}),
    ...(disabled ? STYLES.disabled : {}),
  };

  return (
    <div
      style={style}
      onClick={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={card.faceUp ? `${cardLabel(card.rank)} of ${card.suit}` : 'Face down card'}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !disabled && onClick) onClick();
      }}
    >
      {card.faceUp ? (
        <>
          <span style={{ ...colorStyle, fontSize: size.fontSize, lineHeight: 1 }}>
            {suitIcon(card.suit)}
          </span>
          <span style={{ fontSize: size.fontSize - 2, lineHeight: 1, marginTop: 2 }}>
            {cardLabel(card.rank)}
          </span>
        </>
      ) : (
        <span style={{ fontSize: size.fontSize, color: '#8b7cc9', opacity: 0.6 }}>🂠</span>
      )}
    </div>
  );
}
