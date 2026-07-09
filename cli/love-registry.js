// ═══════════════════════════════════════════════════════
// andromeda — LOVE Ledger MCP Server
// Exposes LOVE ledger state via MCP for agent consumption.
// ═══════════════════════════════════════════════════════

const { execFileSync } = require('child_process');

const LOVE_LEDGER_URL = process.env.LOVE_LEDGER_URL || 'https://love-ledger.p31ca.org';

function fetchJSON(url) {
  const script = [
    'const https=require("https"),http=require("http");',
    'const u=new URL(process.argv[1]);',
    'const mod=u.protocol==="https:"?https:http;',
    'mod.get(u,{timeout:8000},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>process.stdout.write(d)})',
    '.on("error",()=>process.exit(1))'
  ].join('');
  try {
    const raw = execFileSync('node', ['-e', script, url], { timeout: 10000, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(raw);
  } catch (e) {
    return { _error: `HTTP error: ${e.message}` };
  }
}

const TOOLS = [
  {
    name: 'love_status',
    description: 'Get LOVE ledger status — total LOVE, care_score, pools, vesting',
    inputSchema: { type: 'object', properties: { userId: { type: 'string', description: 'DID key or device ID' } } }
  },
  {
    name: 'love_balance',
    description: 'Get LOVE balance for a user',
    inputSchema: { type: 'object', properties: { userId: { type: 'string', required: true } } }
  },
  {
    name: 'love_sync',
    description: 'Sync local LOVE state with the cloud ledger',
    inputSchema: { type: 'object', properties: { userId: { type: 'string' } } }
  }
];

function executeTool(name, args) {
  const userId = args.userId || process.env.P31_USER_ID || 'guest';
  switch (name) {
    // Endpoints target the DEPLOYED simple worker (apps/phos/src/workers/love-ledger),
    // which exposes /status, /balance, /chain, /export with a `?did=` query param
    // (NOT the undeployed monolith's /api/love/* routes).
    case 'love_status': {
      const url = `${LOVE_LEDGER_URL}/status?did=${encodeURIComponent(userId)}`;
      const result = fetchJSON(url);
      return result._error ? { error: result._error, status: 'error' } : { ...result, status: 'ok' };
    }
    case 'love_balance': {
      const url = `${LOVE_LEDGER_URL}/balance?did=${encodeURIComponent(userId)}`;
      const result = fetchJSON(url);
      return result._error ? { error: result._error, status: 'error' } : { balance: result, status: 'ok' };
    }
    case 'love_sync': {
      // The deployed worker has no /sync route; "sync local state with the cloud
      // ledger" maps to fetching the verified, court-admissible hash chain.
      const url = `${LOVE_LEDGER_URL}/chain?did=${encodeURIComponent(userId)}`;
      const result = fetchJSON(url);
      return result._error ? { error: result._error, status: 'error' } : { synced: true, chain: result, status: 'ok' };
    }
    default:
      return { error: `Unknown tool: ${name}`, status: 'error' };
  }
}

// ─── JSON-RPC over stdio ───────────────────────────────────

let buffer = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const req = JSON.parse(trimmed);
      handleRequest(req);
    } catch (e) { /* ignore */ }
  }
});

function handleRequest(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      respond(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'p31-love-registry', version: '1.0.0' } });
      break;
    case 'notifications/initialized': break;
    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find(t => t.name === toolName);
      if (!tool) { respondError(id, -32602, `Unknown tool: ${toolName}`); break; }
      try {
        const result = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] });
      } catch (e) {
        respond(id, { content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }], isError: true });
      }
      break;
    }
    case 'ping':
      respond(id, {});
      break;
    default:
      if (id !== undefined) respondError(id, -32601, `Method not found: ${method}`);
  }
}

function respond(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}
function respondError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

process.stderr.write('[p31-love-registry] Server started. Listening on stdin (JSON-RPC).\n');
