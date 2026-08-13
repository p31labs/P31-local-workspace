import { useEffect } from 'react';

interface RestOverlayProps {
  open: boolean;
  onReturn: () => void;
  onContinue?: () => void;
  affirmation?: { duration: number; sessionMinutes?: number; undoCount?: number } | null;
}

export default function RestOverlay({ open, onReturn, onContinue, affirmation }: RestOverlayProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (affirmation && onContinue) onContinue();
        else onReturn();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onReturn, onContinue, affirmation]);

  if (!open) return null;

  const minutes = Math.floor(affirmation.duration / 60000);
  const durationText = minutes < 1 ? 'just a moment' : minutes === 1 ? '1 minute' : `${minutes} minutes`;
  const sessionText = affirmation.sessionMinutes ? `${affirmation.sessionMinutes} min session` : '';
  const undoText = affirmation.undoCount !== undefined && affirmation.undoCount > 0 ? `${affirmation.undoCount} undos` : '';

  return (
    <div id="rest-overlay" role="dialog" aria-modal="true" aria-label="Sensory rest mode">
      <div id="rest-vignette" />
      {affirmation ? (
        <div id="rest-affirmation">
          <p>You rested for {durationText}. That&apos;s executive function.</p>
          <p style={{ fontSize: 10, color: '#667788', marginTop: 6 }}>
            {sessionText}{sessionText && undoText ? ' · ' : ''}{undoText}
          </p>
          <button onClick={onContinue} aria-label="Return to interface">
            Continue
          </button>
        </div>
      ) : (
        <button id="rest-return" onClick={onReturn} aria-label="Return to interface (Escape)">
          ↩ Return
        </button>
      )}
    </div>
  );
}
