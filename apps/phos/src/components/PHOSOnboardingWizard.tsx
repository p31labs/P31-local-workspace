import React from 'react';
import { OnboardingSuite } from './OnboardingSuite';

// Build-compat shim: PHOSWorkspace imports `PHOSOnboardingWizard` (which was
// renamed to `OnboardingSuite`). The wizard had no onComplete wiring, so the
// prop is accepted and ignored. See apps/phos/src/components/OnboardingSuite.tsx.
export function PHOSOnboardingWizard(_props: { onComplete?: () => void }) {
  return <OnboardingSuite />;
}

export default PHOSOnboardingWizard;
