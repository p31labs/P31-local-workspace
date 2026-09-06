import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE = path.resolve(__dirname, '..');

const SERVERS = [
  {
    slug: 'p31-design-mcp',
    workerDir: path.join(WORKSPACE, 'workers', 'design-mcp'),
    name: 'p31-design-mcp',
    description: 'P31 Design System MCP Server — Token resolution, component schemas, layout generation, icon search, UI auditing for the P31 quantum design system',
    endpoint: 'https://p31-design-mcp.trimtab-signal.workers.dev/mcp',
    transport: 'streamable-http',
    repository: 'https://github.com/p31labs/andromeda',
    homepage: 'https://p31ca.org',
    keywords: ['design-system', 'components', 'layout', 'tokens', 'ui-audit', 'p31', 'neuroinclusive'],
    auth: 'none',
  },
  {
    slug: 'p31-crypto-mcp',
    workerDir: path.join(WORKSPACE, 'workers', 'p31-crypto-mcp'),
    name: 'p31-crypto-mcp',
    description: 'P31 PQC Crypto MCP Server — ML-DSA-65 keygen/sign/verify, ML-KEM-768, SLH-DSA-128s, hybrid signatures, SD-JWT, x402 payment',
    endpoint: 'https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp',
    transport: 'streamable-http',
    repository: 'https://github.com/p31labs/andromeda',
    homepage: 'https://p31ca.org',
    keywords: ['post-quantum', 'cryptography', 'mldsa', 'mlkem', 'slhdsa', 'hybrid', 'sd-jwt', 'x402', 'p31'],
    auth: 'none',
  },
];

function extractTools(workerDir) {
  const srcPath = path.join(workerDir, 'src', 'index.ts');
  const content = fs.readFileSync(srcPath, 'utf8');

  const toolsStart = content.indexOf('const TOOLS = [');
  const toolsEnd = content.indexOf('// ─── Layout generator ───', toolsStart);
  const toolsSection = content.slice(toolsStart, toolsEnd);

  const tools = [];
  const regex = /name:\s*'([^']+)',\s*description:\s*'([^']+)'/g;
  let match;
  while ((match = regex.exec(toolsSection)) !== null) {
    tools.push({ name: match[1], description: match[2] });
  }
  return tools;
}

function buildPayload(server) {
  const tools = extractTools(server.workerDir);
  return {
    name: server.name,
    description: server.description,
    endpoint: server.endpoint,
    transport: server.transport,
    repository: server.repository,
    homepage: server.homepage,
    keywords: server.keywords,
    authentication: server.auth === 'none' ? 'None (public)' : server.auth,
    tools: tools.map(t => ({ name: t.name, description: t.description })),
  };
}

function printManualSteps(server, payload) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Glama Submission: ${server.name}`);
  console.log('='.repeat(60));
  console.log(`\n1. Open: https://glama.ai/mcp/servers/submit`);
  console.log(`\n2. Paste the following into the web form:\n`);
  console.log(`   Name:        ${payload.name}`);
  console.log(`   Description: ${payload.description}`);
  console.log(`   Endpoint:    ${payload.endpoint}`);
  console.log(`   Transport:   ${payload.transport}`);
  console.log(`   Repository:  ${payload.repository}`);
  console.log(`   Homepage:    ${payload.homepage}`);
  console.log(`   Keywords:    ${payload.keywords.join(', ')}`);
  console.log(`   Auth:        ${payload.authentication}`);
  console.log(`\n3. Tools (${payload.tools.length} total):`);
  for (const tool of payload.tools) {
    console.log(`   - ${tool.name}: ${tool.description}`);
  }
  console.log(`\n4. Submit the form.\n`);
}

function printCurl(server, payload) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Glama API Payload (JSON) — ${server.name}`);
  console.log('='.repeat(60));
  console.log(JSON.stringify(payload, null, 2));
  console.log(`\nIf Glama exposes an API endpoint, use:\n`);
  console.log(`curl -X POST https://glama.ai/api/mcp/servers \\`);
  console.log(`  -H 'Content-Type: application/json' \\`);
  console.log(`  -d '${JSON.stringify(payload).replace(/'/g, "'\\''")}'`);
  console.log(`\nNote: As of 2026-08, Glama uses a web form at`);
  console.log(`https://glama.ai/mcp/servers/submit — manual submission required.\n`);
}

for (const server of SERVERS) {
  const payload = buildPayload(server);
  printManualSteps(server, payload);
  printCurl(server, payload);
}

console.log('\nDone. No submissions were actually made.\n');
