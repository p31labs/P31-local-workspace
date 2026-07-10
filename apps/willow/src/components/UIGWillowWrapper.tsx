import type { ReactNode } from 'react';
import { generateInterface, InterfaceRenderer, CrisisOverlay } from '@p31/interface-generator';

interface UIGWillowWrapperProps {
  spoons: number;
  onCrisisExit: () => void;
  children: ReactNode;
}

/**
 * Willow UIG adapter (R4).
 *
 * Wraps willow's existing app tree and applies spoon-aware adaptation:
 *  - `data-spoons` on the wrapper lets the DESIGN.md motion kill-switch scale
 *    animation by cognitive state (motion fully disabled at spoons 0–1).
 *  - At spoons === 0 (crisis) only the canonical breathing overlay renders —
 *    no app chrome. The overlay is imported from @p31/interface-generator and
 *    rendered OUTSIDE the `data-spoons="0"` ancestor so the breathing animation
 *    is never frozen by the motion kill-switch. onReady exits crisis and
 *    restores spoons to 3.
 *
 * InterfaceRenderer is wired via generateInterface so willow participates in the
 * Universal Interface Generator without forking crisis logic.
 */
export function UIGWillowWrapper({ spoons, onCrisisExit, children }: UIGWillowWrapperProps) {
  const description = generateInterface({
    passport: null,
    viewData: { spoons },
    role: 'participant',
    spoons,
  });
  const crisis = spoons === 0;

  return (
    <>
      <div data-spoons={spoons} data-uig="willow">
        {!crisis && <InterfaceRenderer description={description} data={{ spoons }} />}
        {children}
      </div>
      {crisis && <CrisisOverlay onReady={onCrisisExit} />}
    </>
  );
}
