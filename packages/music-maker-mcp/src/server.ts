#!/usr/bin/env node
/**
 * @p31/music-maker-mcp — src/server.ts
 *
 * The music maker's agent-facing surface. An MCP server exposing the spatial
 * instrument's actions as tools. Agents can observe the family's composition
 * and — with the same bounded autonomy every AAF agent has — place, clear,
 * name, and trigger zones. All committed writes go through the canon gate on
 * the worker; the live trigger is ephemeral and never persisted.
 *
 * The Loom's canon-mcp reads a local file log; the music maker's log lives in
 * D1 behind the worker. These tools call the worker's HTTP API. Same tools,
 * different transport (see music-tools.ts).
 *
 * Run: npm run start   (tsx, stdio transport)
 */
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import * as music from './music-tools';

export async function createServer(): Promise<McpServer> {
  const server = new McpServer({ name: 'music-maker-mcp', version: '0.0.1' });

  server.registerTool(
    'music_observe',
    {
      description:
        'Read the spatial music maker composition — the family\u2019s score. Returns every zone with its position, timbre, and name. Committed, provenance-tracked.',
      inputSchema: z.object({}),
    },
    async () => {
      const result = await music.observe();
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'music_place',
    {
      description:
        'Place a new zone in the spatial music maker at a 3D position with a timbre. COMMITTED — goes through the canon gate, seq-stamped, hash-chained. The family\u2019s arrangement is a replayable log entry.',
      inputSchema: z.object({
        position: z.array(z.number()).length(3).describe('[x, y, z] on the sphere'),
        timbre: z.enum(['hydrogen', 'carbon', 'oxygen', 'phosphor']).describe('the zone\u2019s sound'),
        name: z.string().optional().describe('a display name for the zone'),
      }),
    },
    async ({ position, timbre, name }) => {
      const result = await music.place(position as [number, number, number], timbre, name);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'music_clear',
    {
      description:
        'Remove a zone from the spatial music maker. COMMITTED — the removal is a log entry like any other composition change.',
      inputSchema: z.object({ zoneId: z.string().describe('the zone id to remove') }),
    },
    async ({ zoneId }) => {
      const result = await music.clear(zoneId);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'music_name',
    {
      description:
        'Rename a zone in the spatial music maker. COMMITTED — the name is part of the provenance-tracked score.',
      inputSchema: z.object({ zoneId: z.string(), name: z.string().describe('the new display name') }),
    },
    async ({ zoneId, name }) => {
      const result = await music.name(zoneId, name);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  server.registerTool(
    'music_trigger',
    {
      description:
        'Trigger a zone \u2014 the live act of it sounding. EPHEMERAL: broadcast to the other family members\u2019 devices, never persisted, never gated.',
      inputSchema: z.object({ zoneId: z.string() }),
    },
    async ({ zoneId }) => {
      const result = await music.trigger(zoneId);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    },
  );

  return server;
}

serveStdio(createServer);