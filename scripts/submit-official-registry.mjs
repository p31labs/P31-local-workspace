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

function buildEntry(server) {
  const tools = extractTools(server.workerDir);
  return {
    name: server.name,
    description: server.description,
    endpoint: server.endpoint,
    transport: server.transport,
    repository: server.repository,
    homepage: server.homepage,
    keywords: server.keywords,
    authentication: server.auth,
    tools: tools.map(t => ({ name: t.name, description: t.description })),
  };
}

function printForkAndPrWorkflow(server, entry) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Official MCP Registry PR — ${server.name}`);
  console.log('='.repeat(60));
  console.log(`\n# Step 1: Fork and clone the registry repo`);
  console.log(`git clone https://github.com/modelcontextprotocol/registry.git`);
  console.log(`cd registry`);
  console.log(`git checkout -b add-${server.name}\n`);
  console.log(`# Step 2: Add the entry file`);
  console.log(`# Create: servers/${server.name}.json\n`);
  console.log(JSON.stringify(entry, null, 2));
  console.log(`\n# Step 3: Commit and push`);
  console.log(`git add servers/${server.name}.json`);
  console.log(`git commit -m "Add ${server.name} to registry"`);
  console.log(`git push origin add-${server.name}\n`);
  console.log(`# Step 4: Open PR at:`);
  console.log(`https://github.com/modelcontextprotocol/registry/pulls\n`);
  console.log(`--- PR Description (copy-paste) ---\n`);
  console.log(`### ${server.name}`);
  console.log(`
**Endpoint:** ${server.endpoint}
**Transport:** ${server.transport}
**Tools:** ${entry.tools.length}
**Auth:** ${server.auth === 'none' ? 'None (public)' : server.auth}

This adds the \`${server.name}\` MCP server to the registry.

- Repository: ${server.repository}
- Homepage: ${server.homepage}
- Keywords: ${server.keywords.join(', ')}

#### Tools
${entry.tools.map(t => `- \`${t.name}\` — ${t.description}`).join('\n')}

#### Verification
\`\`\`bash
curl -sS ${server.endpoint} | jq .
\`\`\`
`);
}

for (const server of SERVERS) {
  const entry = buildEntry(server);
  printForkAndPrWorkflow(server, entry);
}

console.log('\nDone. No PRs were actually opened.\n');
