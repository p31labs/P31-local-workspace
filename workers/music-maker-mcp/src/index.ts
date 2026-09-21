/**
 * music-maker-mcp — Cloudflare Worker wrapper.
 *
 * Hosts the music-maker MCP server at /mcp. The tool handlers call the
 * music-presence worker over a SERVICE BINDING (env.MUSIC_PRESENCE), not a
 * public workers.dev fetch (which fails DNS 1042 between subdomains). The
 * fetcher is passed INTO createWorkerHandler so the server's tools use the
 * binding — no reliance on shared module state. The browser never sees this;
 * identity is carried inside the service call.
 */
import { createWorkerHandler } from '@p31/music-maker-mcp/server';

interface Env {
  /** Service binding to the music-presence worker. */
  MUSIC_PRESENCE: Fetcher;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return Response.json({ ok: true, service: 'music-maker-mcp' });
    }
    if (url.pathname !== '/mcp') {
      return new Response('not found', { status: 404 });
    }
// Route the tools' fetches through the service binding. Accept absolute
    // (default base) or relative inputs and route the PATH to the bound worker.
    // The Request for the binding must carry an ABSOLUTE URL (the binding's
    // own host), not a bare path — a relative Request throws "Invalid URL".
    const fetcher: typeof fetch = (input, init) => {
      const raw = String(input);
      const u = raw.startsWith('http') ? new URL(raw) : new URL(raw, 'https://music-presence.internal');
      return env.MUSIC_PRESENCE.fetch(new Request(`https://music-presence.internal${u.pathname}${u.search}`, init ?? {}));
    };
    const handler = await createWorkerHandler(fetcher);
    return handler(request);
  },
};