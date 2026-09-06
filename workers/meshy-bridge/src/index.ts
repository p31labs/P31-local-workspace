interface Env {
  MESHY_API_KEY?: string;
  MESHY_BASE_URL: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

function requireKey(env: Env): Response | null {
  if (!env.MESHY_API_KEY) return json({ error: 'MESHY_API_KEY not configured. Run: wrangler secret put MESHY_API_KEY' }, 503);
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') return json({}, 204);

    if (path === '/health') {
      return json({ ok: true, service: 'meshy-bridge', version: '2.0.0', apiConfigured: !!env.MESHY_API_KEY, baseUrl: env.MESHY_BASE_URL });
    }

    const missing = requireKey(env);
    if (missing) return missing;

    const headers = { 'Authorization': `Bearer ${env.MESHY_API_KEY}`, 'Content-Type': 'application/json' };

    if (path === '/generate' && method === 'POST') {
      try {
        const body = await request.json() as { prompt: string; artStyle?: string; resolution?: string };
        if (!body.prompt) return json({ error: 'prompt required' }, 400);
        const res = await fetch(`${env.MESHY_BASE_URL}/v2/text-to-3d`, {
          method: 'POST', headers,
          body: JSON.stringify({ prompt: body.prompt, art_style: body.artStyle || 'low-poly', export_format: 'stl', resolution: body.resolution || '1024' }),
        });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === '/image-to-3d' && method === 'POST') {
      try {
        const body = await request.json() as { imageUrl: string };
        if (!body.imageUrl) return json({ error: 'imageUrl required' }, 400);
        const res = await fetch(`${env.MESHY_BASE_URL}/v2/image-to-3d`, {
          method: 'POST', headers,
          body: JSON.stringify({ image_url: body.imageUrl, export_format: 'stl' }),
        });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === '/status' && method === 'POST') {
      try {
        const body = await request.json() as { taskId: string };
        if (!body.taskId) return json({ error: 'taskId required' }, 400);
        const res = await fetch(`${env.MESHY_BASE_URL}/v2/text-to-3d/${body.taskId}`, { headers });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === '/models' && method === 'GET') {
      try {
        const res = await fetch(`${env.MESHY_BASE_URL}/v2/models`, { headers });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === '/print/analyze' && method === 'POST') {
      try {
        const body = await request.json() as { inputTaskId?: string; modelUrl?: string };
        if (!body.inputTaskId && !body.modelUrl) return json({ error: 'inputTaskId or modelUrl required' }, 400);
        const payload: any = {};
        if (body.inputTaskId) payload.input_task_id = body.inputTaskId;
        if (body.modelUrl) payload.model_url = body.modelUrl;
        const res = await fetch(`${env.MESHY_BASE_URL}/openapi/v1/print/analyze`, { method: 'POST', headers, body: JSON.stringify(payload) });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === '/print/repair' && method === 'POST') {
      try {
        const body = await request.json() as { inputTaskId?: string; modelUrl?: string };
        if (!body.inputTaskId && !body.modelUrl) return json({ error: 'inputTaskId or modelUrl required' }, 400);
        const payload: any = {};
        if (body.inputTaskId) payload.input_task_id = body.inputTaskId;
        if (body.modelUrl) payload.model_url = body.modelUrl;
        const res = await fetch(`${env.MESHY_BASE_URL}/openapi/v1/print/repair`, { method: 'POST', headers, body: JSON.stringify(payload) });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path === '/print/multi-color' && method === 'POST') {
      try {
        const body = await request.json() as { inputTaskId?: string; modelUrl?: string; maxColors?: number };
        if (!body.inputTaskId && !body.modelUrl) return json({ error: 'inputTaskId or modelUrl required' }, 400);
        const payload: any = { max_colors: body.maxColors || 4 };
        if (body.inputTaskId) payload.input_task_id = body.inputTaskId;
        if (body.modelUrl) payload.model_url = body.modelUrl;
        const res = await fetch(`${env.MESHY_BASE_URL}/openapi/v1/print/multi-color`, { method: 'POST', headers, body: JSON.stringify(payload) });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    if (path.startsWith('/print/') && method === 'GET') {
      const taskId = path.split('/').pop();
      try {
        const res = await fetch(`${env.MESHY_BASE_URL}/openapi/v1/print/${taskId}`, { headers });
        return json(await res.json());
      } catch (e: any) { return json({ error: e.message }, 500); }
    }

    return json({
      error: 'Not found',
      endpoints: [
        'POST /generate', 'POST /image-to-3d', 'POST /status',
        'GET /models', 'POST /print/analyze', 'POST /print/repair',
        'POST /print/multi-color', 'GET /print/:taskId', 'GET /health',
      ],
    }, 404);
  },
};
