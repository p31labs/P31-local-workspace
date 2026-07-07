import { Hono } from 'hono';

try {
  const Sentry = require('@sentry/cloudflare');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
  });
} catch {
  // Sentry optional
}

export interface Env {
  phos_ai_proxy: Fetcher;
  jitterbug_api: Fetcher;
  k4_cage: Fetcher;
  genesis_spark: Fetcher;
  command_center?: Fetcher;
  auth_service?: Fetcher;
}

const allowedOrigins = [
  'https://phos.p31ca.org',
  'https://p31ca.org',
  'https://willow.p31ca.org',
  'https://bonding.p31ca.org',
  'https://phosphorus31.org',
];

// In-memory rate limiting (per-isolate, best-effort)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  // Evict stale entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.reset) rateLimitMap.delete(key);
    }
  }
  return true;
}

function corsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  return headers;
}

const app = new Hono<{ Bindings: Env }>();

// Global rate limiting
app.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  if (!checkRateLimit(ip)) {
    return c.json({ error: 'Too many requests' }, 429);
  }
  await next();
});

app.use('/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    const origin = c.req.header('Origin') || '';
    return new Response(null, { headers: corsHeaders(origin) });
  }
  await next();
});

async function requireAuth(c: any, next: any) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    const origin = c.req.header('Origin') || '';
    return c.json({ error: 'Missing Authorization header' }, 401, { ...corsHeaders(origin) });
  }

  if (c.env.auth_service) {
    try {
      const verifyReq = new Request('https://auth.service/auth/session/verify', {
        method: 'POST',
        headers: { 'Authorization': auth, 'Content-Type': 'application/json' },
      });
      const res = await c.env.auth_service.fetch(verifyReq);
      if (!res.ok) {
        const origin = c.req.header('Origin') || '';
        return c.json({ error: 'Invalid or expired session' }, 401, { ...corsHeaders(origin) });
      }
    } catch {
      const origin = c.req.header('Origin') || '';
      return c.json({ error: 'Auth service unavailable' }, 503, { ...corsHeaders(origin) });
    }
  }

  await next();
}

app.use('/api/*', async (c, next) => {
  const method = c.req.method;
  const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

  if (!isWrite) {
    return next();
  }

  return requireAuth(c, next);
});

app.use('/ai/chat', requireAuth);
app.use('/v1/chat/completions', requireAuth);
app.use('/transcribe', requireAuth);

app.get('/api/health', (c) => {
  const origin = c.req.header('Origin') || '';
  return c.json({ ok: true, service: 'p31-gateway' }, 200, { ...corsHeaders(origin) });
});

app.post('/api/chat', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/chat', '/v1/chat/completions');
  const req = new Request(url, c.req.raw);
  const res = await c.env.phos_ai_proxy.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/v1/chat/completions', async (c) => {
  const res = await c.env.phos_ai_proxy.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/ai/chat', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = '/v1/chat/completions';
  const req = new Request(url, c.req.raw);
  const res = await c.env.phos_ai_proxy.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/transcribe', async (c) => {
  const res = await c.env.phos_ai_proxy.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.post('/jitterbug/brain-dump', async (c) => {
  const res = await c.env.jitterbug_api.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/jitterbug/brain-dump/:id/stream', async (c) => {
  const res = await c.env.jitterbug_api.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-store');
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/jitterbug/brain-dump/:id', async (c) => {
  const res = await c.env.jitterbug_api.fetch(c.req.raw);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/api/brain', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/brain', '/');
  const req = new Request(url, c.req.raw);
  const res = await c.env.jitterbug_api.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/api/mesh/*', async (c) => {
  const url = new URL(c.req.url);
  const suffix = c.req.param('*') || '';
  const path = suffix ? '/' + suffix : '/';
  if (path !== '/') {
    url.pathname = path;
  }
  const req = new Request(url, c.req.raw);
  const res = await c.env.k4_cage.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

app.get('/api/genesis', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/genesis', '/');
  const req = new Request(url, c.req.raw);
  const res = await c.env.genesis_spark.fetch(req);
  const origin = c.req.header('Origin') || '';
  const headers = new Headers(res.headers);
  Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
  return new Response(res.body, { status: res.status, headers });
});

// ─── PHOS Surfaces (public, read-only) ──────────────────────────────────────

const PHOS_SURFACES = [
  { id: 'CHAT', label: 'Gateway', icon: '✨', group: 'primary' },
  { id: 'DASHBOARD', label: 'Dashboard', icon: '⊞', group: 'primary' },
  { id: 'QUANTUM_BRAIN_DUMP', label: 'Brain Dump', icon: '🧠', group: 'primary' },
  { id: 'THE_BUFFER', label: 'Buffer', icon: '✎', group: 'primary' },
  { id: 'ARCHIVE', label: 'Archive', icon: '⚯', group: 'primary' },
  { id: 'HEARTH', label: 'Hearth', icon: '◈', group: 'primary' },
  { id: 'VAULT', label: 'Vault', icon: '◉', group: 'primary' },
  { id: 'LEDGER', label: 'Ledger', icon: '⊜', group: 'primary' },
  { id: 'OPEN_LEDGER', label: 'Open Ledger', icon: '◬', group: 'primary' },
  { id: 'BARTER', label: 'Barter', icon: '🔄', group: 'primary' },
  { id: 'GOVERNANCE', label: 'Governance', icon: '⚖️', group: 'primary' },
  { id: 'PASSPORT', label: 'Passport', icon: '🪪', group: 'primary' },
  { id: 'FEEDBACK', label: 'Feedback', icon: '⚑', group: 'primary' },
  { id: 'SANCTUARY', label: 'Sanctuary', icon: '◈', group: 'primary' },
  { id: 'ATTEST', label: 'Attest', icon: '⚮', group: 'primary' },
  { id: 'SETTINGS', label: 'Settings', icon: '⚙', group: 'secondary' },
  { id: 'ARCADE', label: 'Arcade', icon: '◇', group: 'secondary' },
  { id: 'BONDING', label: 'Bonding', icon: '⚛', group: 'secondary' },
  { id: 'GRID', label: 'Grid', icon: '⌗', group: 'secondary' },
  { id: 'COMPASS', label: 'Compass', icon: '⌖', group: 'secondary' },
  { id: 'NODE_ZERO', label: 'Node Zero', icon: '⊙', group: 'secondary' },
  { id: 'WAREHOUSE', label: 'Warehouse', icon: '▣', group: 'secondary' },
  { id: 'ONBOARDING', label: 'Docs & Onboarding', icon: '📘', group: 'primary' },
];

app.get('/api/phos/surfaces', (c) => {
  const origin = c.req.header('Origin') || '';
  return c.json({ surfaces: PHOS_SURFACES }, 200, corsHeaders(origin));
});

app.onError((err, c) => {
  console.error('gateway error', err);
  const origin = c.req.header('Origin') || '';
  return c.json({ ok: false, error: 'Gateway error' }, 500, { ...corsHeaders(origin) });
});

export default app;
