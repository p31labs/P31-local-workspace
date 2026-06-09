/**
 * Shared live telemetry + perf flags for Sovereign Cockpit surfaces (/dome + hub).
 */

export const TELEMETRY_URLS = {
  qFactor: "https://k4-hubs.trimtab-signal.workers.dev/hub/q-factor",
  love: "https://p31-workers.trimtab-signal.workers.dev/api/love/balance/will-001",
  spoons: "https://k4-personal.trimtab-signal.workers.dev/agent/will/energy",
} as const;

/** FERS wall clock — aligned with simplex-v7/src/lib/fers-countdown.ts */
export const FERS_DEADLINE_MS = Date.parse("2026-09-30T21:00:00.000Z");

export function fersDaysRemaining(nowMs = Date.now()): number {
  return Math.ceil((FERS_DEADLINE_MS - nowMs) / 86_400_000);
}

/** Ko-fi / L.O.V.E. ladder target (31P Larmor Hz) — same meaning as hub trimtab readout */
export const LOVE_LEDGER_TARGET = 863;

export function fersUrgencyCss(daysRemaining: number): "fers-ok" | "fers-warn" | "fers-hot" | "fers-critical" {
  if (daysRemaining < 30) return "fers-critical";
  if (daysRemaining < 60) return "fers-hot";
  if (daysRemaining < 90) return "fers-warn";
  return "fers-ok";
}

/** SIMPLEX v7 merged state (`GET /api/state` → `state`). Override: `?simplexState=` URL or `window.__P31_SIMPLEX_STATE_URL__`. */
export const SIMPLEX_STATE_URL_DEFAULT = "https://api.phosphorus31.org/api/state";

export function resolveSimplexStateUrl(): string {
  try {
    const w = typeof window !== "undefined" ? (window as unknown as { __P31_SIMPLEX_STATE_URL__?: string }) : undefined;
    if (w?.__P31_SIMPLEX_STATE_URL__) return String(w.__P31_SIMPLEX_STATE_URL__).trim();
  } catch {
    /* */
  }
  try {
    const q = new URLSearchParams(typeof location !== "undefined" ? location.search : "").get("simplexState");
    if (q) return decodeURIComponent(q.trim());
  } catch {
    /* */
  }
  return SIMPLEX_STATE_URL_DEFAULT;
}

export function readDomePerfLite(): boolean {
  if (typeof window === "undefined") return false;
  const q = new URLSearchParams(location.search);
  if (q.get("perf") === "lite") return true;
  try {
    return localStorage.getItem("p31:dome:perf") === "lite";
  } catch {
    return false;
  }
}

/** Trim-tab readout: sub-kHz uses Hz; at/above 1 kHz uses "k Hz". */
export function formatTrimHz(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(2)}k Hz`;
  return `${Math.round(hz)}Hz`;
}

export async function fetchWithCache<T extends object>(
  url: string,
  cacheKey: string,
  fallback: T
): Promise<T> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error("Network error");
    const data = (await response.json()) as T;
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch {
      /* quota / private mode */
    }
    return data;
  } catch {
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? (JSON.parse(cached) as T) : fallback;
    } catch {
      return fallback;
    }
  }
}
