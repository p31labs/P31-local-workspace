/**
 * @file notificationStore.ts — Catcher's Mitt Zustand store
 * 
 * Temporal batching window (60s) for inbound mesh network data and UI notifications.
 * Flattens endocrinological curve, prevents sensory overwhelm.
 * 
 * CWP-JITTERBUG-11: The Catcher's Mitt
 */
import { create } from 'zustand';

export interface BufferedSignal {
  id: string;
  type: 'spoon' | 'coherence' | 'genesis' | 'mesh' | 'tether';
  payload: unknown;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationState {
  // Buffer state
  pendingQueue: BufferedSignal[];
  activeDisplay: BufferedSignal[];
  
  // Timing control
  flushIntervalMs: number;
  lastFlush: number;
  isManualOverride: boolean;
  
  // Counters
  totalReceived: number;
  totalFlushed: number;
  
  // Actions
  addSignal: (signal: Omit<BufferedSignal, 'id' | 'timestamp'>) => void;
  flushBuffer: () => void;
  setManualOverride: (enabled: boolean) => void;
  clearAll: () => void;
  getPendingCount: () => number;
}

const generateId = () => Math.random().toString(36).slice(2, 11);

/**
 * Create notification store with 60-second temporal batching.
 * Non-critical signals accumulate in pendingQueue, flush to activeDisplay
 * every 60 seconds (or on manual override).
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  pendingQueue: [],
  activeDisplay: [],
  
  flushIntervalMs: 60000, // 60 seconds
  lastFlush: Date.now(),
  isManualOverride: false,
  
  totalReceived: 0,
  totalFlushed: 0,
  
  addSignal: (signal) => {
    const newSignal: BufferedSignal = {
      ...signal,
      id: generateId(),
      timestamp: Date.now(),
    };
    
    set((state) => ({
      pendingQueue: [...state.pendingQueue, newSignal],
      totalReceived: state.totalReceived + 1,
    }));
  },
  
  flushBuffer: () => {
    const { pendingQueue, activeDisplay } = get();
    const now = Date.now();
    
    // Move all pending to active display
    set({
      pendingQueue: [],
      activeDisplay: [...activeDisplay, ...pendingQueue].slice(-50), // Keep last 50
      lastFlush: now,
      totalFlushed: get().totalFlushed + pendingQueue.length,
      isManualOverride: false,
    });
  },
  
  setManualOverride: (enabled) => {
    if (enabled) {
      get().flushBuffer();
    }
    set({ isManualOverride: enabled });
  },
  
  clearAll: () => {
    set({
      pendingQueue: [],
      activeDisplay: [],
    });
  },
  
  getPendingCount: () => get().pendingQueue.length,
}));

/**
 * Auto-flush timer hook — call from React component on mount.
 * Uses setInterval to flush every 60 seconds.
 */
let flushIntervalId: ReturnType<typeof setInterval> | null = null;

export function startCatchersMittTimer() {
  if (flushIntervalId) return;
  
  const store = useNotificationStore.getState();
  flushIntervalId = setInterval(() => {
    const { pendingQueue, isManualOverride } = useNotificationStore.getState();
    // Auto-flush if not in manual override and have pending signals
    if (!isManualOverride && pendingQueue.length > 0) {
      useNotificationStore.getState().flushBuffer();
    }
  }, store.flushIntervalMs);
}

export function stopCatchersMittTimer() {
  if (flushIntervalId) {
    clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
}