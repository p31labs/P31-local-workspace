/**
 * fleet-telemetry.ts — Live polling client for the P31 Cloudflare fleet.
 *
 * Polls a curated 8-probe subset of ops-glass-probes.json across three tiers.
 * State transitions (not every poll) fire window.p31Notify SMART atoms.
 * ≥2 simultaneous critical-tier failures trigger alertStarfield('critical'),
 * turning the starfield violent coral at MAX_PARTICLES until the mesh recovers.
 *
 * Architecture:
 *   - Single setInterval(tick, 5s) fan-out loop — one timer, not N.
 *   - Per-probe ProbeState with independent nextCheck timestamps.
 *   - Exponential backoff on consecutive failures (1.5× per failure, cap 5min).
 *   - 401/403/302 treated as "edge up" (Cloudflare Access may gate some paths).
 *   - firstPoll suppression — no SMART atoms on the initial baseline sweep.
 *   - navigator.onLine guard — probes skip silently when the device is offline.
 *   - Fully stops on stop() — safe to call before unload or in test teardown.
 *
 * Expose on window for console inspection:
 *   window.__p31Fleet.snapshot()   → Map<id, { status, latencyMs, lastChecked }>
 *   window.__p31Fleet.stop()       → teardown
 */

import { alertStarfield, clearStarfieldAlert } from './starfield-singleton';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProbeStatus = 'unknown' | 'healthy' | 'degraded' | 'down';
export type ProbeTier   = 'critical' | 'high' | 'monitor';

type SmartSeverity = 'info' | 'success' | 'warning' | 'critical' | 'mesh';

interface ProbeSpec {
  id: string;
  url: string;
  tier: ProbeTier;
  latencyDegradedMs?: number; // ms above which status → 'degraded' (default: 3000)
}

interface ProbeState {
  spec: ProbeSpec;
  status: ProbeStatus;
  latencyMs: number;
  failures: number;
  lastChecked: number;
  nextCheck: number;
  firstPoll: boolean;
}

export interface FleetSnapshot {
  status: ProbeStatus;
  latencyMs: number;
  lastChecked: number;
}

export interface TelemetryHandle {
  stop(): void;
  snapshot(): ReadonlyMap<string, Readonly<FleetSnapshot>>;
}

// ── Timing constants ──────────────────────────────────────────────────────────

const POLL_MS: Record<ProbeTier, number> = {
  critical: 45_000,   // 45s
  high:     90_000,   // 90s
  monitor: 180_000,   // 3min
};

const TIMEOUT_MS: Record<ProbeTier, number> = {
  critical:  6_000,
  high:      8_000,
  monitor:  10_000,
};

const MAX_BACKOFF_MS = 300_000; // 5 min ceiling on backoff
const TICK_MS        = 5_000;  // single interval resolution

// PLASMA threshold: if this many critical probes are simultaneously down → alert
const PLASMA_THRESHOLD = 2;

// ── Probe catalog (curated 7/42 from ops-glass-probes.json) ──────────────────
// Criteria: highest signal, CORS-enabled, non-POST.
// command-center is CF Access gated: fetch uses redirect:'manual' so the 302→
// cloudflareaccess.com never follows; opaqueredirect response = edge is up.
const PROBE_CATALOG: ProbeSpec[] = [
  // ── CRITICAL — starfield enters PLASMA if ≥2 simultaneously down ──────────
  {
    id:  'command-center',
    url: 'https://command-center.trimtab-signal.workers.dev/api/health',
    tier: 'critical',
  },
  {
    id:  'k4-cage',
    url: 'https://k4-cage.trimtab-signal.workers.dev/api/health',
    tier: 'critical',
  },
  {
    id:  'k4-personal',
    url: 'https://k4-personal.trimtab-signal.workers.dev/api/health',
    tier: 'critical',
  },
  // ── HIGH — SMART warning atoms; no starfield override ────────────────────
  {
    id:  'bonding-relay',
    url: 'https://bonding-relay.trimtab-signal.workers.dev/health',
    tier: 'high',
  },
  {
    id:  'social-worker',
    url: 'https://social.p31ca.org/',
    tier: 'high',
    latencyDegradedMs: 4_000,
  },
  // ── MONITOR — SMART atoms on transitions; console.debug only ─────────────
  {
    id:  'donate-api',
    url: 'https://donate-api.trimtab-signal.workers.dev/health',
    tier: 'monitor',
  },
  {
    id:  'bonding-soup',
    url: 'https://bonding.p31ca.org/',
    tier: 'monitor',
    latencyDegradedMs: 5_000,
  },
];

// ── Notify helper (resolves window.p31Notify lazily) ─────────────────────────

function notify(opts: {
  id?: string;
  groupId?: string;
  severity: SmartSeverity;
  title: string;
  message?: string;
  lifespan?: number;
}): void {
  try {
    const fn = (window as unknown as Record<string, unknown>)['p31Notify'] as
      ((o: typeof opts) => void) | undefined;
    fn?.(opts);
  } catch { /* p31Notify not loaded yet — silent */ }
}

// ── Single probe execution ────────────────────────────────────────────────────

async function runProbe(ps: ProbeState): Promise<void> {
  const { spec } = ps;
  const t0 = performance.now();
  let next: ProbeStatus = 'unknown';

  if (!navigator.onLine) {
    // Device offline — leave status as-is, retry after normal interval
    ps.nextCheck = Date.now() + POLL_MS[spec.tier];
    return;
  }

  try {
    const ctrl = new AbortController();
    const timerId = setTimeout(() => ctrl.abort(), TIMEOUT_MS[spec.tier]);
    let res: Response;
    try {
      res = await fetch(spec.url, {
        method:   'GET',
        signal:   ctrl.signal,
        cache:    'no-store',
        mode:     'cors',
        redirect: 'manual',
      });
    } finally {
      clearTimeout(timerId);
    }

    const latency = performance.now() - t0;
    ps.latencyMs = latency;

    // opaqueredirect = CF Access 302 blocked by redirect:'manual' = edge is up
    const edgeUp = res.ok || res.status === 401 || res.status === 403 || res.status === 302 || res.type === 'opaqueredirect';
    if (!edgeUp) {
      next = 'down';
    } else if (latency > (spec.latencyDegradedMs ?? 3_000)) {
      next = 'degraded';
    } else {
      next = 'healthy';
    }
  } catch (e) {
    ps.latencyMs = performance.now() - t0;
    next = (e instanceof Error && e.name === 'AbortError') ? 'degraded' : 'down';
  }

  const prev = ps.status;
  ps.status     = next;
  ps.lastChecked = Date.now();

  // Backoff on failure, reset on recovery
  if (next === 'down' || next === 'degraded') {
    ps.failures += 1;
    const backoff = Math.min(
      POLL_MS[spec.tier] * Math.pow(1.5, ps.failures - 1),
      MAX_BACKOFF_MS
    );
    ps.nextCheck = ps.lastChecked + backoff;
  } else {
    ps.failures  = 0;
    ps.nextCheck = ps.lastChecked + POLL_MS[spec.tier];
  }

  // ── State-transition SMART atoms (suppressed on very first poll) ──────────
  if (!ps.firstPoll && spec.tier !== 'monitor') {
    // SEV-0 = critical tier down; SEV-1 = high tier down
    const sevLabel = spec.tier === 'critical' ? 'SEV-0' : 'SEV-1';
    if (prev !== 'down' && next === 'down') {
      notify({
        id:       `fleet-${spec.id}-down`,
        groupId:  'fleet',
        severity: spec.tier === 'critical' ? 'critical' : 'warning',
        title:    `[${sevLabel}] ${spec.id} offline`,
        message:  `Unreachable after ${Math.round(ps.latencyMs)}ms`,
        lifespan: 14_000,
      });
    } else if (prev === 'down' && next === 'healthy') {
      notify({
        id:       `fleet-${spec.id}-restored`,
        groupId:  'fleet',
        severity: 'success',
        title:    `[${sevLabel}] ${spec.id} restored`,
        message:  `${Math.round(ps.latencyMs)}ms`,
        lifespan:  7_000,
      });
    } else if (prev === 'healthy' && next === 'degraded') {
      notify({
        id:       `fleet-${spec.id}-slow`,
        groupId:  'fleet',
        severity: 'warning',
        title:    `[${sevLabel}] ${spec.id} degraded`,
        message:  `${Math.round(ps.latencyMs)}ms response`,
        lifespan:  9_000,
      });
    }
  }
  ps.firstPoll = false;
}

// ── Plasma threshold check ────────────────────────────────────────────────────

function evaluatePlasmaState(
  states: Map<string, ProbeState>,
  alertActive: { value: boolean }
): void {
  const criticalDown = [...states.values()].filter(
    s => s.spec.tier === 'critical' && s.status === 'down'
  ).length;

  if (criticalDown >= PLASMA_THRESHOLD && !alertActive.value) {
    alertActive.value = true;
    alertStarfield('critical');
    notify({
      id:       'fleet-plasma-alert',
      groupId:  'fleet',
      severity: 'critical',
      title:    'Mesh instability',
      message:  `${criticalDown} critical workers unreachable`,
      lifespan:  16_000,
    });
  } else if (criticalDown < PLASMA_THRESHOLD && alertActive.value) {
    alertActive.value = false;
    clearStarfieldAlert();
    notify({
      id:       'fleet-plasma-clear',
      groupId:  'fleet',
      severity: 'success',
      title:    'Mesh restored',
      message:  'Critical workers back online',
      lifespan:  8_000,
    });
  }
}

// ── Public entry point ────────────────────────────────────────────────────────

export function startFleetTelemetry(): TelemetryHandle {
  const states = new Map<string, ProbeState>();
  const alertActive = { value: false };

  // Build initial state; stagger first polls by ≤5s to avoid thundering herd
  const now = Date.now();
  PROBE_CATALOG.forEach((spec, i) => {
    states.set(spec.id, {
      spec,
      status:      'unknown',
      latencyMs:   0,
      failures:    0,
      lastChecked: 0,
      nextCheck:   now + (i * 600), // 600ms spacing between initial probes
      firstPoll:   true,
    });
  });

  const tickId = setInterval(() => {
    const t = Date.now();
    for (const ps of states.values()) {
      if (t >= ps.nextCheck) {
        // Optimistic advance prevents double-firing while probe is in flight
        ps.nextCheck = t + POLL_MS[ps.spec.tier];
        runProbe(ps)
          .then(() => evaluatePlasmaState(states, alertActive))
          .catch(() => { /* errors are captured into ProbeState */ });
      }
    }
  }, TICK_MS);

  return {
    stop() {
      clearInterval(tickId);
      if (alertActive.value) {
        clearStarfieldAlert();
        alertActive.value = false;
      }
    },
    snapshot() {
      const out = new Map<string, FleetSnapshot>();
      for (const [id, ps] of states) {
        out.set(id, {
          status:      ps.status,
          latencyMs:   Math.round(ps.latencyMs),
          lastChecked: ps.lastChecked,
        });
      }
      return out;
    },
  };
}
