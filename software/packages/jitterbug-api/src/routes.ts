import { Router } from 'itty-router';
import { BrainDumpSchema } from '@p31/brain-dump-orchestrator';
import { DBClient } from './db';
import type { Env } from './index';

const router = Router();

const jsonResponse = (data: any, status = 200, extraHeaders: Record<string, string> = {}) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
};

const withCORS = (handler: (request: Request, env: Env) => Response | Promise<Response>) => {
  return async (request: Request, env: Env) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    const auth = request.headers.get('Authorization');
    const expected = `Bearer ${env.PSK}`;
    if (!auth || auth !== expected) {
      return jsonResponse({ error: 'Unauthorized', details: 'Missing or invalid Bearer token' }, 401);
    }

    try {
      const response = await handler(request, env);
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };

      if (response.headers) {
        Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
      }

      return response;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return jsonResponse({ error: 'Internal error', details: msg }, 500);
    }
  };
};

const pskRouter = Router();

pskRouter.get('/health', async (request, env) => {
  const checks: Record<string, string> = {
    timestamp: new Date().toISOString(),
  };
  
  try {
    if (env.DB) {
      const result = await env.DB.prepare('SELECT 1 AS ok').first();
      checks.db = result ? 'ok' : 'error';
    } else {
      checks.db = 'unavailable';
    }
  } catch (err) {
    checks.db = `error: ${err instanceof Error ? err.message : String(err)}`;
  }
  
  try {
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.list({ limit: 1 });
      checks.r2 = 'ok';
    } else {
      checks.r2 = 'unavailable';
    }
  } catch (err) {
    checks.r2 = `error: ${err instanceof Error ? err.message : String(err)}`;
  }
  
  try {
    if (env.KV) {
      await env.KV.get('__health_check__', 'text');
      checks.kv = 'ok';
    } else {
      checks.kv = 'unavailable';
    }
  } catch (err) {
    checks.kv = `error: ${err instanceof Error ? err.message : String(err)}`;
  }
  
  const overall = Object.values(checks).every(v => v === 'ok') ? 'ok' : 'degraded';
  
  return new Response(JSON.stringify({ status: overall, checks }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

pskRouter.get('/brain-dumps', async (request, env) => {
  const db = new DBClient(env.DB);
  const results = await db.listRecent(20);
  return jsonResponse(results);
});

pskRouter.post('/brain-dump', async (request, env) => {
  const body = await request.json();
  const result = BrainDumpSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error }), { status: 400 });
  }
  const { projectName, coreProblem, constraints, desiredEndState, knownAssets, openQuestions } = result.data;
  const recursive = (body as any).recursive;

  const db = new DBClient(env.DB);
  const id = await db.createBrainDump({
    project_name: projectName,
    core_problem: coreProblem,
    constraints_json: JSON.stringify(constraints),
    assets_json: JSON.stringify(knownAssets),
    questions_json: JSON.stringify(openQuestions),
    desired_end_state_json: JSON.stringify(desiredEndState),
    depth: 0,
    parent_id: null,
    lineage: JSON.stringify([]),
    is_atomic: false,
    batch_strategy: recursive?.batchStrategy ?? 'depth-first',
    max_depth: recursive?.maxDepth ?? 3,
  });

  const doId = env.ORCHESTRATOR_DO.idFromName(id);
  const doStub = env.ORCHESTRATOR_DO.get(doId);
  await doStub.startOrchestration(id);

  return new Response(JSON.stringify({ id }), { status: 202 });
});

pskRouter.get('/brain-dump/:id', async (request, env) => {
  const { id } = request.params;
  const db = new DBClient(env.DB);
  const record = await db.getBrainDump(id);
  if (!record) {
    return jsonResponse({ error: 'Not found', details: `Brain dump ${id} does not exist` }, 404);
  }

  let axes: any = null;
  if (record.axes_json) {
    try { axes = JSON.parse(record.axes_json); } catch { axes = null; }
  }
  let convergence: any = null;
  if (record.convergence_result_json) {
    try { convergence = JSON.parse(record.convergence_result_json); } catch { convergence = null; }
  }

  return jsonResponse({
    ...record,
    axes,
    convergence,
  });
});

pskRouter.get('/brain-dump/:id/status', async (request, env) => {
  try {
    const { id } = request.params;
    const cacheKey = `status:${id}`;

    if (env.KV) {
      const cached = await env.KV.get(cacheKey, 'json');
      if (cached) {
        return jsonResponse(cached, 200, { 'X-Cache': 'HIT' });
      }
    }

    const db = new DBClient(env.DB);
    const record = await db.getBrainDump(id);
    if (!record) {
      return jsonResponse({ error: 'Not found', details: `Brain dump ${id} does not exist` }, 404);
    }

    const payload = {
      id,
      status: record.status,
      error: record.error,
      axes: record.axes_json ? JSON.parse(record.axes_json) : null,
      convergence: record.convergence_result_json ? JSON.parse(record.convergence_result_json) : null,
    };

    if (env.KV) {
      await env.KV.put(cacheKey, JSON.stringify(payload), { expirationTtl: 60 });
    }

    return jsonResponse(payload, 200, { 'X-Cache': 'MISS' });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Internal error', details: msg }, 500);
  }
});

pskRouter.get('/brain-dump/:id/stream', async (request, env) => {
  const { id } = request.params;
  const db = new DBClient(env.DB);

  let intervalId: number;
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = async () => {
        let r: any;
        if (env.KV) {
          const cached = await env.KV.get(`status:${id}`, 'json');
          if (cached) {
            r = { status: (cached as any).status, error: (cached as any).error, axes: (cached as any).axes, convergence: (cached as any).convergence };
          } else {
            r = await db.getBrainDump(id);
          }
        } else {
          r = await db.getBrainDump(id);
        }

        if (!r) {
          controller.enqueue(encoder.encode('data: {"event":"error","message":"not found"}\n\n'));
          controller.close();
          return;
        }
        const data = {
          event: 'status',
          data: {
            status: r.status,
            error: r.error,
            axes: r.axes_json ? JSON.parse(r.axes_json) : null,
            convergence: r.convergence_result_json ? JSON.parse(r.convergence_result_json) : null,
          },
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));

        if (r.status === 'completed' || r.status === 'failed') {
          controller.enqueue(encoder.encode('data: {"event":"done"}\n\n'));
          controller.close();
          clearInterval(intervalId);
        }
      };

      send();
      intervalId = setInterval(send, 5000);
    },
    cancel() {
      if (intervalId) clearInterval(intervalId);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
});

pskRouter.post('/partition/recover', async (request, env) => {
  const db = new DBClient(env.DB);
  const stuck = await db.findStuckBrainDumps(10, 10);
  let resetCount = 0;
  for (const record of stuck) {
    await db.resetBrainDump(record.id);
    if (env.KV) {
      await env.KV.delete(`status:${record.id}`).catch(() => {});
    }
    resetCount++;
  }

  return jsonResponse({
    success: true,
    message: `Partition recovery initiated: ${resetCount} records reset to pending`,
    affected: resetCount,
  });
});

router.all('/*', withCORS(async (request, env) => {
  return pskRouter.fetch(request, env);
}));

export default router;
