// ProgressiveDisclosure — wraps UI elements that should fade/hide as cognitive load increases.
// Uses the Q Distribution UI tier from useCockpitStore.
// priority: 0=essential (always visible), 1=important, 2=supplementary, 3=decorative

import React from 'react';
import { useCockpitStore, selectUITier } from '../hooks/useCockpitStore';
import { getElementOpacity } from '../../../packages/q-distribution/index.ts';

interface ProgressiveDisclosureProps {
  priority: 0 | 1 | 2 | 3;
  children: React.ReactNode;
  className?: string;
}

export function ProgressiveDisclosure({ priority, children, className }: ProgressiveDisclosureProps) {
  const spoons = useCockpitStore(state => state.metabolicState.current_spoons);
  const maxSpoons = useCockpitStore(state => state.metabolicState.max_spoons);
  const spoonsNormalized = spoons / maxSpoons;
  const opacity = getElementOpacity(spoonsNormalized, priority);

  // At MINIMAL tier (spoons < 0.15), priority > 0 elements are fully hidden (not just faded)
  // to reduce cognitive load to Layer 0
  const tier = selectUITier({ metabolicState: { current_spoons: spoons, max_spoons: maxSpoons, heartbeat_lockout_active: false } } as any);
  const isHidden = tier === 'MINIMAL' && priority > 0;

  if (isHidden) return null;

  return (
    <div
      className={className}
      style={{
        opacity,
        transition: 'opacity 0.6s ease',
        pointerEvents: opacity < 0.1 ? 'none' : undefined,
      }}
    >
      {children}
    </div>
  );
}
