/**
 * Q-Factor Coherence Worker — P31 Labs
 * EXEC-09 / Gap H
 *
 * Routes:
 *   POST /qfactor/compute       → compute Q-score from input JSON
 *   POST /qfactor/event         → ingest biometric event (HRV, spoons, calcium)
 *   GET  /qfactor/current       → latest Q-score for a user
 *   GET  /qfactor/history?n=24  → last N hourly Q-scores
 *   GET  /health                → liveness
 *
 * HA integration: POST /qfactor/event with { source: "ha", type: "hrv"|"spoon"|"calcium" }
 */

import { computeQFactor, QFactorInputs, QFactorOutput } from './qfactor';

export interface Env {
  QFACTOR_KV: KVNamespace;
  P31_API_SECRET?: string;
  FHIR_STATUS_URL?: string;     // https://api.p31ca.org/fhir/status
  P31_FHIR_SECRET?: string;
}

// ── CORS ──────────────────────────────────────────────────────────────────

function cors(origin = '*'): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  });
}

function err(msg: string, status = 400): Response {
  return json({ error: msg }, status);
}

// ── Auth (admin routes only — telemetry endpoints are open-namespace) ────

function authed(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization') ?? '';
  return !env.P31_API_SECRET || auth === `Bearer ${env.P31_API_SECRET}`;
}

// ── userId validation (alphanumeric, 1-32 chars) ─────────────────────────

function validUserId(id: string | null | undefined): id is string {
  return typeof id === 'string' && /^[a-z0-9_-]{1,32}$/.test(id);
}

// ── KV key helpers ────────────────────────────────────────────────────────

function stateKey(userId: string): string {
  return `qfactor:state:${userId}`;
}

function historyKey(userId: string, hourBucket: string): string {
  return `qfactor:history:${userId}:${hourBucket}`;
}

function hourBucket(ts = Date.now()): string {
  return new Date(ts).toISOString().slice(0, 13); // "2026-05-05T14"
}

// ── Stored biometric state (KV-backed) ───────────────────────────────────

interface BiometricState {
  userId: string;
  lastHrvRmssd?: number;
  lastActivityLevel?: number;
  lastSpoonBalance?: number;
  lastSpoonMax?: number;
  lastCalciumMgDl?: number;
  lastMedAdherenceScore?: number;
  lastSocialConnectivity?: number;
  recentStressor?: boolean;
  updatedAt: number;
}

async function getState(env: Env, userId: string): Promise<BiometricState> {
  const raw = await env.QFACTOR_KV.get(stateKey(userId));
  return raw ? JSON.parse(raw) : { userId, updatedAt: 0 };
}

async function patchState(env: Env, userId: string, patch: Partial<BiometricState>): Promise<BiometricState> {
  const current = await getState(env, userId);
  const next = { ...current, ...patch, updatedAt: Date.now() };
  await env.QFACTOR_KV.put(stateKey(userId), JSON.stringify(next), { expirationTtl: 7 * 86400 });
  return next;
}

// ── Pull latest calcium from FHIR worker ─────────────────────────────────

async function pullCalciumIfStale(env: Env, state: BiometricState): Promise<number | undefined> {
  if (!env.FHIR_STATUS_URL || !env.P31_FHIR_SECRET) return state.lastCalciumMgDl;
  // Only refresh if calcium data is >2 hours old
  if (state.lastCalciumMgDl !== undefined && Date.now() - state.updatedAt < 2 * 3600_000) {
    return state.lastCalciumMgDl;
  }
  try {
    const resp = await fetch(`${env.FHIR_STATUS_URL}`, {
      headers: { Authorization: `Bearer ${env.P31_FHIR_SECRET}` },
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const data = await resp.json() as { latestCalcium?: { valueMgDl?: number } };
      return data.latestCalcium?.valueMgDl;
    }
  } catch { /* best-effort */ }
  return state.lastCalciumMgDl;
}

// ── Handlers ──────────────────────────────────────────────────────────────

async function handleCompute(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as QFactorInputs & { userId?: string };
  const { userId, ...inputs } = body;
  if (!validUserId(userId)) return err('userId required (1-32 alphanumeric chars)', 400);

  const state = await getState(env, userId);
  const calcium = await pullCalciumIfStale(env, state);

  const merged: QFactorInputs = {
    hrvRmssd: state.lastHrvRmssd,
    activityLevel: state.lastActivityLevel,
    spoonBalance: state.lastSpoonBalance,
    spoonMax: state.lastSpoonMax ?? 10,
    calciumMgDl: calcium,
    medAdherenceScore: state.lastMedAdherenceScore,
    socialConnectivity: state.lastSocialConnectivity,
    recentStressor: state.recentStressor,
    hourUTC: new Date().getUTCHours(),
    ...inputs,
  };

  const result = computeQFactor(merged);

  // Archive hourly
  await env.QFACTOR_KV.put(
    historyKey(userId, hourBucket()),
    JSON.stringify({ ts: Date.now(), ...result }),
    { expirationTtl: 30 * 86400 }
  );

  return json({ userId, ts: Date.now(), ...result });
}

async function handleEvent(request: Request, env: Env): Promise<Response> {
  const body = await request.json() as {
    userId?: string;
    source: string;
    type: string;
    value: number;
    metadata?: Record<string, unknown>;
  };

  const userId = body.userId;
  if (!validUserId(userId)) return err('userId required (1-32 alphanumeric chars)', 400);
  const patch: Partial<BiometricState> = {};

  switch (body.type) {
    case 'hrv':         patch.lastHrvRmssd = body.value; break;
    case 'activity':    patch.lastActivityLevel = body.value; break;
    case 'spoon':       patch.lastSpoonBalance = body.value; break;
    case 'spoon_max':   patch.lastSpoonMax = body.value; break;
    case 'calcium':     patch.lastCalciumMgDl = body.value; break;
    case 'med_adherence': patch.lastMedAdherenceScore = body.value; break;
    case 'social':      patch.lastSocialConnectivity = body.value; break;
    case 'stressor':    patch.recentStressor = body.value > 0; break;
    default: return err(`Unknown event type: ${body.type}`);
  }

  const state = await patchState(env, userId, patch);

  // Compute new Q-score with updated state
  const calcium = await pullCalciumIfStale(env, state);
  const result = computeQFactor({
    hrvRmssd: state.lastHrvRmssd,
    activityLevel: state.lastActivityLevel,
    spoonBalance: state.lastSpoonBalance,
    spoonMax: state.lastSpoonMax ?? 10,
    calciumMgDl: calcium,
    medAdherenceScore: state.lastMedAdherenceScore,
    socialConnectivity: state.lastSocialConnectivity,
    recentStressor: state.recentStressor,
    hourUTC: new Date().getUTCHours(),
  });

  return json({ ok: true, userId, event: body.type, ...result });
}

async function handleCurrent(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!validUserId(userId)) return err('userId required (1-32 alphanumeric chars)', 400);
  const state = await getState(env, userId);
  const calcium = await pullCalciumIfStale(env, state);

  const result = computeQFactor({
    hrvRmssd: state.lastHrvRmssd,
    activityLevel: state.lastActivityLevel,
    spoonBalance: state.lastSpoonBalance,
    spoonMax: state.lastSpoonMax ?? 10,
    calciumMgDl: calcium,
    medAdherenceScore: state.lastMedAdherenceScore,
    socialConnectivity: state.lastSocialConnectivity,
    recentStressor: state.recentStressor,
    hourUTC: new Date().getUTCHours(),
  });

  return json({ userId, ts: Date.now(), stateAge: Date.now() - state.updatedAt, ...result });
}

async function handleHistory(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');
  if (!validUserId(userId)) return err('userId required (1-32 alphanumeric chars)', 400);
  const n = Math.min(parseInt(url.searchParams.get('n') ?? '24'), 168);

  const now = Date.now();
  const keys: string[] = [];
  for (let i = 0; i < n; i++) {
    keys.push(historyKey(userId, hourBucket(now - i * 3600_000)));
  }

  const results = await Promise.all(
    keys.map(k => env.QFACTOR_KV.get(k).then(v => v ? JSON.parse(v) : null))
  );

  return json({ userId, n, history: results.filter(Boolean) });
}

// ── Main handler ──────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() });
    }

    if (path === '/health') return json({ ok: true, ts: Date.now() });

    if (path === '/qfactor/compute' && request.method === 'POST') {
      return handleCompute(request, env);
    }
    if (path === '/qfactor/event' && request.method === 'POST') {
      return handleEvent(request, env);
    }
    if (path === '/qfactor/current' && request.method === 'GET') {
      return handleCurrent(request, env);
    }
    if (path === '/qfactor/history' && request.method === 'GET') {
      return handleHistory(request, env);
    }

    return err('Not found', 404);
  },
};
