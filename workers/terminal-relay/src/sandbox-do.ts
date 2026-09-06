import { DurableObject } from 'cloudflare:workers';
import { Sandbox } from '@cloudflare/sandbox';

interface Env {
  SANDBOX: DurableObjectNamespace;
  TERMINAL_DB: D1Database;
}

export class SandboxDO extends DurableObject<Env> {
  private sandbox: Sandbox | null = null;
  private sessionId: string;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sessionId = ctx.id.name || 'default';
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/ws/pty' || path === '/ws') {
      if (!this.sandbox) {
        this.sandbox = new Sandbox(this.ctx, this.env);
      }
      return this.sandbox.terminal(request);
    }

    if (path === '/health') {
      return new Response(JSON.stringify({
        ok: true,
        sessionId: this.sessionId,
        sandboxReady: !!this.sandbox,
      }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }
}
