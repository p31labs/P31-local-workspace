import type {
  DurableObjectState,
  DurableObjectStorage,
} from "@cloudflare/workers-types";

export interface AgentEnv {
  DB: D1Database;
  AI: Ai;
  ALERT_EMAIL: string;
  MAILCHANNELS_API: string;
}

export abstract class BaseAgent {
  protected state: DurableObjectState;
  protected storage: DurableObjectStorage;
  protected env: AgentEnv;

  constructor(state: DurableObjectState, env: AgentEnv) {
    this.state = state;
    this.storage = state.storage;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, CF-Access-Jwt-Assertion',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Enforce request size limit (10KB max for POST /init)
    const contentType = request.headers.get('Content-Type') || '';
    if (request.method === 'POST' && contentType.includes('application/json')) {
      const contentLength = request.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength) > 10240) {
        return new Response(JSON.stringify({ error: 'request_too_large', max_bytes: 10240 }), {
          status: 413,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    try {
      if (path === "/run" && request.method === "POST") {
        return this.handleRun(request);
      }
      if (path === "/status" && request.method === "GET") {
        return this.handleStatus();
      }
      if (path === "/init" && request.method === "POST") {
        return this.handleInit(request);
      }
      return new Response("Not found", { status: 404 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error(`Agent error: ${message}`);
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  protected abstract handleRun(request: Request): Promise<Response>;
  protected abstract handleInit(request: Request): Promise<Response>;

  protected async handleStatus(): Promise<Response> {
    const lastRun = await this.storage.get<string>("lastRun");
    const status = await this.storage.get<string>("status");
    const error = await this.storage.get<string>("error");

    return new Response(
      JSON.stringify({
        agent: this.constructor.name,
        lastRun: lastRun ?? null,
        status: status ?? "idle",
        error: error ?? null,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  protected async setRunning(): Promise<void> {
    await this.storage.put("status", "running");
    await this.storage.put("lastRun", new Date().toISOString());
    await this.storage.delete("error");
  }

  protected async setIdle(): Promise<void> {
    await this.storage.put("status", "idle");
  }

  protected async setError(message: string): Promise<void> {
    await this.storage.put("status", "error");
    await this.storage.put("error", message);
  }

  protected generateId(): string {
    return crypto.randomUUID();
  }
}
