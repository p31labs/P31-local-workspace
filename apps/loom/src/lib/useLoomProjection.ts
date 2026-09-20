import { useMemo } from 'react';
import type { LoomEvent } from '@p31/canon/loom/events';
import { colorTokenFor } from './colors';

type ProposeEvent = Extract<LoomEvent, { writer: 'agent'; kind: 'propose' }>;

export interface LoomProjection {
  /** Number of events authored by a human. */
  humanCount: number;
  /** The most recent agent `propose` event, or undefined. */
  latestPropose: ProposeEvent | undefined;
  /** { name, token } from the last agent propose whose body.color is a string
   *  that colorTokenFor resolves, else null. */
  colorInfo: { name: string; token: string } | null;
}

export function useLoomProjection(events: LoomEvent[]): LoomProjection {
  return useMemo(() => {
    let humanCount = 0;
    let latestPropose: ProposeEvent | undefined;
    for (const e of events) {
      if (e.writer === 'human') humanCount++;
      if (e.writer === 'agent' && e.kind === 'propose') latestPropose = e;
    }
    let colorInfo: { name: string; token: string } | null = null;
    for (let i = events.length - 1; i >= 0; i--) {
      const e = events[i];
      if (e.writer !== 'agent' || e.kind !== 'propose') continue;
      const body = e.body as { color?: unknown } | undefined;
      if (typeof body?.color !== 'string') continue;
      const token = colorTokenFor(body.color);
      if (token) { colorInfo = { name: body.color, token }; break; }
    }
    return { humanCount, latestPropose, colorInfo };
  }, [events]);
}