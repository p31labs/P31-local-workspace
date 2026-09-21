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
import { codename } from '@p31/canon/loom/codename';
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
  | { ok: false; reason: 'gate' | 'timeout' | 'network' | 'infra' };

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

/** The family member who committed an event — the pickle code name, derived
 *  from the event's statedBy (already a code name) or humanId (derived via the
 *  canon's deterministic code-name function). Never a raw DID. */
function authorOf(e: LoomEvent): string | undefined {
  const statedBy = (e as LoomEvent & { statedBy?: string }).statedBy;
  if (statedBy && statedBy.trim()) return statedBy;
  const humanId = (e as LoomEvent & { humanId?: string }).humanId;
  if (humanId && humanId.trim()) return codename(humanId);
  return undefined;
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
      author: authorOf(e),
    }));
}

/** Pure: fold ONE committed event into the zone list (place → add, clear →
 *  remove, name → rename). Both the live-stream `committed` branch and the
 *  `commitAck` branch use this — the sender's own commit must land locally too
 *  (the DO broadcasts to OTHER sockets, excluding the sender; the sender only
 *  gets the commit-ack). One code path, both branches. */
export function applyEventToZones(zones: MusicZone[], e: LoomEvent): MusicZone[] {
  if (e.kind === 'instrument.zone.place') {
    if (zoneById(zones, e.node)) return zones;
    return [
      ...zones,
      {
        id: e.node,
        position: (e as LoomEvent & { position: [number, number, number] }).position,
        timbre: (e as LoomEvent & { timbre: Timbre }).timbre,
        name: (e as LoomEvent & { name?: string }).name ?? '',
        author: authorOf(e),
      },
    ];
  }
  if (e.kind === 'instrument.zone.clear') return zones.filter((z) => z.id !== e.node);
  if (e.kind === 'instrument.zone.name') {
    return zones.map((z) => (z.id === e.node ? { ...z, name: (e as LoomEvent & { name: string }).name } : z));
  }
  return zones;
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
  | { kind: 'commitAck'; requestId: string; valid: boolean; error?: string; event?: LoomEvent }
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
        event: parsed.event as LoomEvent | undefined,
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
        // FOLD the initial load onto the current list (dedup by id) so a fast
        // commit-ack that landed before this fetch resolves is not wiped.
        setZones((prev) => es.reduce(applyEventToZones, prev));
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
          // The sender's own commit must land locally. The DO echoes the
          // committed event in the ack but broadcasts it only to OTHER sockets
          // (the sender is excluded). Without folding it here, the placing
          // client's zone list never updates — "place a zone does nothing."
          if (frame.valid && frame.event) {
            setZones((prev) => applyEventToZones(prev, frame.event!));
          }
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
      setZones((prev) => applyEventToZones(prev, e));
    };

    // ── Transport: WS-first, SSE fallback. Explicit 4-state machine.
    //    The production transport is the WebSocket (worker/ Durable Object);
    //    the dev middleware serves SSE.
    //
    //    STATES (one-way degradation):
    //      connecting        → WS attempt in progress (or SSE if forced)
    //      ws-connected      → WebSocket live (the production transport)
    //      sse-degraded      → SSE live; DEGRADED and stays degraded for the
    //                          session. A WS drop is NOT retried mid-session —
    //                          a WS-blocked network must not oscillate
    //                          WS→SSE→WS→SSE forever at the backoff rate (the
    //                          historical bug). The next page load tries WS
    //                          again.
    //      offline           → both transports failed; backoff, then re-try
    //                          the LAST-DEGRADED transport (never flip back to
    //                          WS once degraded).
    //
    //    BACKOFF: exponential 500ms → 30s, capped, with 0-500ms jitter, on a
    //    SHARED counter so N clients never reconnect in lockstep (thundering
    //    herd). Reset on a successful open.
    //    KEEPALIVE: while ws-connected, send a 'ping' every ~4 minutes — the
    //    Cloudflare edge answers protocol-level pings WITHOUT waking the DO
    //    (Hibernation), keeping the socket past the 100s idle timeout at zero
    //    wake cost. A DO-side setInterval would defeat hibernation.
    let transport: 'connecting' | 'ws-connected' | 'sse-degraded' | 'offline' =
      new URLSearchParams(location.search).get('transport') === 'sse'
        ? 'sse-degraded'
        : 'connecting';
    let keepalive: ReturnType<typeof setInterval> | null = null;

    const schedule = (fn: () => void) => {
      const base = Math.min(500 * 2 ** attempts, 30_000);
      const jitter = Math.floor(Math.random() * 500);
      attempts += 1;
      timer = setTimeout(fn, base + jitter);
    };

    const stopKeepalive = () => {
      if (keepalive) { clearInterval(keepalive); keepalive = null; }
    };

    const connectWebSocket = () => {
      if (!alive) return;
      transport = 'connecting';
      const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${proto}//${location.host}/api/music/stream${location.search}`;
      const socket = new WebSocket(wsUrl);
      ws = socket;
      liveWsRef.current = socket;
      socket.onopen = () => {
        attempts = 0;
        transport = 'ws-connected';
        stopKeepalive();
        // Client keepalive: the edge answers without waking the DO.
        keepalive = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send('ping');
        }, 240_000);
        // B1: reconcile missed committed events on (re)connect. The DO's
        // committed-resume frame only hints at the tail seq; the client
        // re-fetches /events and FOLDS the committed events onto the current
        // zone list (applyEventToZones dedups place events by id). Replacing
        // outright would race a fast commit-ack: a zone placed between open
        // and this fetch resolving would be wiped. Folding preserves both.
        void fetch('/api/music/events')
          .then((r) => (r.ok ? (r.json() as Promise<LoomEvent[]>) : null))
          .then((es) => {
            if (es && alive) setZones((prev) => es.reduce(applyEventToZones, prev));
          })
          .catch(() => {});
      };
      socket.onmessage = (ev) => handleFrame(String(ev.data));
      socket.onclose = () => {
        ws = null;
        if (liveWsRef.current === socket) liveWsRef.current = null;
        stopKeepalive();
        if (!alive) return;
        if (transport !== 'sse-degraded') {
          // WS drop → degrade to SSE, and STAY degraded for the session.
          transport = 'sse-degraded';
          schedule(connectEventSource);
        } else {
          transport = 'offline';
          schedule(connectEventSource);
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
        // Degraded, and stays degraded — never flips back to WS mid-session.
        transport = 'sse-degraded';
      };
      es.onmessage = (msg) => handleFrame(String((msg as MessageEvent).data));
      es.onerror = () => {
        es.close();
        src = null;
        if (!alive) return;
        transport = 'offline';
        // Re-try the DEGRADED transport (SSE) — one-way, no WS flip-back.
        schedule(connectEventSource);
      };
    };

    // Always start WS-first (unless forced to SSE); the fallback handles the
    // dev Vite middleware, which serves SSE instead of upgrading.
    if (transport === 'sse-degraded') connectEventSource();
    else connectWebSocket();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      stopKeepalive();
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
      // A 5xx or an unparseable body means the SERVICE is down (D1 write
      // failing) — that's 'infra', distinct from 'gate' (the canon refused)
      // and 'network' (we couldn't reach it at all).
      if (!res.ok) return { ok: false, reason: 'infra' };
      let r: { valid: boolean; error?: string };
      try {
        r = (await res.json()) as { valid: boolean; error?: string };
      } catch {
        return { ok: false, reason: 'infra' };
      }
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