/**
 * useCrossAppState — unified cross-app state sync (Tier 1–4).
 *
 * Tier 1  BroadcastChannel — same browser, instant.
 * Tier 2  localStorage     — same device, persistent.
 * Tier 3  WebSocket        — cross-device, primary (Durable Object on p31-shell).
 * Tier 4  HTTP polling     — degraded fallback only if WebSocket is unavailable.
 *
 * createCrossAppState() is a singleton factory: repeated calls return the same
 * instance, so every component shares one connection + state.
 */

export type SensoryState = {
  muted: boolean;
  calm: boolean;
  warmLight: boolean;
  font: string;
  textScale: string;
};

export type CrossAppState = {
  spoons: number;
  sensory: SensoryState;
  dataset?: string;
  source?: string;
  timestamp?: number;
};

export type SyncStatus = 'offline' | 'connecting' | 'websocket' | 'polling';

const CHANNEL_NAME = 'p31-cross-app-state';
const STORAGE_KEY = 'p31-cross-app-state';

const WS_URL = (import.meta.env.VITE_CROSS_APP_WS as string | undefined)
  ?? 'wss://p31-shell.trimtab-signal.workers.dev/ws/state';
const HTTP_BASE = 'https://p31-shell.trimtab-signal.workers.dev';

const DEFAULT_SENSORY: SensoryState = { muted: false, calm: false, warmLight: false, font: 'standard', textScale: 'standard' };

function defaultState(spoons: number): CrossAppState {
  return { spoons, sensory: { ...DEFAULT_SENSORY } };
}

function readStoredState(): CrossAppState | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeStoredState(state: CrossAppState): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

export type CrossAppSync = {
  readonly state: CrossAppState;
  readonly status: SyncStatus;
  setSpoons: (s: number) => void;
  setSensory: (s: Partial<SensoryState>) => void;
  setDataset: (d: string) => void;
  setSource: (s: string) => void;
  broadcast: () => void;
  startPolling: () => void;
  stopPolling: () => void;
  clearRemote: () => Promise<void>;
  dispose: () => void;
};

function createCrossAppSync(defaultSpoons = 4): CrossAppSync {
  const state: CrossAppState = readStoredState() ?? defaultState(defaultSpoons);

  let channel: BroadcastChannel | null = null;
  let ws: WebSocket | null = null;
  let reconnectAttempt = 0;
  let reconnectTimer: number | null = null;
  let heartbeatTimer: number | null = null;
  let pollTimer: number | null = null;
  let consecutiveFailures = 0;
  let disposed = false;
  let status: SyncStatus = typeof WebSocket === 'undefined' ? 'polling' : 'connecting';

  // ── Tier 1: BroadcastChannel (same browser) ──
  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener('message', (ev: MessageEvent<CrossAppState>) => {
      if (ev.data && typeof ev.data.timestamp === 'number') {
        if (ev.data.timestamp >= (state.timestamp ?? 0)) {
          Object.assign(state, ev.data);
          writeStoredState(state);
        }
      }
    });
  }

  // ── Tier 4: HTTP polling fallback (read-only) ──
  const pollOnce = async () => {
    try {
      const res = await fetch(`${HTTP_BASE}/api/shell-state`);
      if (!res.ok) return;
      const json = await res.json();
      const remote = json?.state as CrossAppState | undefined;
      if (remote && (remote.timestamp ?? 0) >= (state.timestamp ?? 0)) {
        Object.assign(state, remote);
        writeStoredState(state);
      }
    } catch { /* keep last known state */ }
  };

  const startPolling = () => {
    if (pollTimer) return;
    void pollOnce();
    pollTimer = window.setInterval(() => void pollOnce(), 30000);
  };

  const stopPolling = () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  };

  // ── Tier 3: WebSocket (primary, cross-device) ──
  const scheduleReconnect = () => {
    if (disposed) return;
    if (reconnectTimer) return;
    const attempt = reconnectAttempt;
    const base = Math.min(1000 * 2 ** attempt, 30000);
    const jitter = base * (0.7 + Math.random() * 0.6);
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, jitter);
  };

  const handleMessage = (raw: string) => {
    let parsed: { type?: string; state?: CrossAppState; timestamp?: number };
    try { parsed = JSON.parse(raw); } catch { return; }
    if (parsed.type === 'pong') return;
    if (parsed.type === 'state' && parsed.state) {
      const remote = parsed.state;
      const remoteTs = remote.timestamp ?? 0;
      if (remoteTs >= (state.timestamp ?? 0)) {
        Object.assign(state, remote);
        writeStoredState(state);
        try { channel?.postMessage(state); } catch { /* ignore */ }
      } else {
        // Local state is newer — push it so the server converges.
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'state', state }));
        }
      }
    }
  };

  const connect = () => {
    if (disposed || ws) return;
    status = 'connecting';
    let closed = false;
    try {
      ws = new WebSocket(WS_URL);
    } catch {
      ws = null;
      return;
    }

    ws.addEventListener('open', () => {
      consecutiveFailures = 0;
      reconnectAttempt = 0;
      status = 'websocket';
      stopPolling();
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'state', state }));
      }
      heartbeatTimer = window.setInterval(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    });

    ws.addEventListener('message', (ev: MessageEvent<string>) => handleMessage(ev.data));

    const teardown = () => {
      if (closed) return;
      closed = true;
      ws = null;
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      consecutiveFailures += 1;
      status = 'offline';
      if (consecutiveFailures >= 3) {
        status = 'polling';
        startPolling();
      }
      if (!disposed) {
        reconnectAttempt = Math.min(reconnectAttempt + 1, 5);
        scheduleReconnect();
      }
    };

    ws.addEventListener('close', teardown);
    ws.addEventListener('error', teardown);
  };

  // ── Public API ──
  const broadcast = () => {
    state.timestamp = Date.now();
    writeStoredState(state);
    try { channel?.postMessage(state); } catch { /* ignore */ }
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'state', state }));
    }
  };

  if (typeof WebSocket !== 'undefined' && typeof window !== 'undefined') {
    connect();
  }

  return {
    get state() { return state; },
    get status() { return status; },
    setSpoons: (s: number) => { state.spoons = Math.max(0, Math.min(5, s)); broadcast(); },
    setSensory: (s: Partial<SensoryState>) => { state.sensory = { ...state.sensory, ...s }; broadcast(); },
    setDataset: (d: string) => { state.dataset = d; broadcast(); },
    setSource: (s: string) => { state.source = s; broadcast(); },
    broadcast,
    startPolling,
    stopPolling,
    clearRemote: async () => {
      try { await fetch(`${HTTP_BASE}/api/state`, { method: 'DELETE' }); } catch { /* best effort */ }
      const next = defaultState(4);
      Object.keys(state).forEach((k) => delete (state as Record<string, unknown>)[k]);
      Object.assign(state, next);
      state.timestamp = Date.now();
      writeStoredState(state);
      try { channel?.postMessage(state); } catch { /* ignore */ }
    },
    dispose: () => {
      disposed = true;
      if (ws) { try { ws.close(); } catch { /* ignore */ } ws = null; }
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
      stopPolling();
      try { channel?.close(); } catch { /* ignore */ }
      channel = null;
    },
  };
}

let singleton: CrossAppSync | null = null;

export function createCrossAppState(defaultSpoons = 4): CrossAppSync {
  if (!singleton) singleton = createCrossAppSync(defaultSpoons);
  return singleton;
}