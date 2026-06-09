// ═══════════════════════════════════════════════════════
// BONDING — P31 Labs
// Game sync: multiplayer relay client
//
// Pure TypeScript. No React. No Zustand.
// Supports two backends:
//   1. Real relay (Cloudflare Worker) when VITE_RELAY_URL is set
//   2. localStorage mock when no URL configured
//
// The game NEVER blocks on network. Local play is sacred.
// ═══════════════════════════════════════════════════════

import { fetchWithTimeout } from '@p31/shared/net';

// ── Relay types (WCD-07 contract) ──

export interface PlayerState {
  formula: string;
  displayFormula: string;
  atoms: number;
  love: number;
  stability: number;
  completed: boolean;
  achievements: string[];
  breathing?: boolean;
  updatedAt: string;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  mode: string;
  joinedAt: string;
  state: PlayerState;
}

export interface Ping {
  id: string;
  from: string;
  to: string;
  reaction: string;
  message?: string;
  timestamp: string;
}

export interface Room {
  code: string;
  players: Player[];
  pings: Ping[];
  createdAt: string;
  updatedAt: string;
  status: 'waiting' | 'active' | 'complete';
}

export type SyncEvent =
  | { type: 'roomUpdated'; room: Room }
  | { type: 'playerJoined'; player: Player }
  | { type: 'pingReceived'; ping: Ping }
  | { type: 'reconnecting' }
  | { type: 'disconnected' }
  | { type: 'reconnected' }
  | { type: 'roomExpired' };

// ── Module state ──

const RELAY_URL: string =
  (typeof import.meta !== 'undefined'
    ? (import.meta as unknown as { env?: Record<string, string> }).env
        ?.VITE_RELAY_URL ?? ''
    : '');

let currentRoom: Room | null = null;
let myPlayerId: string | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let consecutiveFailures = 0;
let pollIntervalMs = 5000;
let pollCallback: ((room: Room) => void) | null = null;
let visibilityHandler: (() => void) | null = null;

// Debounce state
let pushDirty = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: PlayerState | null = null;

// Event listeners
const eventListeners: Set<(event: SyncEvent) => void> = new Set();

// localStorage listener for mock relay cross-tab sync
let storageHandler: ((e: StorageEvent) => void) | null = null;

// ── Validation ──

const ROOM_CODE_RE = /^[A-Z0-9]{4,6}$/;

function validateRoomCode(code: string): string {
  const upper = code.toUpperCase();
  if (!ROOM_CODE_RE.test(upper)) {
    throw new Error('Invalid room code');
  }
  return upper;
}

// ── Helpers ──

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function storageKey(code: string): string {
  return `bonding_room_${code}`;
}

function emitEvent(event: SyncEvent): void {
  for (const handler of eventListeners) {
    try {
      handler(event);
    } catch {
      // Listener errors should not break the sync loop
    }
  }
}

function emptyPlayerState(): PlayerState {
  return {
    formula: '',
    displayFormula: '',
    atoms: 0,
    love: 0,
    stability: 0,
    completed: false,
    achievements: [],
    updatedAt: new Date().toISOString(),
  };
}

// ── Mock relay (localStorage) ──

function mockReadRoom(code: string): Room | null {
  const raw = localStorage.getItem(storageKey(code));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Room;
  } catch {
    return null;
  }
}

function mockWriteRoom(room: Room): void {
  localStorage.setItem(storageKey(room.code), JSON.stringify(room));
}

async function mockCreateRoom(
  playerName: string,
  playerColor: string,
  mode: string,
): Promise<{ code: string; room: Room; playerId: string }> {
  const code = generateCode();
  const playerId = 'p_0';
  const now = new Date().toISOString();
  const room: Room = {
    code,
    players: [
      {
        id: playerId,
        name: playerName,
        color: playerColor,
        mode,
        joinedAt: now,
        state: emptyPlayerState(),
      },
    ],
    pings: [],
    createdAt: now,
    updatedAt: now,
    status: 'waiting',
  };
  mockWriteRoom(room);
  return { code, room, playerId };
}

async function mockJoinRoom(
  code: string,
  playerName: string,
  playerColor: string,
  mode: string,
): Promise<{ room: Room; playerId: string }> {
  const room = mockReadRoom(code.toUpperCase());
  if (!room) throw new Error('Room not found');
  const playerId = `p_${room.players.length}`;
  const now = new Date().toISOString();
  room.players.push({
    id: playerId,
    name: playerName,
    color: playerColor,
    mode,
    joinedAt: now,
    state: emptyPlayerState(),
  });
  room.status = 'active';
  room.updatedAt = now;
  mockWriteRoom(room);
  return { room, playerId };
}

async function mockPushState(state: PlayerState): Promise<void> {
  if (!currentRoom || !myPlayerId) return;
  const room = mockReadRoom(currentRoom.code);
  if (!room) return;
  const player = room.players.find((p) => p.id === myPlayerId);
  if (player) {
    player.state = state;
    room.updatedAt = new Date().toISOString();
    mockWriteRoom(room);
  }
}

async function mockSendPing(to: string, reaction: string, message?: string): Promise<void> {
  if (!currentRoom || !myPlayerId) return;
  const room = mockReadRoom(currentRoom.code);
  if (!room) return;
  room.pings.push({
    id: generateId(),
    from: myPlayerId,
    to,
    reaction,
    message,
    timestamp: new Date().toISOString(),
  });
  room.updatedAt = new Date().toISOString();
  mockWriteRoom(room);
}

function mockPoll(): Room | null {
  if (!currentRoom) return null;
  return mockReadRoom(currentRoom.code);
}

// ── Real relay (fetch) ──

const RELAY_TIMEOUT_MS = 10_000;

function relayFetch(url: string, init?: RequestInit): Promise<Response> {
  return fetchWithTimeout(url, init, RELAY_TIMEOUT_MS);
}

async function relayCreateRoom(
  playerName: string,
  playerColor: string,
  mode: string,
): Promise<{ code: string; room: Room; playerId: string }> {
  const res = await relayFetch(`${RELAY_URL}/api/room`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, playerColor, mode }),
  });
  if (!res.ok) throw new Error('Could not create room');
  const data = (await res.json()) as { code: string; room: Room };
  // Creator is always p_0
  return { code: data.code, room: data.room, playerId: 'p_0' };
}

async function relayJoinRoom(
  code: string,
  playerName: string,
  playerColor: string,
  mode: string,
): Promise<{ room: Room; playerId: string }> {
  const validCode = validateRoomCode(code);
  const res = await relayFetch(`${RELAY_URL}/api/room/${validCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, playerColor, mode }),
  });
  if (res.status === 409) throw new Error('Room is full. Try a different code.');
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? 'Join failed');
  }
  const data = (await res.json()) as { room: Room };
  // Joiner gets the last player slot
  const lastPlayer = data.room.players[data.room.players.length - 1];
  const playerId = lastPlayer?.id ?? `p_${data.room.players.length - 1}`;
  return { room: data.room, playerId };
}

async function relayFetchRoom(code: string): Promise<Room> {
  const validCode = validateRoomCode(code);
  const res = await relayFetch(`${RELAY_URL}/api/room/${validCode}`);
  if (res.status === 404) throw new Error('ROOM_EXPIRED');
  if (!res.ok) throw new Error('Room not found');
  const data = (await res.json()) as { room: Room };
  return data.room;
}

async function relayPushState(state: PlayerState): Promise<void> {
  if (!currentRoom || !myPlayerId) return;
  const validCode = validateRoomCode(currentRoom.code);
  const res = await relayFetch(`${RELAY_URL}/api/room/${validCode}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerId: myPlayerId, ...state }),
  });
  if (!res.ok) throw new Error('Push failed');
}

async function relaySendPing(to: string, reaction: string, message?: string): Promise<void> {
  if (!currentRoom || !myPlayerId) return;
  const validCode = validateRoomCode(currentRoom.code);
  const res = await relayFetch(
    `${RELAY_URL}/api/room/${validCode}/ping`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: myPlayerId, to, reaction, message }),
    },
  );
  if (!res.ok) throw new Error('Ping failed');
}

// ── Backend dispatch ──

function isRelayConfigured(): boolean {
  return RELAY_URL.length > 0;
}

// ── Public API ──

export async function createRoom(
  playerName: string,
  playerColor: string,
  mode: string,
): Promise<{ code: string; room: Room; playerId: string }> {
  const result = isRelayConfigured()
    ? await relayCreateRoom(playerName, playerColor, mode)
    : await mockCreateRoom(playerName, playerColor, mode);
  currentRoom = result.room;
  myPlayerId = result.playerId;
  return result;
}

export async function joinRoom(
  code: string,
  playerName: string,
  playerColor: string,
  mode: string,
): Promise<{ room: Room; playerId: string }> {
  const result = isRelayConfigured()
    ? await relayJoinRoom(code, playerName, playerColor, mode)
    : await mockJoinRoom(code, playerName, playerColor, mode);
  currentRoom = result.room;
  myPlayerId = result.playerId;
  return result;
}

export function leaveRoom(): void {
  stopPolling();
  currentRoom = null;
  myPlayerId = null;
  pendingState = null;
  pushDirty = false;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

export async function pushState(state: PlayerState): Promise<void> {
  pendingState = state;

  // Flush immediately on completion or new achievement
  if (state.completed) {
    flushPush();
    return;
  }

  // Debounce: mark dirty, schedule flush
  if (!pushDirty) {
    pushDirty = true;
    pushTimer = setTimeout(() => {
      flushPush();
    }, 2000);
  }
}

function flushPush(): void {
  pushDirty = false;
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  if (!pendingState) return;
  const state = pendingState;
  pendingState = null;

  const doFlush = isRelayConfigured()
    ? () => relayPushState(state)
    : () => mockPushState(state);

  doFlush().catch(() => {
    // Network error — game continues locally. State will be pushed next cycle.
  });
}

export async function sendPing(to: string, reaction: string, message?: string): Promise<void> {
  try {
    if (isRelayConfigured()) {
      await relaySendPing(to, reaction, message);
    } else {
      await mockSendPing(to, reaction, message);
    }
  } catch {
    // Ping failed — not critical, game continues
  }
}

export function startPolling(
  onUpdate: (room: Room) => void,
  intervalMs = 5000,
): void {
  stopPolling();
  pollCallback = onUpdate;
  pollIntervalMs = intervalMs;
  consecutiveFailures = 0;

  const poll = async () => {
    try {
      let room: Room | null;
      if (isRelayConfigured()) {
        if (!currentRoom) return;
        room = await relayFetchRoom(currentRoom.code);
      } else {
        room = mockPoll();
      }

      if (room) {
        // Detect new players
        if (currentRoom) {
          const oldIds = new Set(currentRoom.players.map((p) => p.id));
          for (const p of room.players) {
            if (!oldIds.has(p.id)) {
              emitEvent({ type: 'playerJoined', player: p });
            }
          }
        }

        currentRoom = room;
        emitEvent({ type: 'roomUpdated', room });
        if (pollCallback) pollCallback(room);

        // Recover from disconnected state
        if (consecutiveFailures > 0) {
          emitEvent({ type: 'reconnected' });
        }
        consecutiveFailures = 0;
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'ROOM_EXPIRED') {
        emitEvent({ type: 'roomExpired' });
        return;
      }
      consecutiveFailures++;
      if (consecutiveFailures >= 3) {
        emitEvent({ type: 'disconnected' });
      } else {
        emitEvent({ type: 'reconnecting' });
      }
    }
  };

  // Initial poll
  void poll();

  // Schedule recurring polls
  const scheduleNext = () => {
    const backoffMs =
      consecutiveFailures > 0
        ? Math.min(pollIntervalMs * Math.pow(2, consecutiveFailures), 20000)
        : pollIntervalMs;
    pollTimer = setTimeout(() => {
      void poll().then(scheduleNext);
    }, backoffMs);
  };
  scheduleNext();

  // Pause/resume on visibility change
  visibilityHandler = () => {
    if (document.hidden) {
      if (pollTimer) {
        clearTimeout(pollTimer);
        pollTimer = null;
      }
    } else {
      // Resume immediately
      void poll().then(scheduleNext);
    }
  };
  document.addEventListener('visibilitychange', visibilityHandler);

  // For mock relay: listen to localStorage changes from other tabs
  if (!isRelayConfigured()) {
    storageHandler = (e: StorageEvent) => {
      if (!currentRoom) return;
      if (e.key === storageKey(currentRoom.code) && e.newValue) {
        try {
          const room = JSON.parse(e.newValue) as Room;
          currentRoom = room;
          emitEvent({ type: 'roomUpdated', room });
          if (pollCallback) pollCallback(room);
        } catch {
          // Ignore parse errors
        }
      }
    };
    window.addEventListener('storage', storageHandler);
  }
}

export function stopPolling(): void {
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  if (visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = null;
  }
  if (storageHandler) {
    window.removeEventListener('storage', storageHandler);
    storageHandler = null;
  }
  pollCallback = null;
}

// ── Getters ──

export function getCurrentRoom(): Room | null {
  return currentRoom;
}

export function getMyPlayerId(): string | null {
  return myPlayerId;
}

export function isConnected(): boolean {
  return currentRoom !== null && consecutiveFailures < 3;
}

export function getConnectionStatus(): 'connected' | 'reconnecting' | 'disconnected' {
  if (!currentRoom) return 'disconnected';
  if (consecutiveFailures >= 3) return 'disconnected';
  if (consecutiveFailures > 0) return 'reconnecting';
  return 'connected';
}

// ── Event system ──

export function onSyncEvent(
  handler: (event: SyncEvent) => void,
): () => void {
  eventListeners.add(handler);
  return () => eventListeners.delete(handler);
}

// ── Test helpers (not exported in production builds) ──

export function _resetForTest(): void {
  leaveRoom();
  eventListeners.clear();
  consecutiveFailures = 0;
}
