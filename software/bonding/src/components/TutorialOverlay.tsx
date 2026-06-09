// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// TutorialOverlay: step-by-step guided tutorial
//
// WCD-35 D1: Wired to tutorial engine via gameStore.
// WCD-25: Repositioned to bottom-left (Clippy zone) —
//         above palette, left of Jitterbug Navigator.
//         Keeps glassmorphism style, tap-to-advance UX.
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getCurrentStep } from '../engine/tutorial';

export function TutorialOverlay() {
  const activeTutorial = useGameStore((s) => s.activeTutorial);
  const tutorialState = useGameStore((s) => s.tutorialState);
  const fireTutorialEvent = useGameStore((s) => s.fireTutorialEvent);
  const [minimized, setMinimized] = useState(false);

  if (!activeTutorial || !tutorialState) return null;

  const step = getCurrentStep(activeTutorial, tutorialState);
  if (!step) return null;

  const stepNum = tutorialState.currentStep + 1;
  const totalSteps = activeTutorial.steps.length;

  const handleTap = () => {
    fireTutorialEvent({ type: 'any_tap' });
  };

  // WCD-25: Minimized pill — bottom-left (Clippy zone)
  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed left-4 z-50 glass-card px-4 py-2 rounded-full text-sm text-amber-400/60 cursor-pointer hover:text-amber-400/80 transition-colors pointer-events-auto"
        style={{ bottom: 'calc(160px + env(safe-area-inset-bottom, 0px))', minHeight: 40, touchAction: 'manipulation' }}
      >
        {step.emoji} Step {stepNum}/{totalSteps} — tap to show
      </button>
    );
  }

  return (
    <>
      {/* Full-screen tap target for any_tap steps */}
      {step.waitFor.type === 'any_tap' && (
        <button
          type="button"
          onPointerDown={handleTap}
          className="fixed inset-0 z-40 cursor-pointer pointer-events-auto"
          aria-label="Continue tutorial"
        />
      )}

      {/* WCD-25: Clippy zone — bottom-left, above palette, left of Jitterbug */}
      <div
        className="fixed left-4 z-50 pointer-events-auto"
        style={{
          bottom: 'calc(160px + env(safe-area-inset-bottom, 0px))',
          maxWidth: 'min(70vw, 320px)',
        }}
      >
        <div className="px-4 py-2 relative">
          {/* Dismiss */}
          <button
            type="button"
            onClick={() => setMinimized(true)}
            className="absolute -top-1 -right-1 text-white/15 hover:text-white/40 transition-colors cursor-pointer text-xs"
            style={{ minWidth: 28, minHeight: 28, touchAction: 'manipulation' }}
          >
            {'\u2715'}
          </button>

          <div className="flex items-center gap-2 pr-5">
            <span className="text-lg flex-shrink-0 opacity-60">{step.emoji}</span>
            <div className="text-left flex-1 min-w-0">
              <p className="text-sm text-white/60 leading-snug">{step.message}</p>
              {step.celebration && (
                <p className="text-xs text-green/60 mt-0.5">{step.celebration}</p>
              )}
            </div>
          </div>

          <p className="text-[9px] text-white/10 font-mono mt-1">
            {stepNum}/{totalSteps}{step.waitFor.type === 'any_tap' ? ' \u00B7 tap anywhere' : ''}
          </p>
        </div>
      </div>
    </>
  );
}
