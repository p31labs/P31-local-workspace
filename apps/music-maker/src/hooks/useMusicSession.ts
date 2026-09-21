/**
 * The music maker — useMusicSession.
 *
 * The client side of the log/presence split (§6 of the build prompt):
 *
 *   • COMMITTED — `commit()` POSTs an instrument.zone.* event through the
 *     canon's commit → gate → D1(dev JSONL) → SSE path. The composition log is
 *     the same shared log the Loom uses. Replayable, provenance-tracked.
 *   • EPHEMERAL — `broadcastTrigger()` POSTs to the ungated /ephemeral
 *     endpoint, never persisted, never gated. The SSE stream carries both
 *     committed events (`event: event`) and ephemeral ones (`event: ephemeral`),
 *     visibly distinguishable.
 *
 * Manual EventSource reconnection with exponential backoff + Last-Event-ID
 * resume (mobile-grade), exactly the Loom's useLoomState pattern.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoomEvent } from '@p31/canon/loom/events';
import type { MusicZone, Timbre } from '../scene/musicZone';

export interface EphemeralTrigger {
  type: 'ephemeral';
  kind: 'zone.trigger';
  zone: string;
  origin: string;
}

export interface MusicSession {
  zones: MusicZone[];
  /** Zone id -> recent trigger timestamps (drive the glow decay). */
  triggers: Record<string, number[]>;
  /** Recently seen remote trigger ids (for presence echo). */
  remoteTriggers: Array<{ zone: string; origin: string; at: number }>;
  /** Commit a placement — returns true when the gate accepted it. */
  placeZone: (position: [number, number, number], timbre: Timbre, name?: string) => Promise<boolean>;
  /** Commit a clear. */
  clearZone: (id: string) => Promise<boolean>;
  /** Commit a rename. */
  nameZone: (id: string, name: string) => Promise<boolean>;
  /** Ephemeral — never persisted. Triggers the zone's sound + glow locally
   *  and broadcasts the trigger to other devices. */
  triggerZone: (id: string) => void;
  /** Local-glows-only trigger (the visual echo always fires). */
  localTrigger: (id: string) => void;
  /** Zone id to short display name. */
  zoneName: (id: string) => string;
}

const HALF_LIFE_TRIGGER = 60_000;

function zoneById(zones: MusicZone[], id: string): MusicZone | undefined {
  return zones.find((z) => z.id === id);
}

/** Pure: reduce committed events to the zone list. Deterministic — the same
 *  event list yields the same zones, so reconnect reconciliation (B1) and the
 *  initial load use one code path. Extracted for testability. */
export function zonesFromEvents(es: LoomEvent[]): MusicZone[] {
  return es
    .filter((e) => e.kind === 'instrument.zone.place')
    .map((e) => ({
      id: e.node,
      position: (e as LoomEvent & { position: [number, number, number] }).position,
      timbre: (e as LoomEvent & { timbre: Timbre }).timbre,
      name: (e as LoomEvent & { name?: string }).name ?? '',
    }));
}

/** The live-stream frame kinds the client understands. A control frame from
 *  the worker (committed-resume) must never be treated as a LoomEvent; an
 *  ephemeral trigger is broadcast presence, never persisted. Pure, so the
 *  discrimination is testable without the transport. */
export type StreamFrame = LoomEvent | EphemeralTrigger | { type: 'committed-resume'; seq: number };

export function classifyFrame(data: string): StreamFrame | null {
  try {
    const parsed = JSON.parse(data) as StreamFrame;
    const t = (parsed as { type?: unknown }).type;
    if (t === 'committed-resume' || t === 'ephemeral') return parsed;
    if ('seq' in parsed && 'kind' in parsed) return parsed as LoomEvent;
    return null;
  } catch {
    return null;
  }
}

export function useMusicSession(): MusicSession {
  const [zones, setZones] = useState<MusicZone[]>([]);
  const [triggers, setTriggers] = useState<Record<string, number[]>>({});
  const [remoteTriggers, setRemoteTriggers] = useState<Array<{ zone: string; origin: string; at: number }>>([]);
  const zonesRef = useRef<MusicZone[]>([]);
  zonesRef.current = zones;
  const triggersRef = useRef<Record<string, number[]>>(triggers);
  triggersRef.current = triggers;
  const originRef = useRef(`device:${Math.random().toString(36).slice(2, 8)}`);

  // ── Initial composition load (the committed log) ───────────────────────
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/music/events');
        if (!res.ok) throw new Error(`events ${res.status}`);
        const es = (await res.json()) as LoomEvent[];
        if (!alive) return;
        setZones(zonesFromEvents(es));
      } catch {
        // No log — empty field. The planetarium starts silent.
      }
    })();
    return () => { alive = false; };
  }, []);

  // ── Live tail: committed events + ephemeral triggers on one stream. The
  //    transport is transport-agnostic: production serves this over a
  //    WebSocket (worker/ Durable Object, Hibernation), the dev middleware
  //    serves it over SSE (vite.config.ts). Both speak the same JSON frames —
  //    a frame is ephemeral iff it carries type:'ephemeral'; anything else is
  //    a committed LoomEvent. WebSocket preferred; EventSource fallback. ─────
  useEffect(() => {
    let alive = true;
    let src: EventSource | null = null;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let lastEventId: string | null = null;

    // One frame handler for both transports. Ephemeral vs committed is decided
    // by shape, never by transport — a debug log can tag which is which.
    // `committed-resume` (the worker's connect hint) is explicitly skipped:
    // it is a control frame, never a LoomEvent. Pure discrimination via
    // classifyFrame so the rules are unit-testable.
    const handleFrame = (data: string) => {
      const parsed = classifyFrame(data);
      if (!parsed) return;
      // A frame that carries an explicit `type` is either a control frame
      // (committed-resume) or an ephemeral trigger — never a LoomEvent.
      if ('type' in parsed) {
        if (parsed.type === 'committed-resume') return;
        const m = parsed;
        if (m.kind !== 'zone.trigger' || m.origin === originRef.current) return;
        setRemoteTriggers((prev) => [{ zone: m.zone, origin: m.origin, at: Date.now() }, ...prev].slice(0, 8));
        // A remote trigger also glows locally (visual echo).
        setTriggers((prev) => ({
          ...prev,
          [m.zone]: [...(prev[m.zone] ?? []), Date.now()].slice(-16),
        }));
        return;
      }
      const e = parsed;
      lastEventId = String(e.seq);
      setZones((prev) => {
        if (e.kind === 'instrument.zone.place') {
          if (zoneById(prev, e.node)) return prev;
          return [
            ...prev,
            {
              id: e.node,
              position: (e as LoomEvent & { position: [number, number, number] }).position,
              timbre: (e as LoomEvent & { timbre: Timbre }).timbre,
              name: (e as LoomEvent & { name?: string }).name ?? '',
            },
          ];
        }
        if (e.kind === 'instrument.zone.clear') return prev.filter((z) => z.id !== e.node);
        if (e.kind === 'instrument.zone.name') {
          return prev.map((z) => (z.id === e.node ? { ...z, name: (e as LoomEvent & { name: string }).name } : z));
        }
        return prev;
      });
    };

    const connectWebSocket = () => {
      if (!alive) return;
      // Production: the Durable Object upgrades /stream to a WebSocket. Same
      // endpoint path, same frames.
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${location.host}/api/music/stream${location.search}`;
      const socket = new WebSocket(wsUrl);
      ws = socket;
      socket.onopen = () => {
        attempts = 0;
        // B1: reconcile missed committed events on (re)connect. The DO's
        // committed-resume frame only hints at the tail seq; the client
        // re-fetches /events and replaces the zone list — the same code path
        // as the initial load, so a reconnect converges exactly like a fresh
        // visit. Ephemeral history is not replayed (it is gone by definition).
        void fetch('/api/music/events')
          .then((r) => (r.ok ? (r.json() as Promise<LoomEvent[]>) : null))
          .then((es) => {
            if (es && alive) setZones(zonesFromEvents(es));
          })
          .catch(() => {});
      };
      socket.onmessage = (ev) => handleFrame(String(ev.data));
      socket.onclose = () => {
        ws = null;
        if (!alive) return;
        const delay = Math.min(1000 * 2 ** attempts, 30_000);
        attempts += 1;
        timer = setTimeout(connectWebSocket, delay);
      };
      socket.onerror = () => socket.close();
    };

    const connectEventSource = () => {
      if (!alive) return;
      // Dev middleware: SSE with Last-Event-ID resume (mobile backoff).
      const url = lastEventId ? `/api/music/stream?lastEventId=${lastEventId}` : '/api/music/stream';
      const es = new EventSource(url);
      src = es;
      es.onopen = () => { attempts = 0; };
      es.onmessage = (msg) => handleFrame(String((msg as MessageEvent).data));
      es.onerror = () => {
        es.close();
        src = null;
        if (!alive) return;
        const delay = Math.min(1000 * 2 ** attempts, 30_000);
        attempts += 1;
        timer = setTimeout(connectEventSource, delay);
      };
    };

    // Prefer WebSocket (production transport); fall back to EventSource (dev)
    // only when the upgrade fails — e.g. the dev middleware, which serves SSE.
    const prefersWs = () => {
      try {
        return typeof WebSocket === 'function' && location.protocol === 'https:';
      } catch {
        return false;
      }
    };
    if (prefersWs()) connectWebSocket();
    else connectEventSource();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      src?.close();
      ws?.close();
    };
  }, []);

  const placeZone = useCallback(async (position: [number, number, number], timbre: Timbre, name?: string): Promise<boolean> => {
    const id = `zone:${Date.now().toString(36)}`;
    try {
      const res = await fetch('/api/music/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            writer: 'human',
            kind: 'instrument.zone.place',
            node: id,
            position,
            timbre,
            ...(name ? { name } : {}),
          },
        }),
      });
      const r = (await res.json()) as { valid: boolean; error?: string };
      return r.valid;
    } catch {
      return false;
    }
  }, []);

  const clearZone = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/music/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { writer: 'human', kind: 'instrument.zone.clear', node: id } }),
      });
      const r = (await res.json()) as { valid: boolean; error?: string };
      return r.valid;
    } catch {
      return false;
    }
  }, []);

  const nameZone = useCallback(async (id: string, name: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/music/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { writer: 'human', kind: 'instrument.zone.name', node: id, name } }),
      });
      const r = (await res.json()) as { valid: boolean; error?: string };
      return r.valid;
    } catch {
      return false;
    }
  }, []);

  const localTrigger = useCallback((id: string) => {
    setTriggers((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), Date.now()].slice(-16) }));
  }, []);

  const triggerZone = useCallback(
    (id: string) => {
      localTrigger(id);
      const m: EphemeralTrigger = { type: 'ephemeral', kind: 'zone.trigger', zone: id, origin: originRef.current };
      void fetch('/api/music/ephemeral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m),
      }).catch(() => {});
    },
    [localTrigger],
  );

  const zoneName = useCallback((id: string) => {
    return zoneById(zonesRef.current, id)?.name || id;
  }, []);

  return { zones, triggers, remoteTriggers, placeZone, clearZone, nameZone, triggerZone, localTrigger, zoneName };
}