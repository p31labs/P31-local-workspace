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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LoomEvent } from '@p31/canon/loom/events';
import type { LoomEventInput } from '@p31/canon/loom/gate';
import type { MusicZone, Timbre } from '../scene/musicZone';

export interface EphemeralTrigger {
  type: 'ephemeral';
  kind: 'zone.trigger';
  zone: string;
  origin: string;
}

/** A remote trigger as surfaced to the consumer. `seq` is a MONOTONIC counter
 *  (local to this device, not the log's seq) so a consumer can track which
 *  remote triggers it has already played. The presence echo list is capped at
 *  8 for display, but the counter must NOT reset when the cap drops old
 *  entries — otherwise a consumer tracking by array length would silently stop
 *  playing new triggers once the list is full. */
export interface RemoteTrigger {
  zone: string;
  origin: string;
  at: number;
  seq: number;
}

/** A pending committed-write, resolved when the DO's commit-ack echoes back.
 *  Keyed by requestId so a WS round-trip resolves the right promise. */
interface PendingCommit {
  resolve: (result: CommitResult) => void;
}

/** The outcome of a committed write. Discriminated so a caller can tell a real
 *  gate rejection from a dropped transport or a silent timeout — "the
 *  instrument is full" and "your connection dropped" are different messages.
 *  reason: 'gate' = the canon rejected it; 'timeout' = no ack within the
 *  window; 'network' = the transport errored before a result arrived. */
export type CommitResult =
  | { ok: true }
  | { ok: false; reason: 'gate' | 'timeout' | 'network' };

export interface MusicSession {
  zones: MusicZone[];
  /** Zone id -> recent trigger timestamps (drive the glow decay). */
  triggers: Record<string, number[]>;
  /** Recently seen remote trigger ids (newest first, capped at 8 for display).
   *  Each carries a monotonic `seq` for reliable delta tracking. */
  remoteTriggers: RemoteTrigger[];
  /** Commit a placement — the gate's verdict, or why it didn't land. */
  placeZone: (position: [number, number, number], timbre: Timbre, name?: string) => Promise<CommitResult>;
  /** Commit a clear. */
  clearZone: (id: string) => Promise<CommitResult>;
  /** Commit a rename. */
  nameZone: (id: string, name: string) => Promise<CommitResult>;
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

/** Pure: given the newest-first remote-trigger list and the highest seq already
 *  consumed, return the unseen triggers in arrival order (oldest first). The
 *  list is capped at 8 for display, but tracking by SEQ (not array length)
 *  means a full cap never stalls the delta — the monotonic seq still advances.
 *  Pure, so the A3 delta rule is unit-testable. */
export function unseenRemoteTriggers(list: RemoteTrigger[], lastSeenSeq: number): RemoteTrigger[] {
  const unseen = list.filter((t) => t.seq > lastSeenSeq);
  return unseen.reverse(); // newest-first → oldest-first (arrival order)
}

/** The live-stream frame kinds the client understands. classifyFrame returns a
 *  TAGGED union so consumers never re-check `type` with `in` — the cases are
 *  explicit: control (the worker's committed-resume hint, never a LoomEvent),
 *  ephemeral (broadcast presence, never persisted), commitAck (a committed-
 *  write echo resolving the caller's promise), committed (a real LoomEvent).
 *  Pure, so the discrimination is testable without a transport. */
export type StreamFrame =
  | { kind: 'control'; seq: number }
  | { kind: 'ephemeral'; trigger: EphemeralTrigger }
  | { kind: 'commitAck'; requestId: string; valid: boolean; error?: string }
  | { kind: 'committed'; event: LoomEvent };

export function classifyFrame(data: string): StreamFrame | null {
  try {
    const parsed = JSON.parse(data) as Record<string, unknown>;
    if (parsed.type === 'committed-resume') return { kind: 'control', seq: parsed.seq as number };
    if (parsed.type === 'ephemeral') return { kind: 'ephemeral', trigger: parsed as unknown as EphemeralTrigger };
    if (parsed.type === 'commit-ack') {
      return {
        kind: 'commitAck',
        requestId: parsed.requestId as string,
        valid: parsed.valid as boolean,
        error: parsed.error as string | undefined,
      };
    }
    if ('seq' in parsed && 'kind' in parsed) return { kind: 'committed', event: parsed as unknown as LoomEvent };
    return null;
  } catch {
    return null;
  }
}

export function useMusicSession(): MusicSession {
  const [zones, setZones] = useState<MusicZone[]>([]);
  const [triggers, setTriggers] = useState<Record<string, number[]>>({});
  const [remoteTriggers, setRemoteTriggers] = useState<RemoteTrigger[]>([]);
  const zonesRef = useRef<MusicZone[]>([]);
  zonesRef.current = zones;
  const triggersRef = useRef<Record<string, number[]>>(triggers);
  triggersRef.current = triggers;
  const originRef = useRef(`device:${Math.random().toString(36).slice(2, 8)}`);
  // Monotonic counter for remote triggers — survives the display cap so a
  // consumer's delta tracking never stalls when the list is full.
  const remoteSeqRef = useRef(0);
  // The live WebSocket (when the production transport is active). Ephemeral
  // triggers are sent over THIS socket — the DO's webSocketMessage broadcasts
  // them to other clients. When no WS is open (SSE dev transport), ephemeral
  // falls back to the HTTP POST /ephemeral endpoint.
  const liveWsRef = useRef<WebSocket | null>(null);
  // Committed-write round-trips over the WS: requestId -> resolver. Resolved
  // when the DO's commit-ack echo returns.
  const pendingCommitsRef = useRef(new Map<string, PendingCommit>());
  const commitSeqRef = useRef(0);
  // The committed events streamed since the last reconnect reconciliation, so
  // a client never double-applies the same seq.
  const seenSeqRef = useRef(-1);

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
    // Pure discrimination via classifyFrame (a tagged union) so the rules are
    // unit-testable; a control frame (committed-resume) is never a LoomEvent.
    const handleFrame = (data: string) => {
      const frame = classifyFrame(data);
      if (!frame) return;
      if (frame.kind === 'control') return;
      if (frame.kind === 'commitAck') {
        const pending = pendingCommitsRef.current.get(frame.requestId);
        if (pending) {
          pendingCommitsRef.current.delete(frame.requestId);
          pending.resolve(frame.valid ? { ok: true } : { ok: false, reason: 'gate' });
        }
        return;
      }
      if (frame.kind === 'ephemeral') {
        const m = frame.trigger;
        if (m.kind !== 'zone.trigger' || m.origin === originRef.current) return;
        const seq = ++remoteSeqRef.current;
        setRemoteTriggers((prev) => [{ zone: m.zone, origin: m.origin, at: Date.now(), seq }, ...prev].slice(0, 8));
        // A remote trigger also glows locally (visual echo).
        setTriggers((prev) => ({
          ...prev,
          [m.zone]: [...(prev[m.zone] ?? []), Date.now()].slice(-16),
        }));
        return;
      }
      const e = frame.event;
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

    // ── Transport: WS-first, SSE fallback. The production transport is the
    //    WebSocket (worker/ Durable Object); the dev middleware serves SSE.
    //    We TRY WebSocket first regardless of protocol — a dev Vite server that
    //    can't upgrade falls back to SSE on error. `?transport=sse` forces SSE
    //    (e.g. a proxy that blocks WebSocket).
    //
    //    OSCILLATION POLICY (deliberate): the code is symmetric — a WS drop
    //    falls to SSE, an SSE drop retries WS. On a network that permanently
    //    blocks WS, this oscillates WS→SSE→WS… but the SHARED backoff counter
    //    bounds the rate (1s, 2s, 4s… capped 30s), so it is a slow probe of
    //    whether WS has recovered, not a busy loop. A symmetric reconnect is
    //    better than a permanent SSE lock-in when a flaky network comes back.
    //    If that ever proves chatty on a real family device, switch to
    //    one-way: once on SSE, stay there until the next page load.
    let transport: 'ws' | 'sse' = new URLSearchParams(location.search).get('transport') === 'sse'
      ? 'sse'
      : 'ws';

    const schedule = (fn: () => void) => {
      // Shared backoff counter across BOTH transports — resetting it on a
      // fallback would let N clients reconnect in lockstep (thundering herd).
      const delay = Math.min(1000 * 2 ** attempts, 30_000);
      attempts += 1;
      timer = setTimeout(fn, delay);
    };

    const connectWebSocket = () => {
      if (!alive) return;
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${location.host}/api/music/stream${location.search}`;
      const socket = new WebSocket(wsUrl);
      ws = socket;
      liveWsRef.current = socket;
      socket.onopen = () => {
        attempts = 0;
        transport = 'ws';
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
        if (liveWsRef.current === socket) liveWsRef.current = null;
        if (!alive) return;
        // WS failed → fall back to SSE (and stay there for the session).
        if (transport === 'ws') {
          transport = 'sse';
          schedule(connectEventSource);
        } else {
          schedule(connectWebSocket);
        }
      };
      socket.onerror = () => socket.close();
    };

    const connectEventSource = () => {
      if (!alive) return;
      const url = lastEventId ? `/api/music/stream?lastEventId=${lastEventId}` : '/api/music/stream';
      const es = new EventSource(url);
      src = es;
      es.onopen = () => {
        attempts = 0;
        // A dropped SSE re-tries WS first (the production transport).
        transport = 'sse';
      };
      es.onmessage = (msg) => handleFrame(String((msg as MessageEvent).data));
      es.onerror = () => {
        es.close();
        src = null;
        if (!alive) return;
        schedule(transport === 'sse' ? connectWebSocket : connectEventSource);
      };
    };

    // Always start WS-first (unless forced to SSE); the fallback handles the
    // dev Vite middleware, which serves SSE instead of upgrading.
    if (transport === 'sse') connectEventSource();
    else connectWebSocket();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      liveWsRef.current = null;
      src?.close();
      ws?.close();
    };
  }, []);

  // Commit a composition event over the active transport: over the live
  // WebSocket when open (reliable fan-out under Hibernation, with a commit-ack
  // echo resolving the promise), else the HTTP POST /event endpoint (the SSE
  // dev transport). Both return whether the gate accepted it.
const commitOverTransport = useCallback(async (input: LoomEventInput): Promise<CommitResult> => {
    const socket = liveWsRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      const requestId = `c${++commitSeqRef.current}`;
      return new Promise<CommitResult>((resolve) => {
        const timer = setTimeout(() => {
          pendingCommitsRef.current.delete(requestId);
          // No ack within the window — the transport likely dropped it.
          resolve({ ok: false, reason: 'timeout' });
        }, 10_000);
        pendingCommitsRef.current.set(requestId, {
          resolve: (result) => {
            clearTimeout(timer);
            resolve(result);
          },
        });
        try {
          socket.send(JSON.stringify({ requestId, input }));
        } catch {
          pendingCommitsRef.current.delete(requestId);
          clearTimeout(timer);
          resolve({ ok: false, reason: 'network' });
        }
      });
    }
    try {
      const res = await fetch('/api/music/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input }),
      });
      const r = (await res.json()) as { valid: boolean; error?: string };
      return r.valid ? { ok: true } : { ok: false, reason: 'gate' };
    } catch {
      return { ok: false, reason: 'network' };
    }
  }, []);

  const placeZone = useCallback(async (position: [number, number, number], timbre: Timbre, name?: string): Promise<CommitResult> => {
    return commitOverTransport({
      writer: 'human',
      kind: 'instrument.zone.place',
      node: `zone:${Date.now().toString(36)}`,
      position,
      timbre,
      ...(name ? { name } : {}),
    });
  }, [commitOverTransport]);

  const clearZone = useCallback(async (id: string): Promise<CommitResult> => {
    return commitOverTransport({ writer: 'human', kind: 'instrument.zone.clear', node: id });
  }, [commitOverTransport]);

  const nameZone = useCallback(async (id: string, name: string): Promise<CommitResult> => {
    return commitOverTransport({ writer: 'human', kind: 'instrument.zone.name', node: id, name });
  }, [commitOverTransport]);

  const localTrigger = useCallback((id: string) => {
    setTriggers((prev) => ({ ...prev, [id]: [...(prev[id] ?? []), Date.now()].slice(-16) }));
  }, []);

  const triggerZone = useCallback(
    (id: string) => {
      localTrigger(id);
      const m: EphemeralTrigger = { type: 'ephemeral', kind: 'zone.trigger', zone: id, origin: originRef.current };
      // Production: send over the live WebSocket — the DO's webSocketMessage
      // broadcasts to the other clients. (HTTP POST /ephemeral is the SSE-dev
      // fallback; under WebSocket Hibernation an HTTP fan-out from a separate
      // fetch invocation may not enumerate the hibernated sockets, so the WS
      // is the reliable path.)
      const socket = liveWsRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(m));
        return;
      }
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

  // Stable return object: the consumer's callbacks depend on `session`, and a
  // fresh object every render would re-create those callbacks (and re-run the
  // effects that depend on them) on every zones/triggers change. Memoize on
  // the values that actually change.
  return useMemo(
    () => ({ zones, triggers, remoteTriggers, placeZone, clearZone, nameZone, triggerZone, localTrigger, zoneName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zones, triggers, remoteTriggers, placeZone, clearZone, nameZone, triggerZone, localTrigger],
  );
}