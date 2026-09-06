// ═══════════════════════════════════════════════════════
// BloodMoonNode — The Ember
//
// A point of dying light in the lower-left void.
// Not a circle, not a moon. An ember.
// Flickers irregularly via CSS keyframes — zero JS
// per-frame cost. Organic, alive, unpredictable.
//
// Tap it: the sky shifts. A crimson vignette seeps
// in from the edges. The void warms. The stars blush.
// Tap again: back to the cold.
//
// March 3 only.
// ═══════════════════════════════════════════════════════

import { useCallback } from 'react';
import { isBloodMoon } from '../config/bloodMoon';
import { useGameStore } from '../store/gameStore';
import { playEmberToggle } from '../engine/sound';

export function BloodMoonNode() {
  const toggle = useGameStore((s) => s.toggleBloodMoon);
  const lit = useGameStore((s) => s.bloodMoonActive);

  const handleTap = useCallback(() => {
    playEmberToggle(!lit);
    toggle();
  }, [toggle, lit]);

  if (!isBloodMoon()) return null;

  return (
    <div
      role="button"
      tabIndex={-1}
      onClick={handleTap}
      onKeyDown={(e) => { if (e.key === 'Enter') handleTap(); }}
      className="fixed"
      style={{
        left: 20,
        bottom: 96,
        width: 48,
        height: 48,
        zIndex: 60,
        pointerEvents: 'auto',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className={lit ? 'ember-lit' : 'ember-idle'} />
    </div>
  );
}
