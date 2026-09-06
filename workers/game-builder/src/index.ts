import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  ROBLOX_BRIDGE_URL?: string;
  SHADOW_BRIDGE_URL?: string;
  ENVIRONMENT?: string;
  GAME_DB?: D1Database;
};

interface ToolDefinition {
  route: string;
  description: string;
  target: string;
  method: string;
  endpoint: string;
  input: Record<string, string>;
}

const TOOLS: ToolDefinition[] = [
  {
    route: 'worlds.create',
    description: 'Create a new game world (persisted to the shared love-ledger D1 via roblox-bridge)',
    target: 'roblox-bridge',
    method: 'POST',
    endpoint: '/worlds',
    input: { name: 'string (required)', description: 'string', creator_did: 'string' },
  },
  {
    route: 'worlds.list',
    description: 'List all worlds, newest first',
    target: 'roblox-bridge',
    method: 'GET',
    endpoint: '/worlds',
    input: {},
  },
  {
    route: 'worlds.get',
    description: 'Get a single world by id',
    target: 'roblox-bridge',
    method: 'GET',
    endpoint: '/worlds/:id',
    input: { id: 'string (required)' },
  },
  {
    route: 'love.balance',
    description: 'Read pending LOVE events for a user (consumes the shadow-bridge pending queue)',
    target: 'shadow-bridge',
    method: 'POST',
    endpoint: '/game/pending-love',
    input: { userId: 'string (required)' },
  },
  {
    route: 'love.mint_status',
    description: 'Read queued/pending LOVE, session state and player LOVE totals (non-consuming)',
    target: 'shadow-bridge',
    method: 'GET',
    endpoint: '/game/mint-status',
    input: { userId: 'string', sessionId: 'string (at least one required)' },
  },
  {
    route: 'love.queue',
    description: 'Queue a LOVE reward for a user (game action milestones)',
    target: 'shadow-bridge',
    method: 'POST',
    endpoint: '/game/action',
    input: { userId: 'string', sessionId: 'string', actionType: 'string' },
  },
  {
    route: 'love.mint',
    description: 'Mint LOVE for a user (forwards to shadow-bridge /game/mint-love)',
    target: 'shadow-bridge',
    method: 'POST',
    endpoint: '/game/mint-love',
    input: { userId: 'string (required)', amount: 'number > 0 (required)', reason: 'string', sessionId: 'string' },
  },
  {
    route: 'tools.list',
    description: 'List the available routes in this catalog',
    target: 'game-builder',
    method: 'POST',
    endpoint: '/route',
    input: {},
  },
];

const DEFAULT_ROBLOX_BRIDGE_URL = 'https://roblox-bridge.trimtab-signal.workers.dev';
const DEFAULT_SHADOW_BRIDGE_URL = 'https://shadow-bridge.trimtab-signal.workers.dev';

async function proxy(
  baseUrl: string,
  method: string,
  endpoint: string,
  payload?: Record<string, unknown>,
): Promise<{ status: number; body: unknown }> {
  let url = `${baseUrl}${endpoint}`;
  const { id, ...rest } = payload || {};
  if (endpoint.includes(':id')) {
    url = url.replace(':id', encodeURIComponent(String(id ?? '')));
  }
  if (method === 'GET') {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined) params.set(k, String(v));
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(rest),
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-game-id', 'x-player-did'],
  maxAge: 86400,
}));

app.get('/health', (c) => c.json({
  ok: true,
  service: 'game-builder',
  tools: TOOLS.length,
  roblox_bridge_configured: !!c.env.ROBLOX_BRIDGE_URL,
  shadow_bridge_configured: !!c.env.SHADOW_BRIDGE_URL,
  env: c.env.ENVIRONMENT || 'development',
}));

app.get('/tools', (c) => c.json({ tools: TOOLS }));

app.post('/route', async (c) => {
  const { route, payload } = await c.req.json<{ route?: string; payload?: Record<string, unknown> }>();
  if (!route) return c.json({ error: 'Missing route' }, 400);

  const tool = TOOLS.find(t => t.route === route);
  if (!tool) {
    return c.json({
      error: `Unknown route: ${route}`,
      available: TOOLS.map(t => t.route),
    }, 404);
  }

  if (route === 'tools.list') return c.json({ tools: TOOLS });

  const baseUrl = tool.target === 'roblox-bridge'
    ? (c.env.ROBLOX_BRIDGE_URL || DEFAULT_ROBLOX_BRIDGE_URL)
    : (c.env.SHADOW_BRIDGE_URL || DEFAULT_SHADOW_BRIDGE_URL);

  try {
    const { status, body } = await proxy(baseUrl, tool.method, tool.endpoint, payload || {});
    return Response.json({ ok: status < 400, route, target: tool.target, status, result: body }, { status });
  } catch (e: any) {
    return c.json({
      ok: false,
      route,
      target: tool.target,
      error: `${tool.target} unavailable: ${e.message}`,
    }, 502);
  }
});

export default app;
