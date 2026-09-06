/**
 * @file App.tsx — WILLOW genesis entry (CWP rewrite).
 * Flow: AgeGate → ParentalConsent (COPPA VPC) → PWAInstallPrompt (ITP exemption) → Shell.
 */

import { useState } from 'react';
import { registerP31CrisisOverlay } from '@p31/design-core/crisis-overlay';
import { useDeviceClass } from '@p31/design-core/device';
import { AgeGate } from '../features/hearth/components/AgeGate';
import { ParentalConsent } from '../components/ParentalConsent';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { WillowShell } from '../components/WillowShell';
import { CrisisOverlay } from '../components/CrisisOverlay';
import { useWillowStore, ConsentRecord } from '../store/willowStore';
import { loadConsentMeta } from '../lib/consent';

registerP31CrisisOverlay();

type Stage = 'age' | 'consent' | 'install' | 'app';

export function App() {
  const age = useWillowStore((s) => s.age);
  const setAge = useWillowStore((s) => s.setAge);
  const consent = useWillowStore((s) => s.consent);
  const setConsent = useWillowStore((s) => s.setConsent);
  useDeviceClass();

  const [stage, setStage] = useState<Stage>(() => {
    if (age == null) return 'age';
    if (!consent && !loadConsentMeta()) return 'consent';
    return 'install';
  });

  if (stage === 'age') {
    return <AgeGate onAgeSet={(a) => { setAge(a); setStage('consent'); }} />;
  }

  if (stage === 'consent') {
    return (
      <ParentalConsent
        age={age!}
        onGranted={(record: ConsentRecord) => { setConsent(record); setStage('install'); }}
      />
    );
  }

  if (stage === 'install') {
    return <PWAInstallPrompt onResolved={() => setStage('app')} />;
  }

  return (
    <>
      <WillowShell />
      <CrisisOverlay />
    </>
  );
}
