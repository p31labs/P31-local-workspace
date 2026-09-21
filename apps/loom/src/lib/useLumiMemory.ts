import { useEffect, useState } from 'react';
import type { LumiMemory } from '@p31/canon/loom/memory';

/**
 * Lumi's persistent memory, fetched once on load.
 *
 * The memory is DERIVED from the log (`/api/loom/memory` folds the scoped
 * events) — it is never stored client-side and never a second source of
 * truth. This hook owns the fetch lifecycle, mirroring useProfile.
 */
export function useLumiMemory(): LumiMemory | null {
  const [memory, setMemory] = useState<LumiMemory | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/loom/memory')
      .then((r) => (r.ok ? r.json() : null))
      .then((m: LumiMemory | null) => {
        if (alive && m) setMemory(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return memory;
}