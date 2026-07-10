import { useEffect, useState, type ReactNode } from 'react';

interface UIGCockpitProps {
  spoons: number;
  density?: string;
  children: ReactNode;
}

/**
 * Bonding cockpit UIG adapter (CWP-2026-004, Phase C).
 *
 * Wraps the existing CockpitLayout composition and applies spoon-aware
 * adaptation:
 *  - `data-spoons` on the wrapper lets the DESIGN.md motion kill-switch scale
 *    animation by cognitive state (motion fully disabled at spoons 0–1).
 *  - At spoons === 0 (crisis) only the breathing overlay renders — no HUD
 *    chrome. The overlay is rendered OUTSIDE the `data-spoons="0"` ancestor so
 *    the breathing animation is never frozen.
 *
 * The crisis overlay is implemented here (rather than imported from
 * @p31/interface-generator) so bonding keeps a single React instance.
 */
export function UIGCockpit({ spoons, density, children }: UIGCockpitProps) {
  const [crisisDismissed, setCrisisDismissed] = useState(false);
  const crisis = spoons === 0 && !crisisDismissed;

  return (
    <>
      <div
        data-spoons={spoons}
        data-uig-density={density ?? 'moderate'}
        className="relative w-full h-full"
      >
        {children}
      </div>
      {crisis && <CrisisOverlay onReady={() => setCrisisDismissed(true)} />}
    </>
  );
}

function CrisisOverlay({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onReady();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onReady]);

  return (
    <div className="fixed inset-0 bg-void flex items-center justify-center z-50" style={{ margin: 0 }}>
      <style>{`@keyframes uig-breathe { 0%,100% { transform: scale(1); opacity: .7 } 50% { transform: scale(1.18); opacity: 1 } }`}</style>
      <div className="text-center">
        <div
          className="mx-auto w-40 h-40 rounded-full border-2 border-quantum-cyan"
          style={{ animation: 'uig-breathe 4s ease-in-out infinite' }}
        />
        <p className="text-cloud text-sm mt-8">Rest. Breathe. You can exit when ready.</p>
        <button
          onClick={onReady}
          className="mt-8 px-8 py-4 bg-quantum-cyan text-black rounded-xl font-bold text-lg hover:opacity-90"
        >
          I&apos;m Ready
        </button>
      </div>
    </div>
  );
}
