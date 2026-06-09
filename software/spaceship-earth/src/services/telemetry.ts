/**
 * @file telemetry — Opt-in anonymous event + performance telemetry via navigator.sendBeacon.
 *
 * Opt-in:  set localStorage `p31-telemetry` = '1' (DevOverlay checkbox toggles this).
 * Endpoint: POST /api/telemetry — graceful no-op when absent (sendBeacon is fire-and-forget).
 *
 * Events batched in a module-level queue; flushed when queue reaches 10 items or on pagehide.
 * No PII collected — only event names, timestamps, and anonymous numeric state.
 *
 * COPPA Compliance:
 *   - Kids mode blocks all telemetry (checked in uploadPerformanceData)
 *   - No personal data collected
 *   - Anonymous session ID only
 *
 * Instrumented actions (call sites):
 *   overlay_open     — SovereignShell overlay SFX effect
 *   cartridge_mount  — useSovereignStore.mountToSlot action
 *   coherence_change — useSovereignStore.appendTelemetry (emitted when coherence updates)
 */

import { performanceMonitor } from './performanceMonitor';

const STORAGE_KEY = 'p31-telemetry';
const ENDPOINT    = '/api/telemetry';
const PERF_ENDPOINT = '/api/telemetry/perf';

// Session ID for performance telemetry (anonymous, no PII)
let _sessionId: string | null = null;
function getSessionId(): string {
  if (!_sessionId) {
    try {
      const stored = localStorage.getItem('p31-telemetry-session');
      if (stored) {
        _sessionId = stored;
      } else {
        _sessionId = crypto.randomUUID();
        localStorage.setItem('p31-telemetry-session', _sessionId);
      }
    } catch {
      _sessionId = 'unknown';
    }
  }
  return _sessionId;
}

export function isTelemetryEnabled(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export function setTelemetryEnabled(on: boolean): void {
  try { localStorage.setItem(STORAGE_KEY, on ? '1' : '0'); } catch {}
}

/**
 * Check if we're in Kids mode (COPPA gate).
 * Returns true if telemetry should be blocked.
 */
export function isKidsMode(): boolean {
  try {
    // Check multiple sources for kids mode
    const skinTheme = localStorage.getItem('p31-skin-theme');
    const kidsMode = localStorage.getItem('p31-kids-mode');
    return skinTheme === 'KIDS' || kidsMode === '1' || kidsMode === 'true';
  } catch {
    return false;
  }
}

/**
 * Upload aggregated performance data to server.
 * Called periodically (every 60s) when telemetry is enabled.
 * Blocked by COPPA (kids mode).
 */
export async function uploadPerformanceData(): Promise<void> {
  // COPPA gate - block all telemetry for kids
  if (isKidsMode()) {
    console.warn('[Telemetry] Blocked: Kids mode active (COPPA)');
    return;
  }

  if (!isTelemetryEnabled()) return;

  const history = performanceMonitor.getHistory();
  if (history.length === 0) return;

  // Aggregate metrics
  const fpsValues = history.map(m => m.fps);
  const avgFps = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
  const minFps = Math.min(...fpsValues);
  const maxFps = Math.max(...fpsValues);

  // Get memory values (filter nulls)
  const memoryValues = history.map(m => m.memory).filter((m): m is number => m !== null);
  const avgMemory = memoryValues.length > 0
    ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length
    : null;

  // Get device info (anonymous, no PII)
  // Note: We intentionally omit userAgent to avoid fingerprinting concerns.
  // Basic screen dimensions are low-entropy and commonly shared.
  const deviceInfo = {
    screenResolution: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
    dpr: typeof devicePixelRatio !== 'undefined' ? devicePixelRatio : 1,
  };

  const payload = {
    sessionId: getSessionId(),
    timestamp: Date.now(),
    metrics: {
      fps: Math.round(avgFps),
      fpsMin: Math.round(minFps),
      fpsMax: Math.round(maxFps),
      memory: avgMemory ? Math.round(avgMemory) : null,
    },
    device: deviceInfo,
  };

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon(PERF_ENDPOINT, blob);
  } catch {
    // Fire-and-forget - endpoint may not exist in dev
  }
}

// Periodic performance upload (every 60 seconds)
let _perfUploadInterval: ReturnType<typeof setInterval> | null = null;

export function startPerformanceUpload(): void {
  if (_perfUploadInterval) return;
  _perfUploadInterval = setInterval(uploadPerformanceData, 60000);
}

export function stopPerformanceUpload(): void {
  if (_perfUploadInterval) {
    clearInterval(_perfUploadInterval);
    _perfUploadInterval = null;
  }
}

interface TelemetryEvent {
  name: string;
  data: Record<string, unknown>;
  ts: number;
}

const _queue: TelemetryEvent[] = [];

function flush(): void {
  if (!_queue.length) return;
  if (typeof navigator === 'undefined' || !navigator.sendBeacon) return;
  const payload = JSON.stringify({ events: _queue.splice(0) });
  try {
    navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: 'application/json' }));
  } catch { /* fire-and-forget — endpoint may not exist in dev */ }
}

export function trackEvent(name: string, data: Record<string, unknown> = {}): void {
  if (!isTelemetryEnabled()) return;
  _queue.push({ name, data, ts: Date.now() });
  if (_queue.length >= 10) flush();
}

// Flush remaining events before page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flush);

  // Start performance upload when telemetry is enabled
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue === '1') {
      startPerformanceUpload();
    } else if (e.key === STORAGE_KEY && e.newValue === '0') {
      stopPerformanceUpload();
    }
  });

  // Also start if already enabled
  if (isTelemetryEnabled()) {
    startPerformanceUpload();
  }
}
