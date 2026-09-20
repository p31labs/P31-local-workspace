import { useMemo } from 'react';
import type { LoomEvent } from '@p31/canon/loom/events';

/**
 * The Loom — chapter derivation.
 *
 * The log is the game engine. Progress is derivable from the events
 * the child (and Lumi) have committed. Each chapter unlocks the next:
 *
 *   0 — Fresh: no interaction yet (the Launchpad).
 *   1 — Met Lumi: the child has tapped, a human `focus` event is in
 *       the log. Lumi responds, the field is alive.
 *   2 — Lumi has ideas: at least one `propose` event exists. Lumi
 *       proposes, the child approves or defers.
 *   3 — The workshop: the child has approved or rejected. The full
 *       instrument unlocks.
 */
export function useProgression(events: LoomEvent[]): number {
  return useMemo(() => {
    if (events.length === 0) return 0;
    const hasHumanFocus = events.some(
      (e) => e.writer === 'human' && e.kind === 'focus',
    );
    if (!hasHumanFocus) return 0;
    const hasPropose = events.some((e) => e.kind === 'propose');
    if (!hasPropose) return 1;
    const hasDecision = events.some(
      (e) =>
        (e.writer === 'human' && (e.kind === 'approve' || e.kind === 'reject')),
    );
    if (!hasDecision) return 2;
    return 3;
  }, [events]);
}
