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
    if (url.pathname === '/.well-known/mcp/server-card.json') {
      return Response.json({
        $schema: 'https://schema.smithery.ai/server-card.json',
        name: 'music-maker-mcp',
        description: 'P31 Music Maker MCP — compose, arrange, and perform family music through the music-presence worker.',
        version: '0.0.1',
        serverInfo: { name: 'music-maker-mcp', version: '0.0.1' },
        endpoint: 'https://music-maker-mcp.trimtab-signal.workers.dev/mcp',
        transport: 'streamable-http',
        authentication: { type: 'none' },
        tools: [
          { name: 'music_observe', description: 'Read the spatial music maker composition — every zone with position, timbre, and name.' },
          { name: 'music_place', description: 'Place a new zone in the spatial music maker at a 3D position with a timbre.' },
          { name: 'music_clear', description: 'Remove a zone from the spatial music maker.' },
          { name: 'music_name', description: 'Rename a zone in the spatial music maker.' },
          { name: 'music_trigger', description: 'Trigger a zone — broadcast the live sound to family devices.' },
        ],
        resources: [],
        prompts: [],
      });
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