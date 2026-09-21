#!/usr/bin/env node
/**
 * @p31/music-maker-mcp — src/stdio.ts
 *
 * The stdio entry point — the same tools as the HTTP server, for local agents
 * (Claude, LUMI, etc.) via the standard MCP stdio transport. Kept SEPARATE
 * from server.ts so importing the server (which the Cloudflare Worker uses)
 * never triggers the stdio side-effect — StdioServerTransport is unsupported
 * in Workers.
 *
 * Run: npm run start   (tsx, stdio transport)
 */
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server';

serveStdio(createServer);