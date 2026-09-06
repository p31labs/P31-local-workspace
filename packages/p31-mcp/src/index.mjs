#!/usr/bin/env node
/**
 * P31 Vibe Coding MCP Server — Standalone MCP server with vibe tools.
 *
 * Tools:
 *   - vibe-generate: Generate P31-compliant code from a prompt
 *   - vibe-deploy: Deploy generated code to the P31 mesh
 *   - vibe-list: List deployed apps for a family
 *   - vibe-view: View a deployed app
 *
 * Usage:
 *   node packages/p31-mcp/src/index.mjs
 *   (reads JSON-RPC from stdin, writes to stdout)
 */

const APP_SUPERVISOR = 'https://app-supervisor.trimtab-signal.workers.dev';

const tools = {};

// Tool: vibe-generate
tools['vibe-generate'] = {
  name: 'vibe-generate',
  description: 'Generate P31-compliant HTML/CSS/JS from a natural language prompt using the P31 Vibe Coding Engine.',
  inputSchema: {
    type: 'object',
    properties: {
      prompt: { type: 'string', description: 'What to build. Describe it in natural language.' },
      tags: { type: 'string', description: 'Comma-separated: calm, playful, warm, minimal, dense, sparkly, cozy, bold' },
      age: { type: 'string', description: 'Target audience: child, youth, or adult' },
    },
    required: ['prompt'],
  },
};

// Tool: vibe-deploy
tools['vibe-deploy'] = {
  name: 'vibe-deploy',
  description: 'Deploy generated code to the P31 mesh. The app gets a live URL.',
  inputSchema: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'App name' },
      html: { type: 'string', description: 'HTML content' },
      css: { type: 'string', description: 'CSS content (optional)' },
      js: { type: 'string', description: 'JavaScript content (optional)' },
      family: { type: 'string', description: 'Family DID for tenant isolation' },
    },
    required: ['name', 'html'],
  },
};

// Tool: vibe-list
tools['vibe-list'] = {
  name: 'vibe-list',
  description: 'List all deployed apps for a family.',
  inputSchema: {
    type: 'object',
    properties: {
      family: { type: 'string', description: 'Family DID for tenant isolation' },
    },
  },
};

// Tool: vibe-view
tools['vibe-view'] = {
  name: 'vibe-view',
  description: 'View a deployed app by ID.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'App ID' },
    },
    required: ['id'],
  },
};

async function handleRequest(method, params) {
  const { prompt, tags, age, name, html, css, js, family, id } = params || {};

  switch (method) {
    case 'tools/list':
      return { tools: Object.values(tools).map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) };

    case 'tools/call':
      const toolName = params?.name;
      if (!toolName || !tools[toolName]) {
        return { content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }], isError: true };
      }

      switch (toolName) {
        case 'vibe-generate':
          return { content: [{ type: 'text', text: JSON.stringify({
            note: 'Vibe generation requires the PHOS gateway. Use the web UI at phos.p31ca.org/vibe for full pipeline.',
            usage: 'POST https://phos.p31ca.org/api/vibe/generate with { prompt, vibeTags, ageGroup }',
            prompt: prompt || 'No prompt provided',
          }, null, 2) }] };

        case 'vibe-deploy': {
          const res = await fetch(`${APP_SUPERVISOR}/apps/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Family-DID': family || 'mcp:default' },
            body: JSON.stringify({ name, html: html || '', css: css || '', js: js || '', creator: 'mcp-server' }),
          });
          const data = await res.json();
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }

        case 'vibe-list': {
          const headers = family ? { 'X-Family-DID': family } : {};
          const res = await fetch(`${APP_SUPERVISOR}/apps`, { headers });
          const data = await res.json();
          return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
        }

        case 'vibe-view': {
          const res = await fetch(`${APP_SUPERVISOR}/apps/${id}`);
          const text = await res.text();
          return { content: [{ type: 'text', text }] };
        }

        default:
          return { content: [{ type: 'text', text: JSON.stringify({ error: `Unknown tool: ${toolName}` }) }], isError: true };
      }

    case 'initialize':
      return {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'p31-vibe-mcp', version: '1.0.0' },
        capabilities: { tools: {} },
      };

    default:
      return { content: [{ type: 'text', text: JSON.stringify({ error: `Unknown method: ${method}` }) }], isError: true };
  }
}

// JSON-RPC over stdio
process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const request = JSON.parse(line);
      handleRequest(request.method, request.params).then((result) => {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, result }) + '\n');
      }).catch((err) => {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: request.id, error: { code: -1, message: err.message } }) + '\n');
      });
    } catch {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
    }
  }
});

console.error('P31 Vibe Coding MCP Server — Ready');
console.error(`Tools: ${Object.keys(tools).join(', ')}`);
