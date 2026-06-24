/**
 * telemetry-worker — Cloudflare Worker
 *
 * Receives anonymous performance telemetry from Spaceship Earth.
 * Stores aggregated metrics in KV for analytics.
 *
 * Endpoints:
 *   POST /api/telemetry     — Event telemetry (existing, fire-and-forget)
 *   POST /api/telemetry/perf — Performance metrics (this worker)
 *
 * Privacy:
 *   - No PII collected (session ID is anonymous UUID)
 *   - No cookies
 *   - COPPA-compliant: kids mode blocked client-side before upload
 *   - Data retention: 30 days max
 *
 * Storage: Cloudflare KV namespace bound as TELEMETRY_KV
 */

import { VERSION } from './version';
import { ratelimit } from './rate-limiter';

/// <reference types="@cloudflare/workers-types" />

interface Env {
  TELEMETRY_KV: KVNamespace;
  ALLOWED_ORIGIN: string;
  RATE_LIMIT_KV?: KVNamespace;
}

interface PerformancePayload {
  sessionId: string;
  timestamp: number;
  metrics: {
    fps: number;
    fpsMin: number;
    fpsMax: number;
    memory: number | null;
  };
  device: {
    userAgent: string;
    screenResolution: string;
    dpr: number;
  };
}

interface TelemetryEvent {
  events: Array<{
    name: string;
    data: Record<string, unknown>;
    ts: number;
  }>;
}

function validatePerformancePayload(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'Invalid payload: expected object';
  const p = body as Record<string, unknown>;
  if (!p.sessionId || typeof p.sessionId !== 'string') return 'Invalid payload: sessionId required';
  if (!p.metrics || typeof p.metrics !== 'object') return 'Invalid payload: metrics required';
  return null;
}

function corsHeaders(origin: string, allowed: string): Record<string, string> {
  const isAllowed = origin === allowed
    || origin === 'http://localhost:4321'  // astro dev
    || origin === 'http://localhost:5173'   // vite dev
    || origin === 'http://localhost:3000';
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers });
    }

    const url = new URL(request.url);

    // Rate limit by IP
    const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateResult = await ratelimit(clientIp, env.RATE_LIMIT_KV);
    if (!rateResult.allowed) {
      return new Response(JSON.stringify({ error: 'Rate limited' }), {
        status: 429,
        headers: { ...headers, 'Retry-After': String(rateResult.retryAfter) },
      });
    }

    // Performance telemetry endpoint
    if (url.pathname === '/api/telemetry/perf' && request.method === 'POST') {
      try {
        const body = await request.json() as PerformancePayload;

        const validation = validatePerformancePayload(body);
        if (validation) {
          return Response.json({ error: validation }, { status: 400, headers });
        }

        // Store in KV with 30-day expiration
        const key = `perf:${body.sessionId}:${body.timestamp}`;
        await env.TELEMETRY_KV.put(key, JSON.stringify(body), { expirationTtl: 30 * 24 * 60 * 60 });

        // Also update daily aggregate (simple counter)
        const day = new Date(body.timestamp).toISOString().split('T')[0];
        const dailyKey = `daily:${day}:fps`;
        const existing = await env.TELEMETRY_KV.get(dailyKey);
        const count = existing ? parseInt(existing, 10) + 1 : 1;
        await env.TELEMETRY_KV.put(dailyKey, String(count), { expirationTtl: 35 * 24 * 60 * 60 });

        return Response.json({ ok: true }, { headers });

      } catch (e) {
        console.error('Telemetry error:', e);
        return Response.json({ error: 'Internal error' }, { status: 500, headers });
      }
    }

    // Event telemetry endpoint (simplified fire-and-forget)
    if (url.pathname === '/api/telemetry' && request.method === 'POST') {
      // Events are processed client-side with sendBeacon
      // This endpoint just acknowledges receipt
      return Response.json({ ok: true, note: 'Events buffered client-side' }, { headers });
    }

    // R05: Health endpoint — CWP-2026-014
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json({
        service: 'p31-telemetry',
        status: 'ok',
        version: VERSION,
        timestamp: new Date().toISOString(),
        bindings: ['TELEMETRY_KV'],
        routes: [
          'POST /api/telemetry/perf',
          'POST /api/telemetry',
          'GET  /health',
        ],
      }, { headers });
    }

    return Response.json({ error: 'Not found' }, { status: 404, headers });
  },
};
