import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getK4VertexFromPath, K4_VERTICES, type SwarmEnv } from './topology';

const app = new Hono<{ Bindings: SwarmEnv }>();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'], allowHeaders: ['Content-Type', 'Authorization'] }));

app.get('/health', (c) => c.json({ status: 'ok', worker: 'swarm-router', k4_vertices: K4_VERTICES, timestamp: new Date().toISOString() }));

app.get('/k4/topology', (c) => c.json({ vertices: K4_VERTICES, edges_count: 6, fully_connected: true }));

app.post('/api/agent/*', async (c) => {
  const req = new Request(c.req.raw.url, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.raw.body,
    redirect: 'manual',
  });
  return c.env.AGENT_RUNTIME.get(c.env.AGENT_RUNTIME.idFromName('default')).fetch(req);
});

app.post('/api/tool/*', async (c) => {
  return c.env.GATEWAY.fetch(c.req.raw);
});

app.post('/api/dispatch/*', async (c) => {
  return c.env.GATEWAY.fetch(c.req.raw);
});

app.all('/mcp/*', async (c) => {
  return c.env.GATEWAY.fetch(c.req.raw);
});

app.all('/dispatch/*', async (c) => {
  return c.env.GATEWAY.fetch(c.req.raw);
});

export default app;
