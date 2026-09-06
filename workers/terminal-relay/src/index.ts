import { Sandbox } from '@cloudflare/sandbox';
import { SandboxDO } from './sandbox-do';

interface Env {
  SANDBOX: DurableObjectNamespace;
  TERMINAL_DB: D1Database;
}

export { SandboxDO };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/health') {
      return new Response(JSON.stringify({ ok: true, service: 'terminal-relay', version: '1.0.0' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    if (path === '/ws' || path === '/ws/pty') {
      const sessionId = url.searchParams.get('session') || 'default';
      const doId = env.SANDBOX.idFromName(sessionId);
      const stub = env.SANDBOX.get(doId);
      return stub.fetch(request);
    }

    return new Response(JSON.stringify({
      service: 'terminal-relay',
      endpoints: {
        '/ws': 'WebSocket connection to sandbox PTY (use ?session=id)',
        '/health': 'Health check',
      },
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  },
};
