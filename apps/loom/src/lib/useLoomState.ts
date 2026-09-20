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

  // Initial load. Prefer the live log; on a static deploy (no /api) fall back
  // to the build-time snapshot, re-anchoring timestamps so the demo field is
  // "recent" rather than however old the snapshot is.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/loom/events');
        if (!res.ok) throw new Error(`events ${res.status}`);
        const es: LoomEvent[] = await res.json();
        if (alive) setEvents(es);
      } catch {
        try {
          const snap = (await (await fetch('/events.snapshot.json')).json()) as LoomEvent[];
          if (!alive || !Array.isArray(snap) || snap.length === 0) return;
          const last = new Date(snap[snap.length - 1].ts).getTime();
          const offset = Date.now() - last;
          const anchored = snap.map((e) => ({
            ...e,
            ts: new Date(new Date(e.ts).getTime() + offset).toISOString(),
          }));
          if (alive) setEvents(anchored);
        } catch {
          // no snapshot either — stay empty
        }
      }
    })();
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
