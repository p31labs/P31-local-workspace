/**
 * music-maker-mcp — Cloudflare Worker wrapper.
 *
 * Hosts the music-maker MCP server (the same tools in packages/music-maker-mcp
 * src/server.ts) at /mcp. The tool handlers call the DEPLOYED music-presence
 * worker over HTTP (music-tools.ts points MUSIC_API_URL at
 * https://music-presence.trimtab-signal.workers.dev by default), so this Worker
 * needs no D1/DO bindings — it's a stateless MCP relay over the music maker's
 * own API. The mcp-registry Worker discovers it here.
 *
 * The music_tools module is bundled from packages/music-maker-mcp/src.
 */
import { McpServer } from '@modelcontextprotocol/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/server';
import { z } from 'zod';
import * as music from '@p31/music-maker-mcp/music-tools';

// The tools' base URL. In production, the music-presence worker. Overridable
// via env for a local dev target.
const MUSIC_API = (env: Env) => env.MUSIC_API_URL ?? 'https://music-presence.trimtab-signal.workers.dev';

interface Env {
  MUSIC_API_URL?: string;
}

function registerTools(server: McpServer): void {
  server.registerTool(
    'music_observe',
    {
      description:
        'Read the spatial music maker composition — the family\u2019s score. Returns every zone with position, timbre, and name. Committed, provenance-tracked.',
      inputSchema: z.object({}),
    },
    async () => {
      const zones = await music.observe();
      return { content: [{ type: 'text', text: JSON.stringify(zones, null, 2) }] };
    },
  );
  server.registerTool(
    'music_place',
    {
      description:
        'Place a new zone at a 3D position with a timbre. COMMITTED — through the canon gate, seq-stamped, hash-chained.',
      inputSchema: z.object({
        position: z.array(z.number()).length(3),
        timbre: z.enum(['hydrogen', 'carbon', 'oxygen', 'phosphor']),
        name: z.string().optional(),
      }),
    },
    async ({ position, timbre, name }) => {
      const r = await music.place(position as [number, number, number], timbre, name);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    },
  );
  server.registerTool(
    'music_clear',
    {
      description: 'Remove a zone. COMMITTED — the removal is a log entry.',
      inputSchema: z.object({ zoneId: z.string() }),
    },
    async ({ zoneId }) => {
      const r = await music.clear(zoneId);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    },
  );
  server.registerTool(
    'music_name',
    {
      description: 'Rename a zone. COMMITTED — the name is part of the score.',
      inputSchema: z.object({ zoneId: z.string(), name: z.string() }),
    },
    async ({ zoneId, name }) => {
      const r = await music.name(zoneId, name);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    },
  );
  server.registerTool(
    'music_trigger',
    {
      description: 'Trigger a zone — EPHEMERAL, never persisted, broadcast live.',
      inputSchema: z.object({ zoneId: z.string() }),
    },
    async ({ zoneId }) => {
      const r = await music.trigger(zoneId);
      return { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }] };
    },
  );
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

    // Set the tools' base URL from env so the worker's fetch targets the
    // deployed music-presence worker (or a dev override).
    music.setBaseUrl(env.MUSIC_API_URL);

    const server = new McpServer({ name: 'music-maker-mcp', version: '0.0.1' });
    registerTools(server);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    return transport.handleRequest(request);
  },
};