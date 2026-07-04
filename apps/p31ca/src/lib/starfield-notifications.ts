/**
 * starfield-notifications.ts — Smart notification system for the starfield background
 *
 * Features:
 * - WebSocket connection to mesh for real-time events
 * - Stars light up when notifications arrive (messages, alerts, system events)
 * - Fully customizable: colors, intensity, duration, sound
 * - Persistent across page navigations via the AppShell canvas
 *
 * Event types:
 * - 'message' → Private/direct message received
 * - 'alert' → System alert or warning
 * - 'mesh' → Mesh topology change (node join/leave)
 * - 'activity' → General activity (likes, mentions, etc.)
 */

import { alertStarfield, clearStarfieldAlert, snapshotStarfieldStats } from './starfield-singleton';

// ─── Configuration ───────────────────────────────────────────────────────────

export interface NotificationConfig {
  enabled: boolean;
  websocketUrl: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  starPulseDuration: number; // ms
  starPulseIntensity: number; // 0-1
  enableSound: boolean;
  soundVolume: number; // 0-1
  colors: {
    message: string; // hex
    alert: string;
    mesh: string;
    activity: string;
  };
  filters: {
    messages: boolean;
    alerts: boolean;
    meshEvents: boolean;
    activity: boolean;
  };
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  websocketUrl: 'wss://k4-cage.trimtab-signal.workers.dev/ws',
  reconnectInterval: 5000,
  maxReconnectAttempts: 10,
  starPulseDuration: 3000,
  starPulseIntensity: 0.8,
  enableSound: false,
  soundVolume: 0.3,
  colors: {
    message: '#3b82f6',   // blue
    alert: '#f43f5e',     // rose
    mesh: '#10b981',      // emerald
    activity: '#8b5cf6',  // violet
  },
  filters: {
    messages: true,
    alerts: true,
    meshEvents: true,
    activity: false,
  },
};

// ─── State ─────────────────────────────────────────────────────────────────────

interface NotificationState {
  ws: WebSocket | null;
  reconnectAttempts: number;
  reconnectTimer: number | null;
  activePulses: Map<string, StarPulse>;
  config: NotificationConfig;
  audioContext: AudioContext | null;
  isConnected: boolean;
  lastEventAt: number;
  eventCount: number;
}

interface StarPulse {
  id: string;
  type: 'message' | 'alert' | 'mesh' | 'activity';
  startTime: number;
  duration: number;
  intensity: number;
  x: number; // normalized 0-1
  y: number;
  z: number;
}

interface MeshEvent {
  type: 'message' | 'alert' | 'mesh' | 'activity';
  source?: string;
  payload?: any;
  timestamp: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

let state: NotificationState | null = null;
let pulseIdCounter = 0;

// ─── Public API ────────────────────────────────────────────────────────────────

export function initStarfieldNotifications(config?: Partial<NotificationConfig>): void {
  if (typeof window === 'undefined') return;

  if (state) {
    // Re-initialize with new config
    disconnect();
  }

  const saved = loadConfigFromStorage();
  state = {
    ws: null,
    reconnectAttempts: 0,
    reconnectTimer: null,
    activePulses: new Map(),
    config: { ...DEFAULT_CONFIG, ...saved, ...config },
    audioContext: null,
    isConnected: false,
    lastEventAt: 0,
    eventCount: 0,
  };

  if (state.config.enabled) {
    connect();
    startPulseLoop();
  }

  exposeWindowAPI();
}

export function disconnect(): void {
  if (!state) return;

  if (state.reconnectTimer) {
    clearTimeout(state.reconnectTimer);
    state.reconnectTimer = null;
  }

  if (state.ws) {
    state.ws.close();
    state.ws = null;
  }

  state.activePulses.clear();
  state.isConnected = false;
}

export function updateConfig(updates: Partial<NotificationConfig>): void {
  if (!state) {
    initStarfieldNotifications(updates);
    return;
  }

  const wasEnabled = state.config.enabled;
  state.config = { ...state.config, ...updates };

  saveConfigToStorage(state.config);

  if (state.config.enabled && !wasEnabled) {
    connect();
    startPulseLoop();
  } else if (!state.config.enabled && wasEnabled) {
    disconnect();
  } else if (state.config.enabled && wasEnabled) {
    // Reconnect if WebSocket URL changed
    if (updates.websocketUrl && state.ws) {
      disconnect();
      connect();
    }
  }
}

export function getConfig(): NotificationConfig | null {
  return state?.config ?? null;
}

export function getStatus(): {
  connected: boolean;
  reconnectAttempts: number;
  activePulses: number;
  eventCount: number;
  lastEventAt: number | null;
} {
  if (!state) {
    return { connected: false, reconnectAttempts: 0, activePulses: 0, eventCount: 0, lastEventAt: null };
  }

  return {
    connected: state.isConnected,
    reconnectAttempts: state.reconnectAttempts,
    activePulses: state.activePulses.size,
    eventCount: state.eventCount,
    lastEventAt: state.lastEventAt,
  };
}

export function triggerNotification(
  type: 'message' | 'alert' | 'mesh' | 'activity',
  priority: 'low' | 'normal' | 'high' | 'critical' = 'normal',
  customData?: any
): void {
  if (!state || !state.config.enabled) return;

  // Check filter
  if (!state.config.filters[type === 'message' ? 'messages' : type === 'alert' ? 'alerts' : type === 'mesh' ? 'meshEvents' : 'activity']) {
    return;
  }

  const pulse = createPulse(type, priority);
  state.activePulses.set(pulse.id, pulse);

  // Trigger starfield alert for high priority
  if (priority === 'high' || priority === 'critical') {
    alertStarfield(priority === 'critical' ? 'critical' : 'warning');
    setTimeout(() => clearStarfieldAlert(), state.config.starPulseDuration);
  }

  // Play sound if enabled
  if (state.config.enableSound) {
    playNotificationSound(type, priority);
  }

  state.eventCount++;
  state.lastEventAt = Date.now();

  // Dispatch custom event for UI updates
  window.dispatchEvent(new CustomEvent('starfield-notification', {
    detail: { type, priority, pulse, data: customData },
  }));
}

// ─── WebSocket Connection ──────────────────────────────────────────────────────

function connect(): void {
  if (!state || !state.config.enabled) return;

  try {
    state.ws = new WebSocket(state.config.websocketUrl);

    state.ws.onopen = () => {
      state!.isConnected = true;
      state!.reconnectAttempts = 0;
      console.log('[StarfieldNotifications] Connected to mesh');

      // Send identification
      state!.ws?.send(JSON.stringify({
        type: 'identify',
        client: 'p31-starfield',
        timestamp: Date.now(),
      }));
    };

    state.ws.onmessage = (event) => {
      try {
        const data: MeshEvent = JSON.parse(event.data);
        handleMeshEvent(data);
      } catch (err) {
        console.warn('[StarfieldNotifications] Failed to parse message:', err);
      }
    };

    state.ws.onclose = () => {
      state!.isConnected = false;
      scheduleReconnect();
    };

    state.ws.onerror = (err) => {
      console.error('[StarfieldNotifications] WebSocket error:', err);
      state!.isConnected = false;
    };
  } catch (err) {
    console.error('[StarfieldNotifications] Failed to connect:', err);
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (!state) return;

  if (state.reconnectAttempts >= state.config.maxReconnectAttempts) {
    console.warn('[StarfieldNotifications] Max reconnect attempts reached');
    return;
  }

  state.reconnectAttempts++;
  console.log(`[StarfieldNotifications] Reconnecting in ${state.config.reconnectInterval}ms (attempt ${state.reconnectAttempts})`);

  state.reconnectTimer = window.setTimeout(() => {
    connect();
  }, state.config.reconnectInterval);
}

function handleMeshEvent(event: MeshEvent): void {
  if (!state) return;

  const priority = event.priority || 'normal';

  switch (event.type) {
    case 'message':
      if (state.config.filters.messages) {
        triggerNotification('message', priority, event);
      }
      break;
    case 'alert':
      if (state.config.filters.alerts) {
        triggerNotification('alert', priority, event);
      }
      break;
    case 'mesh':
      if (state.config.filters.meshEvents) {
        triggerNotification('mesh', priority, event);
      }
      break;
    case 'activity':
      if (state.config.filters.activity) {
        triggerNotification('activity', priority, event);
      }
      break;
  }
}

// ─── Pulse Visualization ───────────────────────────────────────────────────────

function createPulse(
  type: 'message' | 'alert' | 'mesh' | 'activity',
  priority: 'low' | 'normal' | 'high' | 'critical'
): StarPulse {
  const id = `pulse-${++pulseIdCounter}`;

  // Random position in normalized space
  const x = Math.random();
  const y = Math.random();
  const z = (Math.random() - 0.5) * 0.5; // -0.25 to 0.25

  // Adjust duration and intensity based on priority
  let duration = state!.config.starPulseDuration;
  let intensity = state!.config.starPulseIntensity;

  if (priority === 'critical') {
    duration *= 2;
    intensity = 1.0;
  } else if (priority === 'high') {
    duration *= 1.5;
    intensity = Math.min(intensity * 1.5, 1.0);
  } else if (priority === 'low') {
    duration *= 0.5;
    intensity *= 0.5;
  }

  return {
    id,
    type,
    startTime: performance.now(),
    duration,
    intensity,
    x,
    y,
    z,
  };
}

function startPulseLoop(): void {
  if (!state) return;

  const loop = () => {
    if (!state || !state.config.enabled) return;

    const now = performance.now();
    let hasActivePulses = false;

    // Clean up expired pulses
    state.activePulses.forEach((pulse, id) => {
      const elapsed = now - pulse.startTime;
      if (elapsed > pulse.duration) {
        state!.activePulses.delete(id);
      } else {
        hasActivePulses = true;
        renderPulse(pulse, elapsed);
      }
    });

    if (hasActivePulses) {
      requestAnimationFrame(loop);
    } else {
      // Check again in a bit
      setTimeout(() => {
        if (state && state.activePulses.size > 0) {
          startPulseLoop();
        }
      }, 100);
    }
  };

  loop();
}

function renderPulse(pulse: StarPulse, elapsed: number): void {
  // This would integrate with the WebGL starfield
  // For now, we use the starfield singleton's alert system
  // In a full implementation, we'd add pulse particles to the WebGL scene

  const progress = elapsed / pulse.duration;
  const fade = 1 - progress;
  const brightness = Math.sin(progress * Math.PI) * pulse.intensity * fade;

  // Could emit custom events for the WebGL layer
  // window.dispatchEvent(new CustomEvent('starfield-pulse', { detail: { pulse, brightness } }));
}

// ─── Audio Feedback ────────────────────────────────────────────────────────────

function playNotificationSound(
  type: 'message' | 'alert' | 'mesh' | 'activity',
  priority: 'low' | 'normal' | 'high' | 'critical'
): void {
  if (!state || !state.config.enableSound) return;

  try {
    if (!state.audioContext) {
      state.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = state.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    // Different tones for different notification types
    const freqs = {
      message: [523.25, 659.25], // C5, E5 - pleasant
      alert: [440, 293.66],      // A4, D4 - attention
      mesh: [329.63, 392],       // E4, G4 - connected
      activity: [587.33, 783.99], // D5, G5 - active
    };

    const [f1, f2] = freqs[type];
    osc.frequency.setValueAtTime(f1, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + 0.1);

    const vol = state.config.soundVolume * (priority === 'critical' ? 1.0 : priority === 'high' ? 0.8 : 0.5);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.warn('[StarfieldNotifications] Audio play failed:', err);
  }
}

// ─── Persistence ───────────────────────────────────────────────────────────────

const STORAGE_KEY = 'p31-starfield-notifications-config';

function loadConfigFromStorage(): Partial<NotificationConfig> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveConfigToStorage(config: NotificationConfig): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.warn('[StarfieldNotifications] Failed to save config:', err);
  }
}

// ─── Window API ────────────────────────────────────────────────────────────────

function exposeWindowAPI(): void {
  if (typeof window === 'undefined') return;

  (window as any).p31StarfieldNotifications = {
    init: initStarfieldNotifications,
    updateConfig,
    getConfig,
    getStatus,
    disconnect,
    triggerNotification,
  };
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Delay to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initStarfieldNotifications());
  } else {
    initStarfieldNotifications();
  }
}
