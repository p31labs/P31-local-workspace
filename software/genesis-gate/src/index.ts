// ═══════════════════════════════════════════════════════
// genesis-gate — P31 Labs
// Central telemetry event bus for the P31 ecosystem.
//
// CWP-2026-014 R07
//
// Routes:
//   POST /event              → ingest a telemetry event
//   GET  /events?since=<ts>  → read event feed (auth required)
//   GET  /health             → service health
//
// Event schema:
//   { source, type, payload, timestamp, session_id }
//
// Storage: Cloudflare KV, 30-day TTL
//   Key: event:<timestamp_ms>:<random4>
//   Index: index:<YYYY-MM-DD>  → array of keys (rebuilt on read)
//
// Governance hooks (fire-and-forget):
//   - error rate > governance_ERROR_THRESHOLD / governance_WINDOW_SECONDS
//     → logs alert (future: POST to Discord webhook)
//   - spoon_decay event with tier=MINIMAL → alert
//   - fawn_guard_trigger → alert
// ═══════════════════════════════════════════════════════

export interface Env {
  EVENTS_KV: KVNamespace;
  ALLOWED_ORIGINS: string;
  EVENT_TTL_DAYS: string;
  MAX_PAYLOAD_BYTES: string;
  governance_ERROR_THRESHOLD: string;
  governance_WINDOW_SECONDS: string;
  ADMIN_TOKEN?: string;
  DISCORD_WEBHOOK_URL?: string;
}

// ── Valid event types ──────────────────────────────────────────────────────

const VALID_TYPES = new Set([
  'page_view',
  'app_launch',
  'code_run',
  'spoon_decay',
  'fawn_guard_trigger',
  'larmor_activation',
  'donation',
  'donation_initiated',
  'donation_processed',
  'kofi_donation',
  'error',
  'health_check',
  'build_result',
  'relay_message',
  'mesh_init',
  'mesh_aggregate',
  'social_post',
  'game_start',
  'molecule_complete',
  'ping_sent',
  'session_end',
  'breathing_start',
  'frequency_change',
  'typing_test_complete',
  'quest_complete',
  'game_played',
]);

// ── CORS ──────────────────────────────────────────────────────────────────

function corsHeaders(origin: string, allowedOrigins: string): Record<string, string> {
  const allowed = allowedOrigins.split(',').map(s => s.trim());
  const isAllowed = allowed.includes(origin)
    || origin.startsWith('http://localhost:')
    || origin.startsWith('http://127.0.0.1:');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : (allowed[0] ?? '*'),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(body: unknown, status = 200, cors: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

// ── Event ingestion ────────────────────────────────────────────────────────

interface P31Event {
  source: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string; // ISO 8601
  session_id: string;
}

function makeEventKey(tsMs: number): string {
  const rand = Math.random().toString(36).slice(2, 6);
  return `event:${tsMs}:${rand}`;
}

async function ingestEvent(event: P31Event, env: Env): Promise<void> {
  const ttlSeconds = parseInt(env.EVENT_TTL_DAYS || '30', 10) * 24 * 60 * 60;
  const tsMs = new Date(event.timestamp).getTime() || Date.now();
  const key = makeEventKey(tsMs);
  await env.EVENTS_KV.put(key, JSON.stringify(event), { expirationTtl: ttlSeconds });
}

// ── Event feed ─────────────────────────────────────────────────────────────

async function readEvents(since: number, env: Env, limit = 500): Promise<P31Event[]> {
  // KV list is lexicographic; keys are event:<tsMs>:<rand>
  // List with prefix="event:" and filter by timestamp prefix
  const sinceKey = `event:${since}:`;
  const result = await env.EVENTS_KV.list({ prefix: 'event:', limit: 1000 });

  const keys = result.keys
    .filter(k => k.name >= sinceKey)
    .slice(0, limit)
    .map(k => k.name);

  const events: P31Event[] = [];
  for (const key of keys) {
    const raw = await env.EVENTS_KV.get(key);
    if (raw) {
      try { events.push(JSON.parse(raw) as P31Event); } catch { /* skip corrupt */ }
    }
  }

  return events.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

// ── Governance hooks ────────────────────────────────────────────────────────

async function runGovernanceHooks(event: P31Event, env: Env): Promise<void> {
  const alerts: string[] = [];

  // Spoon decay to MINIMAL
  if (event.type === 'spoon_decay' && event.payload?.tier === 'MINIMAL') {
    alerts.push(`[governance] MINIMAL spoon tier — source: ${event.source} session: ${event.session_id}`);
  }

  // Fawn guard trigger
  if (event.type === 'fawn_guard_trigger') {
    alerts.push(`[governance] Fawn Guard triggered — source: ${event.source}`);
  }

  // Error rate: read last-minute error count from KV
  if (event.type === 'error') {
    const windowS = parseInt(env.governance_WINDOW_SECONDS || '60', 10);
    const threshold = parseInt(env.governance_ERROR_THRESHOLD || '5', 10);
    const windowKey = `errcount:${Math.floor(Date.now() / (windowS * 1000))}`;
    const current = parseInt((await env.EVENTS_KV.get(windowKey)) ?? '0', 10);
    const next = current + 1;
    await env.EVENTS_KV.put(windowKey, String(next), { expirationTtl: windowS * 2 });
    if (next >= threshold) {
      alerts.push(`[governance] ERROR RATE ALERT: ${next} errors in ${windowS}s — source: ${event.source}`);
    }
  }

  for (const alert of alerts) {
    console.warn(alert);
    if (env.DISCORD_WEBHOOK_URL) {
      // Fire-and-forget — don't await
      fetch(env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `🔴 P31 Governance Alert\n\`\`\`\n${alert}\n\`\`\`` }),
      }).catch(() => { /* ignore */ });
    }
  }
}

// ── Main fetch handler ─────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS ?? '*');
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    // ── POST /event — ingest ───────────────────────────────────────────────
    if (path === '/event' && method === 'POST') {
      const maxBytes = parseInt(env.MAX_PAYLOAD_BYTES || '4096', 10);
      const contentLength = parseInt(request.headers.get('Content-Length') ?? '0', 10);
      if (contentLength > maxBytes) {
        return json({ error: 'Payload too large' }, 413, cors);
      }

      let body: Partial<P31Event>;
      try {
        body = await request.json() as Partial<P31Event>;
      } catch {
        return json({ error: 'Invalid JSON' }, 400, cors);
      }

      // Validate required fields
      if (!body.source || !body.type || !body.session_id) {
        return json({ error: 'Missing required fields: source, type, session_id' }, 400, cors);
      }

      // Validate event type (warn but still accept unknown types for forward-compat)
      const eventType = body.type;
      if (!VALID_TYPES.has(eventType)) {
        console.warn(`[genesis-gate] Unknown event type: ${eventType}`);
      }

      const event: P31Event = {
        source: String(body.source).slice(0, 64),
        type: String(body.type).slice(0, 64),
        payload: (body.payload && typeof body.payload === 'object') ? body.payload : {},
        timestamp: body.timestamp ?? new Date().toISOString(),
        session_id: String(body.session_id).slice(0, 128),
      };

      // Store and run governance hooks concurrently
      await Promise.all([
        ingestEvent(event, env),
        runGovernanceHooks(event, env),
      ]);

      return json({ ok: true, timestamp: event.timestamp }, 201, cors);
    }

    // ── GET /events — feed ─────────────────────────────────────────────────
    if (path === '/events' && method === 'GET') {
      // Auth: require ADMIN_TOKEN or open if not set
      if (env.ADMIN_TOKEN) {
        const auth = request.headers.get('Authorization');
        if (auth !== `Bearer ${env.ADMIN_TOKEN}`) {
          return json({ error: 'Unauthorized' }, 401, cors);
        }
      }

      const sinceParam = url.searchParams.get('since');
      const limitParam = url.searchParams.get('limit');
      const since = sinceParam ? new Date(sinceParam).getTime() : Date.now() - 3600_000; // default 1h
      const limit = Math.min(parseInt(limitParam ?? '500', 10), 1000);

      if (isNaN(since)) {
        return json({ error: 'Invalid since parameter' }, 400, cors);
      }

      const events = await readEvents(since, env, limit);
      return json({
        events,
        count: events.length,
        since: new Date(since).toISOString(),
        generated_at: new Date().toISOString(),
      }, 200, cors);
    }

    // ── GET /health ────────────────────────────────────────────────────────
    if (path === '/health' && method === 'GET') {
      return json({
        service: 'genesis-gate',
        status: 'ok',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        bindings: ['EVENTS_KV'],
        routes: [
          'POST /event',
          'GET  /events?since=<iso_timestamp>&limit=<n>',
          'GET  /health',
        ],
        event_types: [...VALID_TYPES],
      }, 200, cors);
    }

    return json({ error: 'Not found' }, 404, cors);
  },
};
