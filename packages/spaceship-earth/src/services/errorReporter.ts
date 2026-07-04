// ═══════════════════════════════════════════════════════════════
// WCD-28.6: Error Reporter with IndexedDB Ring Buffer
// P31 Labs — Spaceship Earth
//
// IMPORTANT: Do NOT use localStorage for error storage.
// localStorage is synchronous (blocks main thread) and shared.
// Use IndexedDB via idb-keyval with ring buffer.
// ═══════════════════════════════════════════════════════════════

import { get, set } from 'idb-keyval';

const MAX_ERRORS = 100;
const STORE_KEY = 'p31-error-log';

export interface ErrorEntry {
  message: string;
  stack?: string;
  context: {
    room?: string;
    action?: string;
    skin?: string;
  };
  timestamp: number;
}

export async function logError(entry: ErrorEntry): Promise<void> {
  try {
    const existing: ErrorEntry[] = (await get(STORE_KEY)) ?? [];
    existing.push(entry);
    // Ring buffer: prune oldest if over limit
    while (existing.length > MAX_ERRORS) existing.shift();
    await set(STORE_KEY, existing);
  } catch (err) {
    // If IndexedDB fails, at least log to console
    console.error('[p31-error] Failed to store error:', err);
  }
}

export async function getErrorLog(): Promise<ErrorEntry[]> {
  try {
    return (await get(STORE_KEY)) ?? [];
  } catch {
    return [];
  }
}

export async function clearErrorLog(): Promise<void> {
  try {
    await set(STORE_KEY, []);
  } catch {
    // Ignore
  }
}

// Install global handlers
export function initErrorReporting(): void {
  // Window error handler
  window.onerror = (msg, src, line, col, err) => {
    logError({
      message: String(msg),
      stack: err?.stack,
      context: {
        action: 'window.onerror',
      },
      timestamp: Date.now(),
    });
    // Return false to let default error handler also run
    return false;
  };

  // Unhandled promise rejection
  window.onunhandledrejection = (event) => {
    logError({
      message: event.reason?.message ?? 'Unhandled Promise Rejection',
      stack: event.reason?.stack,
      context: {
        action: 'unhandledrejection',
      },
      timestamp: Date.now(),
    });
  };
}
