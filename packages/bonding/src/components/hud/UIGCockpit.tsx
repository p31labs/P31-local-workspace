import { useState, type ReactNode } from 'react';
import { CrisisOverlay } from '@p31/interface-generator';

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
 * The crisis overlay is imported from @p31/interface-generator (same package
 * already used for generateInterface), so bonding keeps a single React instance.
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
