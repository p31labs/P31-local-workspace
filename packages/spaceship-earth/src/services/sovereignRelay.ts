/**
 * @file sovereignRelay — WebSocket connection manager for the P31 sovereign relay.
 *
 * Relay URL: `import.meta.env.VITE_RELAY_URL` (CF Worker).
 * Graceful no-op when VITE_RELAY_URL is absent (dev without relay).
 *
 * Protocol (JSON over WebSocket):
 *   Client → Server:
 *     { type: 'hello',  did: string, room: string | null, ts: number }
 *     { type: 'ping',   ts: number }
 *     { type: 'action', did: string, payload: unknown, ts: number }
 *   Server → Client:
 *     { type: 'pong',   ts: number }          — echoes client ts for RTT
 *     { type: 'peers',  peers: RelayPeer[] }
 *     { type: 'action', did: string, payload: unknown, ts: number }
 *
 * Reconnect strategy: exponential backoff 1 → 2 → 4 → 8 → 16 → 30s cap.
 * Heartbeat: ping every 15 s. RTT measured by comparing sent ts vs pong ts.
 * Offline queue: actions sent while disconnected are persisted to IndexedDB
 *   via offlineQueue.ts and replayed in order on next connect.
 *
 * Store integration: updates useSovereignStore slices via setRelayStatus,
 *   setRelayPing, setRelayPeers, setOfflineQueueSize. Import is dynamic to
 *   avoid circular dep (store imports nothing from services).
 */

import { enqueue, drainQueue, queueSize } from './offlineQueue';
import type { RelayPeer, CelebrationEvent } from '../sovereign/types';

// ── Config ────────────────────────────────────────────────────────────────
const RELAY_URL        = import.meta.env.VITE_RELAY_URL as string | undefined;
const HEARTBEAT_MS     = 15_000;
const MAX_BACKOFF_MS   = 30_000;
const BACKOFF_INITIAL  = 1_000;

// ── Internal state ────────────────────────────────────────────────────────
let _ws:               WebSocket | null = null;
let _reconnectTimer:   ReturnType<typeof setTimeout> | null = null;
let _heartbeatTimer:   ReturnType<typeof setInterval> | null = null;
let _presenceTimer:    ReturnType<typeof setInterval> | null = null;
let _backoffMs         = BACKOFF_INITIAL;
let _pingTs            = 0;
let _intentionalClose  = false;
let _did: string | null = null;
let _room: string | null = null;

// ── Store accessor (lazy import avoids circular dep) ──────────────────────
async function getStore() {
  const { useSovereignStore } = await import('../sovereign/useSovereignStore');
  return useSovereignStore.getState();
}

// ── Internal helpers ──────────────────────────────────────────────────────

function clearTimers() {
  if (_heartbeatTimer !== null) { clearInterval(_heartbeatTimer); _heartbeatTimer = null; }
  if (_presenceTimer  !== null) { clearInterval(_presenceTimer);  _presenceTimer  = null; }
  if (_reconnectTimer !== null) { clearTimeout(_reconnectTimer);  _reconnectTimer = null; }
}

function sendPresence() {
  if (_ws?.readyState !== WebSocket.OPEN) return;
  _ws.send(JSON.stringify({ type: 'presence', did: _did ?? 'ANONYMOUS', room: _room, ts: Date.now() }));
}

function scheduleReconnect() {
  if (_intentionalClose) return;
  _reconnectTimer = setTimeout(() => {
    connect(_did, _room);
  }, _backoffMs);
  // Double backoff with cap
  _backoffMs = Math.min(_backoffMs * 2, MAX_BACKOFF_MS);
}

function sendPing() {
  if (_ws?.readyState !== WebSocket.OPEN) return;
  _pingTs = Date.now();
  _ws.send(JSON.stringify({ type: 'ping', ts: _pingTs }));
}

async function onOpen() {
  _backoffMs = BACKOFF_INITIAL; // reset backoff on successful connect
  const store = await getStore();
  store.setRelayStatus('connected');

  // Announce presence
  if (_ws?.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify({ type: 'hello', did: _did ?? 'ANONYMOUS', room: _room, ts: Date.now() }));
  }

  // Replay offline queue
  const pending = await drainQueue();
  for (const { action } of pending) {
    if (_ws?.readyState === WebSocket.OPEN) {
      _ws.send(JSON.stringify({ type: 'action', did: _did ?? 'ANONYMOUS', payload: action.payload, ts: Date.now() }));
    }
  }
  const remaining = await queueSize();
  store.setOfflineQueueSize(remaining);

  // Start heartbeat
  _heartbeatTimer = setInterval(sendPing, HEARTBEAT_MS);

  // Broadcast presence immediately, then every 5 s
  sendPresence();
  _presenceTimer = setInterval(sendPresence, 5_000);
}

async function onMessage(event: MessageEvent) {
  let msg: { type: string; ts?: number; peers?: RelayPeer[]; payload?: unknown; did?: string; room?: string | null; event?: string };
  try {
    msg = JSON.parse(event.data as string) as typeof msg;
  } catch {
    return;
  }

  const store = await getStore();

  switch (msg.type) {
    case 'pong': {
      if (_pingTs > 0 && msg.ts !== undefined) {
        const rtt = Date.now() - _pingTs;
        store.setRelayPing(rtt);
        _pingTs = 0;
      }
      break;
    }
    case 'peers': {
      if (Array.isArray(msg.peers)) {
        store.setRelayPeers(msg.peers);
      }
      break;
    }
    case 'presence': {
      if (typeof msg.did === 'string') {
        store.upsertRemotePeer(msg.did, msg.room ?? null, msg.ts ?? Date.now());
      }
      break;
    }
    case 'celebration': {
      // Room-isolated: only trigger flash when peer is in the same room
      if (msg.room === _room) {
        store.triggerCelebration();
      }
      break;
    }
    // 'action' messages from peers — extensible hook for future sovereign sync
    default:
      break;
  }
}

async function onClose() {
  clearTimers();
  const store = await getStore();
  store.setRelayStatus(_intentionalClose ? 'disconnected' : 'error');
  store.setRelayPeers([]);
  store.setRelayPing(0);

  if (!_intentionalClose) {
    store.setRelayStatus('connecting');
    scheduleReconnect();
  }
}

async function onError() {
  const store = await getStore();
  store.setRelayStatus('error');
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Open the relay connection.
 * `did` and `room` are sent in the hello frame so peers can identify this client.
 * Safe to call multiple times — existing connection is closed cleanly first.
 */
export function connect(did: string | null, room: string | null): void {
  if (!RELAY_URL) return; // no-op in dev without relay

  _did  = did;
  _room = room;
  _intentionalClose = false;

  // Close existing socket before reopening
  if (_ws) {
    _ws.onclose = null; // prevent onClose from scheduling reconnect
    _ws.close();
  }
  clearTimers();

  getStore().then(s => s.setRelayStatus('connecting')).catch(() => {});

  try {
    _ws = new WebSocket(RELAY_URL);
    _ws.onopen    = onOpen;
    _ws.onmessage = onMessage;
    _ws.onclose   = onClose;
    _ws.onerror   = onError;
  } catch {
    scheduleReconnect();
  }
}

/** Close the connection intentionally (no reconnect). */
export function disconnect(): void {
  _intentionalClose = true;
  clearTimers();
  if (_ws) {
    _ws.close();
    _ws = null;
  }
  getStore().then(s => {
    s.setRelayStatus('disconnected');
    s.setRelayPeers([]);
    s.setRelayPing(0);
  }).catch(() => {});
}

/**
 * Send an action to the relay. If disconnected, the action is queued in
 * IndexedDB and will be replayed on reconnect.
 */
export async function sendAction(type: string, payload: unknown): Promise<void> {
  if (_ws?.readyState === WebSocket.OPEN) {
    _ws.send(JSON.stringify({ type: 'action', did: _did ?? 'ANONYMOUS', payload, ts: Date.now() }));
  } else {
    await enqueue({ type, payload, ts: Date.now() });
    const n = await queueSize();
    const store = await getStore();
    store.setOfflineQueueSize(n);
  }
}

/** Update the room identifier (sent on next hello / reconnect). */
export function setRoom(room: string | null): void {
  _room = room;
}

/** Return whether the relay is configured (VITE_RELAY_URL is set). */
export function isRelayConfigured(): boolean {
  return !!RELAY_URL;
}

/**
 * Broadcast a celebration event to peers in the same room.
 * No-op when disconnected or relay not configured.
 */
export function sendCelebration(event: CelebrationEvent): void {
  if (_ws?.readyState !== WebSocket.OPEN) return;
  _ws.send(JSON.stringify({ type: 'celebration', did: _did ?? 'ANONYMOUS', room: _room, event, ts: Date.now() }));
}
