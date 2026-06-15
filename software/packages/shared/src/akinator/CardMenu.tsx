import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from 'react';

// ═════════════════════════════════════════════════════════════════
// CardMenu — Visual Menu Component
// @p31/shared/akinator
//
// Spoon-aware card menu that shows Akinator suggestions as
// tappable cards. Highlights cards in sequence when voice reads
// options. Grid or list layout.
// ═════════════════════════════════════════════════════════════════

// ─── Max items based on spoon level ───────────────────────────
function maxItemsForSpoons(spoons: number): number {
    if (spoons <= 0)
        return 1;
    if (spoons <= 2)
        return 2;
    if (spoons <= 4)
        return 3;
    return 4;
}

// ─── Types ─────────────────────────────────────────────────────
interface MenuOption {
    entry: {
        id: string;
        name: string;
        description: string;
        emoji: string;
        minSpoons?: number;
    };
    confidence?: number;
    highlightReason?: string;
}

interface CardMenuProps {
    options: MenuOption[];
    spoons: number;
    layout?: 'grid' | 'list';
    columns?: number;
    showConfidence?: boolean;
    showDescription?: boolean;
    maxItems?: number;
    highlightedIndex?: number;
    selectedIndex?: number; // Added for aria-selected
    onSelect: (id: string) => void;
    onLongPress?: (id: string) => void;
    onMoreInfo?: (id: string) => void;
    className?: string;
    style?: React.CSSProperties;
}

// ═════════════════════════════════════════════════════════════════
// CARD MENU COMPONENT
// ═════════════════════════════════════════════════════════════════
export const CardMenu = ({
    options,
    spoons,
    layout = 'grid',
    columns,
    showConfidence = false,
    showDescription = true,
    maxItems,
    highlightedIndex = -1,
    selectedIndex = 0, // Default to first item selected
    onSelect,
    onLongPress,
    onMoreInfo,
    className = '',
    style,
}: CardMenuProps) => {
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [pressedId, setPressedId] = useState<string | null>(null);
    const cardsRef = useRef<HTMLDivElement>(null);
    const effectiveMax = maxItems ?? maxItemsForSpoons(spoons);
    const visibleOptions = options.slice(0, effectiveMax);

    // Scroll highlighted card into view during voice readout
    useEffect(() => {
        if (highlightedIndex >= 0 && cardsRef.current) {
            const cards = cardsRef.current.querySelectorAll('[data-card]');
            cards[highlightedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [highlightedIndex]);

    // Cleanup long press timer
    useEffect(() => {
        return () => {
            if (longPressTimer)
                clearTimeout(longPressTimer);
        };
    }, [longPressTimer]);

    const handlePointerDown = useCallback((entry: MenuOption['entry']) => {
        setPressedId(entry.id);
        if (onLongPress) {
            const timer = setTimeout(() => {
                onLongPress(entry.id);
                setPressedId(null);
            }, 600);
            setLongPressTimer(timer);
        }
    }, [onLongPress]);

    const handlePointerUp = useCallback((entryId: string) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        setPressedId(null);
        onSelect(entryId);
    }, [longPressTimer, onSelect]);

    const handlePointerLeave = useCallback(() => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        setPressedId(null);
    }, [longPressTimer]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent, entryId: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(entryId);
        }
        // Arrow key navigation could be added here if needed
    }, [onSelect]);

    const gridCols = columns ?? (visibleOptions.length <= 2 ? 2 : visibleOptions.length <= 4 ? 2 : 3);

    return (
        <div
            ref={cardsRef}
            className={`card-menu ${className}`}
            style={style}
            role="listbox" // Changed from "menu" to "listbox"
            aria-label="Navigation menu"
        >
            {layout === 'list' ? (
                <div
                    className="card-menu-list"
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
                >
                    {visibleOptions.map((opt, i) => (
                        _jsx(
                            CardItem,
                            {
                                option: opt,
                                index: i,
                                isHighlighted: i === highlightedIndex,
                                isPressed: pressedId === opt.entry.id,
                                showConfidence,
                                showDescription,
                                onPointerDown: () => handlePointerDown(opt.entry),
                                onPointerUp: () => handlePointerUp(opt.entry.id),
                                onPointerLeave: handlePointerLeave,
                                onMoreInfo,
                                selected: i === selectedIndex, // Pass selected prop
                                onKeyDown: (e) => handleKeyDown(e, opt.entry.id), // Add keyboard handler
                            },
                            opt.entry.id
                        )
                    ))}
                </div>
            ) : (
                <div
                    className="card-menu-grid"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(' + gridCols + ', 1fr)',
                        gap: '0.75rem',
                    }}
                >
                    {visibleOptions.map((opt, i) => (
                        _jsx(
                            CardItem,
                            {
                                option: opt,
                                index: i,
                                isHighlighted: i === highlightedIndex,
                                isPressed: pressedId === opt.entry.id,
                                showConfidence,
                                showDescription,
                                onPointerDown: () => handlePointerDown(opt.entry),
                                onPointerUp: () => handlePointerUp(opt.entry.id),
                                onPointerLeave: handlePointerLeave,
                                onMoreInfo,
                                selected: i === selectedIndex, // Pass selected prop
                                onKeyDown: (e) => handleKeyDown(e, opt.entry.id), // Add keyboard handler
                            },
                            opt.entry.id
                        )
                    ))}
                </div>
            )}
            {options.length > effectiveMax && (
                <div
                    className="card-menu-overflow"
                    style={{ textAlign: 'center', marginTop: '0.5rem' }}
                >
                    <span
                        style={{ fontSize: '0.75rem', opacity: 0.5 }}
                    >
                        +{options.length - effectiveMax} more (raise energy to see all)
                    </span>
                </div>
            )}
        </div>
    );
};

const CardItem = ({
    option,
    index,
    isHighlighted,
    isPressed,
    showConfidence,
    showDescription,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onMoreInfo,
    selected, // New prop for aria-selected
    onKeyDown, // New prop for keyboard handling
}: {
    option: MenuOption;
    index: number;
    isHighlighted: boolean;
    isPressed: boolean;
    showConfidence: boolean;
    showDescription: boolean;
    onPointerDown: () => void;
    onPointerUp: () => void;
    onPointerLeave: () => void;
    onMoreInfo: (id: string) => void;
    selected: boolean;
    onKeyDown: (e: React.KeyboardEvent) => void;
}) => {
    const { entry, confidence, highlightReason } = option;

    return (
        <div
            data-card={true}
            role="option" // Changed from "menuitem" to "option" for listbox
            tabIndex={0}
            aria-label={`${entry.name}: ${entry.description}`}
            aria-selected={selected} // Add aria-selected
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerLeave}
            onKeyDown={onKeyDown}
            style={{
                position: 'relative',
                padding: '1rem',
                borderRadius: '1rem',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all 0.2s ease',
                transform: isPressed ? 'scale(0.95)' : isHighlighted ? 'scale(1.03)' : 'scale(1)',
                background: isHighlighted
                    ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(168, 85, 247, 0.15))'
                    : 'rgba(255, 255, 255, 0.08)',
                border: isHighlighted
                    ? '2px solid rgba(34, 211, 238, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: isHighlighted
                    ? '0 0 20px rgba(34, 211, 238, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
            }}
        >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                {entry.emoji}
            </div>
            <div
                style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: isHighlighted ? '#22d3ee' : 'white',
                    marginBottom: '0.25rem',
                }}
            >
                {entry.name}
            </div>
            {showDescription && (
                <div
                    style={{
                        fontSize: '0.75rem',
                        color: 'rgba(255, 255, 255, 0.6)',
                        lineHeight: 1.4,
                    }}
                >
                    {entry.description}
                </div>
            )}
            {showConfidence &&
                confidence !== undefined && (
                    <div>
                        <div
                            style={{
                                height: '3px',
                                borderRadius: '2px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                overflow: 'hidden',
                            }}
                        >
                            <div
                                style={{
                                    height: '100%',
                                    width: confidence + '%',
                                    borderRadius: '2px',
                                    background:
                                        confidence > 70
                                            ? '#34d399'
                                            : confidence > 40
                                            ? '#fbbf24'
                                            : '#fb7185',
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        </div>
                        <div
                            style={{
                                fontSize: '0.6rem',
                                color: 'rgba(255, 255, 255, 0.4)',
                                marginTop: '0.125rem',
                            }}
                        >
                            {confidence}% match
                        </div>
                    </div>
                )}
            {highlightReason && (
                <div
                    style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        fontSize: '0.6rem',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '999px',
                        background: 'rgba(34, 211, 238, 0.2)',
                        color: '#22d3ee',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {highlightReason}
                </div>
            )}
            {onMoreInfo && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onMoreInfo(entry.id);
                    }}
                    style={{
                        position: 'absolute',
                        bottom: '0.5rem',
                        right: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.3)',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '0.25rem',
                    }}
                    aria-label={`More info about ${entry.name}`}
                >
                    ℹ️
                </button>
            )}
        </div>
    );
};

// ═════════════════════════════════════════════════════════════════
// PRESETS — Common card menu configurations
// ═════════════════════════════════════════════════════════════════
export function suggestionsToOptions(suggestions: any[]) {
    return suggestions.map((s) => ({
        entry: s.entry,
        confidence: s.confidence,
        highlightReason: s.reason,
    }));
}

export function entriesToOptions(entries: any[]) {
    return entries.map((e) => ({ entry: e }));
}

export function filterBySpoons(options: MenuOption[], spoons: number) {
    return options.filter((o) => o.entry.minSpoons <= spoons);
}

export default CardMenu;