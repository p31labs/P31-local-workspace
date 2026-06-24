import { Card, suitIcon, Suit } from '../../../engine/card/core/types.ts';
import { PileState } from '../../../engine/card/solitaire/validator.ts';

interface CardTableViewProps {
  tableau: PileState[];
  foundations: PileState[];
  stockCount: number;
  waste: Card[];
  onTableauClick?: (pileIndex: number) => void;
  onFoundationClick?: (pileIndex: number) => void;
  onStockClick?: () => void;
  onWasteClick?: (card: Card) => void;
  selectedCard?: Card | null;
}

const PILE_LABELS = ['1', '2', '3', '4', '5', '6', '7'];
const SUIT_ORDER: Suit[] = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];

export function CardTableView({
  tableau,
  foundations,
  stockCount,
  waste,
  onTableauClick,
  onFoundationClick,
  onStockClick,
  onWasteClick,
  selectedCard,
}: CardTableViewProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      width: '100%',
      maxWidth: 900,
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <button
            onClick={onStockClick}
            style={{
              width: 56,
              height: 80,
              borderRadius: 8,
              border: '2px solid rgba(139,124,201,0.2)',
              background: stockCount > 0
                ? 'linear-gradient(135deg, #2a1f5e, #1a1140)'
                : 'transparent',
              cursor: stockCount > 0 ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              color: 'rgba(232,230,227,0.4)',
              fontFamily: "'JetBrains Mono', monospace",
            }}
            aria-label={`Stock: ${stockCount} cards remaining`}
          >
            {stockCount > 0 ? stockCount : '⟳'}
          </button>

          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
            {waste.length > 0 && (
              <div
                style={{ cursor: 'pointer' }}
                onClick={() => onWasteClick?.(waste[waste.length - 1])}
              >
                <div style={{
                  width: 56,
                  height: 80,
                  borderRadius: 8,
                  border: '2px solid rgba(255,255,255,0.10)',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 14,
                  color: selectedCard?.id === waste[waste.length - 1].id ? '#e06c75' : '#cda852',
                  boxShadow: selectedCard?.id === waste[waste.length - 1].id
                    ? '0 0 12px rgba(139,124,201,0.4)'
                    : 'none',
                }}>
                  <span>{suitIcon(waste[waste.length - 1].suit)}</span>
                  <span style={{ fontSize: 12 }}>{waste[waste.length - 1].rank === 1 ? 'A'
                    : waste[waste.length - 1].rank === 11 ? 'J'
                    : waste[waste.length - 1].rank === 12 ? 'Q'
                    : waste[waste.length - 1].rank === 13 ? 'K'
                    : waste[waste.length - 1].rank}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {foundations.map((pile, i) => (
            <button
              key={i}
              onClick={() => onFoundationClick?.(i)}
              style={{
                width: 56,
                height: 80,
                borderRadius: 8,
                border: pile.cards.length === 0
                  ? '2px dashed rgba(255,255,255,0.08)'
                  : '2px solid rgba(255,255,255,0.10)',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: 'rgba(232,230,227,0.3)',
              }}
              aria-label={`Foundation ${SUIT_ORDER[i]}`}
            >
              {pile.cards.length === 0 ? (
                <span style={{ opacity: 0.3 }}>{suitIcon(SUIT_ORDER[i])}</span>
              ) : (
                <>
                  <span style={{
                    fontSize: 14,
                    color: SUIT_ORDER[i] === Suit.Hearts || SUIT_ORDER[i] === Suit.Diamonds
                      ? '#e06c75' : '#cda852'
                  }}>
                    {suitIcon(pile.cards[pile.cards.length - 1].suit)}
                  </span>
                  <span style={{ fontSize: 12, marginTop: 2 }}>
                    {pile.cards.length}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 4,
        justifyContent: 'center',
      }}>
        {tableau.map((pile, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 60,
            }}
          >
            <span style={{
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              color: 'rgba(232,230,227,0.2)',
              marginBottom: 4,
            }}>
              {PILE_LABELS[i]}
            </span>
            <div
              onClick={() => onTableauClick?.(i)}
              style={{
                minWidth: 56,
                minHeight: 80,
                cursor: 'pointer',
              }}
            >
              {pile.cards.map((card, ci) => (
                <div
                  key={card.id}
                  style={{
                    marginTop: ci === 0 ? 0 : (card.faceUp ? 20 : 4),
                    width: 56,
                    height: 80,
                    borderRadius: 8,
                    border: card.faceUp
                      ? '2px solid rgba(255,255,255,0.10)'
                      : '2px solid rgba(139,124,201,0.2)',
                    background: card.faceUp
                      ? 'rgba(255,255,255,0.06)'
                      : 'linear-gradient(135deg, #2a1f5e, #1a1140)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: selectedCard?.id === card.id
                      ? '0 0 12px rgba(139,124,201,0.6)'
                      : 'none',
                    borderColor: selectedCard?.id === card.id
                      ? '#8b7cc9'
                      : card.faceUp ? 'rgba(255,255,255,0.10)' : 'rgba(139,124,201,0.2)',
                  }}
                >
                  {card.faceUp ? (
                    <>
                      <span style={{
                        fontSize: 14,
                        color: card.suit === Suit.Hearts || card.suit === Suit.Diamonds
                          ? '#e06c75' : '#cda852',
                      }}>
                        {suitIcon(card.suit)}
                      </span>
                      <span style={{
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontWeight: 700,
                      }}>
                        {card.rank === 1 ? 'A'
                          : card.rank === 11 ? 'J'
                          : card.rank === 12 ? 'Q'
                          : card.rank === 13 ? 'K'
                          : card.rank}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#8b7cc9', opacity: 0.4, fontSize: 16 }}>🂠</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
