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
          const snap = (await (await fetch('/events.seed.json')).json()) as LoomEvent[];
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
  // Managed manually (not bare EventSource) for mobile-grade reconnection:
  // EventSource's default is a fixed 3s retry with no backoff — on a phone
  // that swaps Wi-Fi↔cellular it becomes a battery drain. We reconnect with
  // exponential backoff (capped at 30s) and send Last-Event-ID on reconnect so
  // the middleware resumes from where we dropped, not from the head.
  useEffect(() => {
    let alive = true;
    let src: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let lastEventId: string | null = null;

    const connect = () => {
      if (!alive) return;
      // Manual reconnect cannot set the Last-Event-ID header, so carry the
      // last seen seq as a query param; the middleware honors it.
      const url = lastEventId ? `/api/loom/stream?lastEventId=${lastEventId}` : '/api/loom/stream';
      const es = new EventSource(url);
      src = es;
      // The browser drops the Last-Event-ID header on reconnect automatically,
      // but for a manual reconnect we want it explicit and available.
      es.onopen = () => {
        attempts = 0;
      };
      es.onmessage = (msg) => {
        try {
          const e = JSON.parse(msg.data) as LoomEvent;
          lastEventId = String(e.seq);
          setEvents((prev) => (prev.some((x) => x.seq === e.seq) ? prev : [...prev, e]));
        } catch {
          // ignore malformed stream frames
        }
      };
      es.onerror = () => {
        es.close();
        src = null;
        if (!alive) return;
        // Exponential backoff: 1s, 2s, 4s … capped at 30s.
        const delay = Math.min(1000 * 2 ** attempts, 30_000);
        attempts += 1;
        timer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      src?.close();
    };
  }, []);

  const seq = pinned ?? events.length - 1;
  const state = useMemo<LoomState>(() => replay(events, pinned ?? undefined), [events, pinned]);
  const scrub = useCallback((n: number) => setPinned(n), []);
  const follow = useCallback(() => setPinned(null), []);

  return { events, state, seq, scrub, follow };
}
