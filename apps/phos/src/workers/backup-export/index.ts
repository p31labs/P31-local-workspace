import { logEvent } from '../../lib/edge/logging';

interface Env {
  LOVE_DB: D1Database;
  CONTRACTS_DB: D1Database;
  GOVERNANCE_DB: D1Database;
  BACKUP_BUCKET: R2Bucket;
  BACKUP_CRON_SECRET: string;
}

export default {
  async fetch(_req: Request, env: Env): Promise<Response> {
    if (_req.method !== 'POST') {
      return new Response('Use POST /backup or configure a scheduled trigger', { status: 405 });
    }

    const auth = _req.headers.get('Authorization');
    if (auth !== `Bearer ${env.BACKUP_CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const results: Record<string, string> = {};

    const dbs: { name: string; db: D1Database }[] = [
      { name: 'love-ledger', db: env.LOVE_DB },
      { name: 'contracts-db', db: env.CONTRACTS_DB },
      { name: 'governance-db', db: env.GOVERNANCE_DB },
    ];

    for (const { name, db } of dbs) {
      try {
        const dump = await db.dump();
        const blob = await dump.blob();
        const key = `${name}/${timestamp}.sql.gz`;
        await env.BACKUP_BUCKET.put(key, blob, {
          httpMetadata: { contentType: 'application/gzip' },
          customMetadata: { database: name, timestamp, exportedAt: new Date().toISOString() },
        });
        results[name] = `ok → ${key}`;
        logEvent({ event: 'backup_success', service: 'backup-export', success: true, data: { db: name, key } });
      } catch (err: any) {
        results[name] = `error: ${err?.message || String(err)}`;
        logEvent({ event: 'backup_failure', service: 'backup-export', success: false, error: err?.message, data: { db: name } });
      }
    }

    return new Response(JSON.stringify({ timestamp, results }, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<Response> {
    const req = new Request('http://internal/backup', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.BACKUP_CRON_SECRET}` },
    });
    return (this as any).fetch(req, env);
  },
};
