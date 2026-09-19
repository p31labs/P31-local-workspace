/**
 * The Loom — log-owned state hook.
 *
 * The single place the app touches the log. Fetches the current log, subscribes
 * to the SSE tail, folds via `replay`, and exposes a scrub position. `reduce`
 * runs nowhere else in the app.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { replay } from '@p31/canon/loom/events';
import type { LoomEvent, LoomState } from '@p31/canon/loom/events';

export interface LoomLog {
  events: LoomEvent[];
  state: LoomState;
  /** Effective current position: pinned seq, or the head (events.length - 1). */
  seq: number;
  /** Pin the view to a seq; the log keeps growing behind it. */
  scrub: (seq: number) => void;
  /** Resume following the head. */
  follow: () => void;
}

export function useLoomState(): LoomLog {
  const [events, setEvents] = useState<LoomEvent[]>([]);
  const [pinned, setPinned] = useState<number | null>(null);

  // Initial load.
  useEffect(() => {
    let alive = true;
    fetch('/api/loom/events')
      .then((r) => r.json())
      .then((es: LoomEvent[]) => {
        if (alive) setEvents(es);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Live tail. SSE carries only new events; the initial fetch covers history.
  useEffect(() => {
    const src = new EventSource('/api/loom/stream');
    src.onmessage = (msg) => {
      try {
        const e = JSON.parse(msg.data) as LoomEvent;
        setEvents((prev) => (prev.some((x) => x.seq === e.seq) ? prev : [...prev, e]));
      } catch {
        // ignore malformed stream frames
      }
    };
    return () => src.close();
  }, []);

  const seq = pinned ?? events.length - 1;
  const state = useMemo<LoomState>(() => replay(events, pinned ?? undefined), [events, pinned]);
  const scrub = useCallback((n: number) => setPinned(n), []);
  const follow = useCallback(() => setPinned(null), []);

  return { events, state, seq, scrub, follow };
}
