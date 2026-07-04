import { Hono } from 'hono';

export interface Env {
  phos_ai_proxy: Fetcher;
  jitterbug_api: Fetcher;
  k4_cage: Fetcher;
  genesis_spark: Fetcher;
  command_center?: Fetcher;
}

const allowedOrigins = [
  'https://phos.p31ca.org',
  'https://p31ca.org',
  'https://willow.p31ca.org',
  'https://bonding.p31ca.org',
  'https://phosphorus31.org',
];

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

app.use('/*', async (c, next) => {
  if (c.req.method === 'OPTIONS') {
    const origin = c.req.header('Origin') || '';
    return new Response(null, { headers: corsHeaders(origin) });
  }
  await next();
});

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

app.get('/api/mesh', async (c) => {
  const url = new URL(c.req.url);
  url.pathname = url.pathname.replace('/api/mesh', '/');
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

app.onError((err, c) => {
  console.error('gateway error', err);
  const origin = c.req.header('Origin') || '';
  return c.json({ ok: false, error: 'Gateway error' }, 500, { ...corsHeaders(origin) });
});

export default app;
