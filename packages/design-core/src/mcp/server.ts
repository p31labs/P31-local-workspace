/**
 * @file P31 Design System MCP Server — stdio transport (local IDE use).
 *
 * Entry point for local AI agents (Claude Code, Cursor, Codex).
 * Uses the MCP SDK's StdioServerTransport.
 *
 * For HTTP/Cloudflare Workers deployment, see src/mcp/http-worker.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleToolCall } from './tools.js';
import { MCP_TOOLS, SERVER_NAME, SERVER_VERSION } from './tool-registry.js';

const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MCP_TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = handleToolCall(name, args);

  if (result.isError) {
    return {
      content: result.content,
      isError: true,
    };
  }

  return { content: result.content };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`P31 Design System MCP Server (${SERVER_NAME} v${SERVER_VERSION}) running on stdio`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
