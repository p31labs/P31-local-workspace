/**
 * CWP-30 — SUPER-CENTAUR ↔ mesh Workers (production proxy).
 *
 * COPY TO: phosphorus31.org / SUPER-CENTAUR / src / mesh-bridge.ts
 * WIRE IN: super-centaur-server.ts — import { meshProxy } from './mesh-bridge';
 *          call meshProxy(this.app) at start of route registration (before local routes).
 *
 * In development (NODE_ENV !== 'production'): returns immediately — local handlers stay authoritative.
 *
 * NOTE: p31-bouncer currently exposes GET /health and /v1/gate — not POST /auth.
 *       Adjust auth proxy paths when the bouncer implements login, or point to your auth Worker.
 */

import type { Application, Request, Response } from 'express';

const log = (msg: string) => console.log(`[mesh-bridge] ${msg}`);

export const MESH = {
  agentHub: 'https://p31-agent-hub.trimtab-signal.workers.dev',
  cage: 'https://k4-cage.trimtab-signal.workers.dev',
  personal: 'https://k4-personal.trimtab-signal.workers.dev',
  hubs: 'https://k4-hubs.trimtab-signal.workers.dev',
  bouncer: 'https://p31-bouncer.trimtab-signal.workers.dev',
  chamber: 'https://reflective-chamber.trimtab-signal.workers.dev',
} as const;

type MeshTarget = keyof typeof MESH;

async function proxy(
  target: MeshTarget,
  path: string,
  method: string,
  body?: unknown,
  initHeaders?: Record<string, string>,
): Promise<{ status: number; data: unknown; rawText?: string }> {
  const url = `${MESH[target]}${path}`;
  log(`${method} ${url}`);
  const start = Date.now();
  try {
    const resp = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...(method !== 'GET' && method !== 'HEAD' ? { 'Content-Type': 'application/json' } : {}),
        ...initHeaders,
      },
      body: body != null && method !== 'GET' && method !== 'HEAD' ? JSON.stringify(body) : undefined,
    });
    const text = await resp.text();
    let data: unknown;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    log(`← ${resp.status} (${Date.now() - start}ms)`);
    return { status: resp.status, data, rawText: text };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    log(`✗ ${url}: ${message}`);
    return { status: 502, data: { error: 'mesh_unreachable', target, path, message } };
  }
}

function sendJson(res: Response, result: { status: number; data: unknown }) {
  return res.status(result.status).json(result.data);
}

/** Per-Worker liveness paths that exist in Andromeda today (worker root, not DO sub-routes). */
const FLEET_HEALTH_PATHS: Record<MeshTarget, string> = {
  bouncer: '/health',
  agentHub: '/api/health',
  cage: '/health',
  personal: '/health',
  hubs: '/health',
  chamber: '/health',
};

/**
 * Register production-only proxy routes. In dev, does nothing (local CENTAUR routes win).
 */
export function meshProxy(app: Application): void {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    log('development — mesh proxy routes not registered');
    return;
  }

  log('production — mesh proxy routes registered');

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    sendJson(res, await proxy('bouncer', '/auth', 'POST', req.body));
  });

  app.post('/api/auth/verify', async (req: Request, res: Response) => {
    sendJson(res, await proxy('bouncer', '/verify', 'POST', req.body));
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    sendJson(res, await proxy('agentHub', '/api/chat', 'POST', req.body));
  });

  app.post('/api/chat/clear', async (req: Request, res: Response) => {
    sendJson(res, await proxy('agentHub', '/api/clear', 'POST', req.body));
  });

  app.get('/api/spoons', async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'will';
    sendJson(res, await proxy('personal', `/agent/${encodeURIComponent(userId)}/energy`, 'GET'));
  });

  app.put('/api/spoons', async (req: Request, res: Response) => {
    const userId = (req.body?.userId as string) || 'will';
    sendJson(
      res,
      await proxy('personal', `/agent/${encodeURIComponent(userId)}/energy`, 'PUT', req.body),
    );
  });

  app.post('/api/bio', async (req: Request, res: Response) => {
    const userId = (req.body?.userId as string) || 'will';
    sendJson(res, await proxy('personal', `/agent/${encodeURIComponent(userId)}/bio`, 'POST', req.body));
  });

  app.post('/api/medical/log', async (req: Request, res: Response) => {
    const userId = (req.body?.userId as string) || 'will';
    const bioPayload = {
      type: req.body?.type || 'medical_event',
      value: req.body?.value,
      unit: req.body?.unit || 'event',
      source: 'centaur',
    };
    sendJson(
      res,
      await proxy('personal', `/agent/${encodeURIComponent(userId)}/bio`, 'POST', bioPayload),
    );
  });

  app.get('/api/state', async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'will';
    sendJson(res, await proxy('personal', `/agent/${encodeURIComponent(userId)}/state`, 'GET'));
  });

  app.put('/api/state', async (req: Request, res: Response) => {
    const userId = (req.body?.userId as string) || 'will';
    sendJson(
      res,
      await proxy('personal', `/agent/${encodeURIComponent(userId)}/state`, 'PUT', req.body),
    );
  });

  app.get('/api/reminders', async (req: Request, res: Response) => {
    const userId = (req.query.userId as string) || 'will';
    sendJson(res, await proxy('personal', `/agent/${encodeURIComponent(userId)}/reminders`, 'GET'));
  });

  app.post('/api/reminders', async (req: Request, res: Response) => {
    const userId = (req.body?.userId as string) || 'will';
    sendJson(
      res,
      await proxy('personal', `/agent/${encodeURIComponent(userId)}/reminders`, 'POST', req.body),
    );
  });

  app.get('/api/mesh', async (_req: Request, res: Response) => {
    sendJson(res, await proxy('cage', '/api/mesh', 'GET'));
  });

  app.get('/api/vertex/:id', async (req: Request, res: Response) => {
    sendJson(res, await proxy('cage', `/api/vertex/${encodeURIComponent(req.params.id)}`, 'GET'));
  });

  app.post('/api/presence/:id', async (req: Request, res: Response) => {
    sendJson(
      res,
      await proxy('cage', `/api/presence/${encodeURIComponent(req.params.id)}`, 'POST', req.body),
    );
  });

  app.post('/api/ping/:from/:to', async (req: Request, res: Response) => {
    sendJson(
      res,
      await proxy(
        'cage',
        `/api/ping/${encodeURIComponent(req.params.from)}/${encodeURIComponent(req.params.to)}`,
        'POST',
        req.body,
      ),
    );
  });

  app.get('/api/telemetry', async (req: Request, res: Response) => {
    const limit = (req.query.limit as string) || (req.query.count as string) || '50';
    sendJson(res, await proxy('cage', `/api/telemetry?limit=${encodeURIComponent(limit)}`, 'GET'));
  });

  app.post('/api/synthesis/weekly', async (_req: Request, res: Response) => {
    sendJson(res, await proxy('chamber', '/synthesize', 'POST'));
  });

  app.get('/api/fleet/health', async (_req: Request, res: Response) => {
    const checks = await Promise.all(
      (Object.keys(MESH) as MeshTarget[]).map(async (name) => {
        const baseUrl = MESH[name];
        const path = FLEET_HEALTH_PATHS[name];
        const start = Date.now();
        try {
          const ctrl = new AbortController();
          const t = setTimeout(() => ctrl.abort(), 5000);
          const r = await fetch(`${baseUrl}${path}`, { signal: ctrl.signal });
          clearTimeout(t);
          return { name, path, status: r.ok ? 'up' : 'down', http: r.status, ms: Date.now() - start };
        } catch {
          return { name, path, status: 'down', ms: Date.now() - start };
        }
      }),
    );
    const allUp = checks.every((c) => c.status === 'up');
    res.json({ status: allUp ? 'all_up' : 'degraded', workers: checks, timestamp: Date.now() });
  });

  log(`registered ${Object.keys(MESH).length} worker targets + routes`);
}
