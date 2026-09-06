// ═══════════════════════════════════════════════════════
// @p31/shared — Genesis: telemetry store (Rev B — PATCHES 1+3)
//
// PATCH 1: IndexedDB backstop via idb-keyval.
// PATCH 3: 30s incremental flush + visibilitychange/freeze
//          handlers for Android process-kill survival.
//
// The chain:
//   eventBus → addEvent() → in-memory buffer
//              ↓ every 30s (or visibilitychange/freeze)
//           POST /telemetry (incremental)
//              ↓ IDB backstop (parallel with every flush)
//           p31-session-backstop
//              ↓ on new session init
//           POST /telemetry/orphan (orphan recovery)
//
// Promoted from bonding/src/genesis/telemetryStore.ts (WCD-M02).
// ═══════════════════════════════════════════════════════

import { get as idbGet, set as idbSet } from 'idb-keyval';

// ── Types ──

export interface TelemetryEvent {
  seq: number;
  type: string;
  payload: Record<string, unknown>;
  ts: number;
  hash: string; // SHA-256 of (prevHash + canonicalJson(event without hash))
}

interface SessionBackstop {
  sessionId: string;
  playerId: string;
  roomCode: string | null;
  startedAt: number;
  flushedSeq: number;
  events: TelemetryEvent[];
  lastHash: string;
  sealed: boolean;
}

// ── Constants ──

const IDB_KEY_BACKSTOP = 'p31-session-backstop';
const IDB_KEY_LAST_HASH = 'p31-last-session-hash';
const FLUSH_INTERVAL_MS = 30_000;

// ── Module-level state ──
// (Not Zustand — telemetry is a pure service, not reactive UI state)

let sessionId: string | null = null;
let playerId = '';
let roomCode: string | null = null;
let events: TelemetryEvent[] = [];
let lastHash = '';
let flushedSeq = 0;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let relayUrl = '';

// ── SHA-256 ──

async function sha256(data: string): Promise<string> {
  if (typeof crypto === 'undefined' || !crypto.subtle) return '';
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Core operations ──

export async function telemetryAddEvent(
  type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!sessionId) return;

  const seq = events.length;
  const ts = Date.now();
  const canonical = JSON.stringify({ seq, type, payload, ts });
  const hash = await sha256(lastHash + canonical);

  const event: TelemetryEvent = { seq, type, payload, ts, hash };
  events = [...events, event];
  lastHash = hash;
}

async function writeBackstop(): Promise<void> {
  if (!sessionId) return;
  const backstop: SessionBackstop = {
    sessionId,
    playerId,
    roomCode,
    startedAt: events[0]?.ts ?? Date.now(),
    flushedSeq,
    events,
    lastHash,
    sealed: false,
  };
  try {
    await idbSet(IDB_KEY_BACKSTOP, backstop);
  } catch {
    // IDB write failure — degraded gracefully
  }
}

async function flushToServer(): Promise<void> {
  if (!sessionId || !relayUrl) {
    await writeBackstop();
    return;
  }

  const unflushed = events.slice(flushedSeq);
  if (unflushed.length === 0) return;

  try {
    const res = await fetch(`${relayUrl}/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, playerId, roomCode, events: unflushed }),
      keepalive: true,
    });
    if (res.ok) {
      flushedSeq = events.length;
    }
  } catch {
    // Network failure — IDB backstop ensures no data loss
  }

  await writeBackstop();
}

export async function telemetrySeal(): Promise<void> {
  if (!sessionId || !relayUrl) return;

  // Final flush first
  await flushToServer();

  try {
    const res = await fetch(`${relayUrl}/telemetry/seal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, playerId, roomCode, entries: events, clientHash: lastHash }),
      keepalive: true,
    });
    if (res.ok) {
      // Mark backstop as sealed so orphan recovery skips it
      const backstop = await idbGet<SessionBackstop>(IDB_KEY_BACKSTOP);
      if (backstop?.sessionId === sessionId) {
        await idbSet(IDB_KEY_BACKSTOP, { ...backstop, sealed: true });
      }
      await idbSet(IDB_KEY_LAST_HASH, lastHash);
    }
  } catch {
    // Seal failure — orphan recovery will pick this up next session
  }
}

// ── Orphan recovery ──

export async function telemetryRecoverOrphans(): Promise<void> {
  if (!relayUrl) return;
  try {
    const backstop = await idbGet<SessionBackstop>(IDB_KEY_BACKSTOP);
    if (!backstop || backstop.sealed) return;

    // Orphaned session — POST to orphan recovery endpoint
    await fetch(`${relayUrl}/telemetry/orphan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orphanSessionId: backstop.sessionId,
        playerId: backstop.playerId,
        roomCode: backstop.roomCode,
        events: backstop.events,
        clientHash: backstop.lastHash,
      }),
    });

    // Mark as sealed whether or not server replied
    await idbSet(IDB_KEY_BACKSTOP, { ...backstop, sealed: true });
  } catch {
    // Orphan recovery is best-effort
  }
}

// ── Init / cleanup ──

export interface TelemetryConfig {
  sessionId: string;
  playerId: string;
  playerName: string;
  roomCode: string | null;
  relayUrl: string;
}

export function telemetryInit(config: TelemetryConfig): void {
  sessionId = config.sessionId;
  playerId = config.playerId;
  roomCode = config.roomCode;
  relayUrl = config.relayUrl;
  events = [];
  lastHash = '';
  flushedSeq = 0;

  // 30s incremental flush timer (PATCH 3)
  flushTimer = setInterval(() => {
    void flushToServer();
  }, FLUSH_INTERVAL_MS);
}

export function telemetryAttachLifecycleHandlers(): () => void {
  // PATCH 3: flush + backstop on Android process-kill signals
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // sendBeacon for network flush (best-effort, PATCH 3 note: 5-15% drop)
      if (sessionId && relayUrl && events.length > flushedSeq) {
        const unflushed = events.slice(flushedSeq);
        const body = JSON.stringify({ sessionId, playerId, roomCode, events: unflushed });
        navigator.sendBeacon(`${relayUrl}/telemetry`, new Blob([body], { type: 'application/json' }));
        flushedSeq = events.length;
      }
      // IDB backstop regardless
      void writeBackstop();
    }
  };

  const onFreeze = () => {
    void writeBackstop();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  document.addEventListener('freeze', onFreeze);

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    document.removeEventListener('freeze', onFreeze);
  };
}

export function telemetryCleanup(): void {
  if (flushTimer !== null) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
  void telemetrySeal();
  sessionId = null;
}

// ── Read-only access for TelemetryModal ──

export function telemetryGetBuffer(): TelemetryEvent[] {
  return events;
}

export function telemetryGetSessionId(): string | null {
  return sessionId;
}
