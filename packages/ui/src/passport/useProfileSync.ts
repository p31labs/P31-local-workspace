/**
 * @file useProfileSync.ts — Sync cognitive profile to PASSPORT_KV for Worker personalization.
 * Debounced: syncs on change, max once per 5 seconds.
 */

import { useEffect, useRef } from 'react';
import { usePassport } from './usePassport';

export function useProfileSync() {
  const { passport } = usePassport();
  const did = passport?.did;
  const cognition = passport?.cognition;
  const lastSync = useRef('');

  useEffect(() => {
    if (!did || !cognition) return;

    const hash = `${did}:${JSON.stringify(cognition)}`;
    if (hash === lastSync.current) return;

    const timer = setTimeout(() => {
      lastSync.current = hash;
      fetch('https://intent-resolver.trimtab-signal.workers.dev/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did,
          profile: {
            strengths: (cognition as any).strengths,
            challenges: (cognition as any).challenges,
            communication: (cognition as any).communicationStyle,
          },
        }),
      }).catch(() => {});
    }, 5000);

    return () => clearTimeout(timer);
  }, [did, cognition]);
}

export default useProfileSync;
