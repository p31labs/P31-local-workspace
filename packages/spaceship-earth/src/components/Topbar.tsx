import { useState, useEffect } from 'react';
import { useShipStore } from '../store/shipStore';
import { useSovereignStore } from '../sovereign/useSovereignStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { queueSize as getQueueSize } from '../services/offlineQueue';

function SpoonIcon() {
  return (
    <svg viewBox="0 0 200 200" width="14" height="14" aria-hidden="true">
      <path
        d="M100 30 Q96 80 100 110 Q100 120 100 145"
        stroke="currentColor"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx="100" cy="145" rx="16" ry="26" fill="currentColor" />
      <circle cx="100" cy="30" r="6" fill="currentColor" />
    </svg>
  );
}

export default function Topbar({ onOpenPalette, undoCount, onUndo }: { onOpenPalette: () => void; undoCount: number; onUndo: () => void }) {
  const spoons = useShipStore((s) => s.spoons);
  const setSpoons = useShipStore((s) => s.setSpoons);
  const coherence = useSovereignStore((s) => s.coherence);
  const [pendingOutbox, setPendingOutbox] = useState(0);

  useEffect(() => {
    const updatePending = async () => {
      try {
        const count = await getQueueSize();
        setPendingOutbox(count);
      } catch {
        // outbox not initialized yet
      }
    };
    updatePending();
    const interval = setInterval(updatePending, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="ship-topbar" data-spoons={spoons}>
      <div className="topbar-brand" title="Spaceship Earth — P31 Labs">
        <span className="brand-icon" aria-hidden="true">🌍</span>
        <span className="brand-text">SPACESHIP EARTH</span>
      </div>
      <div className="topbar-center">
        <span className="metric-badge" title="Coherence">
          <span className="status-dot coherence" aria-hidden="true" />
          {(coherence * 100).toFixed(0)}%
        </span>
        {pendingOutbox > 0 && (
          <span className="metric-badge offline-badge" title={`${pendingOutbox} pending write${pendingOutbox > 1 ? 's' : ''}`}>
            ⏳ {pendingOutbox}
          </span>
        )}
      </div>
      <div className="topbar-right">
        <div className="spoon-dial" role="radiogroup" aria-label="Spoon level">
          {[1, 2, 3, 4, 5].map((level) => (
            <button
              key={level}
              type="button"
              className={`spoon-btn${spoons === level ? ' active' : ''}`}
              onClick={() => setSpoons(level)}
              role="radio"
              aria-checked={spoons === level}
              aria-label={`Spoon level ${level}`}
              title={`Spoons: ${level}`}
            >
              <SpoonIcon />
            </button>
          ))}
          <button
            type="button"
            className={`spoon-btn rest${spoons === 0 ? ' active' : ''}`}
            onClick={() => setSpoons(0)}
            role="radio"
            aria-checked={spoons === 0}
            aria-label="Sensory rest mode"
            title="Rest mode (spoons: 0)"
          >
            🧘
          </button>
        </div>
        {undoCount > 0 && (
          <button
            type="button"
            className="metric-badge clickable undo-chip"
            onClick={onUndo}
            title={`Undo last change (⌘Z) — ${useHistoryStore.getState().entries[useHistoryStore.getState().entries.length - 1]?.label ?? ''}`}
          >
            ↩ Undo
          </button>
        )}
        <button
          type="button"
          className="metric-badge clickable palette-trigger"
          onClick={onOpenPalette}
          title="Command palette (⌘K)"
        >
          ⌘K
        </button>
      </div>
    </header>
  );
}
