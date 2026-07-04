// workers/fhir/src/index.ts
// P31 FHIR Calcium Monitoring Worker
// Implements EXEC-03 (Gap C): HL7 FHIR integration for hypoparathyroidism patient

import type { Env } from './types';
import { buildAuthURL, exchangeCode, getValidToken, storeTokens } from './oauth';
import { pullCalciumObservations, getRecentReadings, exportFHIRBundle } from './fhir';
import { evaluateAndAlert } from './alert';
import { auditLog } from './audit';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://p31ca.org',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  // Scheduled cron: pulls latest calcium labs and fires alerts if needed
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runCalciumCheck(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // OAuth initiation — redirects operator to Epic login
    if (url.pathname === '/fhir/auth' && request.method === 'GET') {
      return handleAuthInit(env);
    }

    // OAuth callback — Epic redirects here with auth code
    if (url.pathname === '/fhir/callback' && request.method === 'GET') {
      return handleAuthCallback(request, env);
    }

    // Require API secret for all other endpoints
    const auth = request.headers.get('Authorization');
    if (!auth || auth !== `Bearer ${env.P31_API_SECRET}`) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // GET /fhir/status — last reading + alert status
    if (url.pathname === '/fhir/status' && request.method === 'GET') {
      return handleStatus(env);
    }

    // GET /fhir/readings — recent readings
    if (url.pathname === '/fhir/readings' && request.method === 'GET') {
      return handleReadings(request, env);
    }

    // POST /fhir/check — manual trigger of calcium check
    if (url.pathname === '/fhir/check' && request.method === 'POST') {
      await runCalciumCheck(env);
      return json({ ok: true });
    }

    // POST /fhir/medication-log — log a dose
    if (url.pathname === '/fhir/medication-log' && request.method === 'POST') {
      return handleMedicationLog(request, env);
    }

    // GET /fhir/export — FHIR Bundle export (patient portability)
    if (url.pathname === '/fhir/export' && request.method === 'GET') {
      return handleExport(env);
    }

    return json({ error: 'Not Found' }, 404);
  },
};

async function runCalciumCheck(env: Env): Promise<void> {
  const tokenData = await getValidToken(env);
  if (!tokenData) {
    await auditLog(env, 'cron', 'lab_pull', 'error', {
      detail: 'No valid token — operator must complete OAuth at /fhir/auth',
    });
    return;
  }

  try {
    await pullCalciumObservations(env, tokenData.accessToken, tokenData.patientId);
  } catch {
    return; // auditLog already called inside pullCalciumObservations
  }

  // Evaluate most recent reading regardless of whether it's new (thresholds may have changed)
  const recent = await getRecentReadings(env, 1);
  if (recent.length === 0) return;

  await evaluateAndAlert(env, recent[0]);
}

async function handleAuthInit(env: Env): Promise<Response> {
  const state = crypto.randomUUID();
  // Store state in KV for CSRF validation (5 min TTL)
  await env.FHIR_TOKENS.put(`oauth_state:${state}`, '1', { expirationTtl: 300 });
  await auditLog(env, 'operator', 'auth_init', 'success');
  return Response.redirect(buildAuthURL(env, state), 302);
}

async function handleAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    await auditLog(env, 'operator', 'auth_callback', 'error', { detail: error });
    return json({ error: `Epic auth error: ${error}` }, 400);
  }

  if (!code || !state) {
    return json({ error: 'Missing code or state' }, 400);
  }

  // Validate state (CSRF check)
  const storedState = await env.FHIR_TOKENS.get(`oauth_state:${state}`);
  if (!storedState) {
    return json({ error: 'Invalid or expired state' }, 400);
  }
  await env.FHIR_TOKENS.delete(`oauth_state:${state}`);

  try {
    const tokens = await exchangeCode(env, code);
    await storeTokens(env, tokens.accessToken, tokens.refreshToken, tokens.patientId, tokens.expiresAt);
    await auditLog(env, 'operator', 'auth_callback', 'success', {
      detail: `Patient ID bound`,
    });
    return new Response(
      '<html><body>Authorization complete. You can close this tab.<br>Calcium monitoring is now active.</body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  } catch (err) {
    await auditLog(env, 'operator', 'auth_callback', 'error', {
      detail: err instanceof Error ? err.message : 'Token exchange failed',
    });
    return json({ error: 'Token exchange failed' }, 500);
  }
}

async function handleStatus(env: Env): Promise<Response> {
  const recent = await getRecentReadings(env, 1);
  const lastAlert = await env.DB.prepare(
    'SELECT * FROM alert_history ORDER BY fired_at DESC LIMIT 1'
  ).first();
  const tokenRow = await env.DB.prepare(
    'SELECT expires_at, updated_at FROM fhir_tokens WHERE id = ?'
  ).bind('singleton').first<{ expires_at: number; updated_at: number }>();

  await auditLog(env, 'operator', 'lab_pull', 'success', { resource: 'status' });

  return json({
    authorized: !!tokenRow,
    tokenExpiresAt: tokenRow ? new Date(tokenRow.expires_at).toISOString() : null,
    latestReading: recent[0] ?? null,
    latestAlert: lastAlert ?? null,
  });
}

async function handleReadings(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '10', 10), 100);
  const readings = await getRecentReadings(env, limit);
  await auditLog(env, 'operator', 'lab_pull', 'success', {
    resource: 'Observation',
    detail: `${readings.length} readings returned`,
  });
  return json(readings);
}

async function handleMedicationLog(request: Request, env: Env): Promise<Response> {
  let body: { medication: string; dose_mg?: number; taken?: boolean; device_id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const valid = ['calcitriol', 'calcium_carbonate'];
  if (!valid.includes(body.medication)) {
    return json({ error: `medication must be one of: ${valid.join(', ')}` }, 400);
  }

  const id = `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await env.DB.prepare(
    `INSERT INTO medication_log (id, medication, dose_mg, taken, device_id)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, body.medication, body.dose_mg ?? null, body.taken !== false ? 1 : 0, body.device_id ?? null).run();

  await auditLog(env, 'operator', 'medication_log', 'success', {
    detail: `${body.medication} logged`,
  });

  return json({ ok: true, id });
}

async function handleExport(env: Env): Promise<Response> {
  const bundle = await exportFHIRBundle(env);
  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      'Content-Type': 'application/fhir+json',
      'Content-Disposition': 'attachment; filename="p31-calcium-export.json"',
      ...CORS_HEADERS,
    },
  });
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
