// L3.4 backend configuration — the 4 hand-rolled MCP stdio servers the
// x402 Worker (L3.2) fronts. The bridge spawns these as supervised
// child processes and exposes them over MCP Streamable HTTP.
//
// mode 'stream': persistent child, line-delimited JSON-RPC (Oasis/Registry/LOVE).
// mode 'batch' : PHOS Forge reads stdin until 'end' then responds once
//               (spawned fresh per request, stdin closed after write).
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function findRepoRoot(from) {
  let dir = from;
  for (let i = 0; i < 12; i++) {
    if (existsSync(resolve(dir, 'cli/mcp-server.js'))) return dir;
    const parent = resolve(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return dir;
}

export const REPO_ROOT = findRepoRoot(dirname(fileURLToPath(import.meta.url)));

export const BACKENDS = [
  { id: 'oasis', cmd: 'node', args: ['cli/mcp-server.js'], mode: 'stream' },
  { id: 'registry', cmd: 'node', args: ['cli/component-registry.js'], mode: 'stream' },
  { id: 'love', cmd: 'node', args: ['cli/love-registry.js'], mode: 'stream' },
  { id: 'phosforge', cmd: 'node', args: ['tools/phos-forge/mcp-server.mjs'], mode: 'batch', optional: true },
];
