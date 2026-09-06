import { D1Database, R2Bucket, KVNamespace } from '@cloudflare/workers-types';
import router from './routes';
import { OrchestratorDO } from './orchestration-do';
import { DBClient } from './db';
import { timingSafeEqualStr } from './security';

// WebSocketPair is available globally in Cloudflare Workers runtime
declare const WebSocketPair: {
  new (): { 0: WebSocket; 1: WebSocket };
};

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  KV: KVNamespace;
  ORCHESTRATOR_DO: DurableObjectNamespace<OrchestratorDO>;
  PSK: string;
  OC_WEBHOOK_SECRET?: string;
  OC_API_BASE?: string;
  OC_PERSONAL_TOKEN?: string;
}

export { OrchestratorDO };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      return handleWebSocket(request, env);
    }
    return router.fetch(request, env);
  },

  async scheduled(event: ScheduledEvent, env: Env): Promise<Response> {
    if (event.cron === '0 0 * * *') {
      const db = new DBClient(env.DB);
      const deleted = await db.purgeExpired();
      console.log(`[jitterbug-api] Purged ${deleted} expired brain dumps`);
      return new Response(JSON.stringify({ purged: deleted }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (event.cron === '*/30 * * * *') {
      const bucket = env.R2_BUCKET;
      if (bucket) {
        const list = await bucket.list({ prefix: 'bubbles/' });
        const cutoff = Date.now() - (1 * 60 * 60 * 1000);
        let deleted = 0;
        for (const obj of list.objects) {
          if (obj.uploaded.getTime() < cutoff) {
            await bucket.delete(obj.key);
            deleted++;
          }
        }
        console.log(`[bubble-cleanup] Deleted ${deleted} expired bubbles`);
      }
      return new Response('OK');
    }
    return new Response('OK');
  },
};

async function handleWebSocket(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const brainDumpId = url.searchParams.get('id');
  const auth = request.headers.get('Authorization');
    const expected = `Bearer ${env.PSK}`;
    if (!brainDumpId || !timingSafeEqualStr(auth, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const pair = new WebSocketPair();
  const [client, server] = Object.values(pair);

  server.accept();
  server.addEventListener('message', async (event) => {
    try {
      const db = new DBClient(env.DB);
      const record = await db.getBrainDump(brainDumpId);
      if (!record) {
        server.send(JSON.stringify({ event: 'error', message: 'not found' }));
        server.close();
        return;
      }
      const payload = {
        event: 'status',
        data: {
          status: record.status,
          error: record.error,
          axes: record.axes_json ? JSON.parse(record.axes_json) : null,
          convergence: record.convergence_result_json ? JSON.parse(record.convergence_result_json) : null,
        },
      };
      server.send(JSON.stringify(payload));

      if (record.status === 'completed' || record.status === 'failed') {
        server.send(JSON.stringify({ event: 'done' }));
        server.close();
      }
    } catch (err) {
      server.send(JSON.stringify({ event: 'error', message: String(err) }));
      server.close();
    }
  });

  server.addEventListener('close', () => {
    console.log(`[ws] Connection closed for ${brainDumpId}`);
  });

  return new Response(null, { status: 101, webSocket: client });
}
