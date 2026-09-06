#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// GROUND-TRUTH — Canonical Verified-Facts Registry Expert
// Serves the P31 ground-truth facts registry (~/p31-agents/ground-truth.json):
// verified facts with evidence, file maps (real vs hallucinated), toolchain
// invariants, design tokens, layout gates, care-score weights, and MCP
// inventory. Also reads the crew manifest (~/p31-agents/manifest.yaml).
// Zero external dependencies. Stdio JSON-RPC pattern mirrors bob-server.js /
// marge-server.js (stateless MCP 2026-07-28).
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

const AGENTS_ROOT = path.resolve(process.env.HOME || '/home/p31', 'p31-agents');
const GROUND_TRUTH_PATH = path.join(AGENTS_ROOT, 'ground-truth.json');
const MANIFEST_PATH = path.join(AGENTS_ROOT, 'manifest.yaml');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(path.resolve(filePath), 'utf-8');
  } catch {
    return null;
  }
}

function readJsonSafe(filePath) {
  const content = readFileSafe(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getGroundTruth() {
  return readJsonSafe(GROUND_TRUTH_PATH);
}

function stripQuotes(s) {
  return String(s).replace(/^["']|["']$/g, '');
}

function parseManifestYaml(content) {
  const agents = [];
  let current = null;
  let listMode = null;
  for (const line of (content || '').split('\n')) {
    const m = line.match(/^(\s*)(.*)$/);
    const indent = m[1].length;
    const text = m[2].trim();
    if (!text || text === 'agents:' || text.startsWith('#')) continue;
    if (indent === 2 && text.endsWith(':') && /^[a-z][a-z0-9-]*:$/.test(text)) {
      if (current) agents.push(current);
      current = { name: text.slice(0, -1), description: '', triad_archetype: '', temperature: null, model: '', tools: [], competence: [], not_competent: [] };
      listMode = null;
      continue;
    }
    if (!current) continue;
    if (indent === 4) {
      const kv = text.match(/^([a-z][a-z0-9-]*):\s*(.*)$/);
      if (!kv) continue;
      const key = kv[1];
      const val = stripQuotes(kv[2].trim());
      if (key === 'competence') { listMode = 'competence'; continue; }
      if (key === 'not_competent') { listMode = 'not_competent'; continue; }
      listMode = null;
      if (key === 'description') current.description = val;
      else if (key === 'triad-archetype') current.triad_archetype = val;
      else if (key === 'temperature') current.temperature = parseFloat(val);
      else if (key === 'model') current.model = val;
      else if (key === 'tools') {
        current.tools = val.replace(/^\[|\]$/g, '').split(',').map(s => stripQuotes(s.trim())).filter(Boolean);
      }
      continue;
    }
    if (indent === 6 && text.startsWith('-')) {
      const item = stripQuotes(text.slice(1).trim());
      if (listMode === 'competence') current.competence.push(item);
      else if (listMode === 'not_competent') current.not_competent.push(item);
    }
  }
  if (current) agents.push(current);
  return agents;
}

function getAgents() {
  const manifest = parseManifestYaml(readFileSafe(MANIFEST_PATH));
  if (manifest.length > 0) return manifest;
  return [{ name: 'unknown', description: 'manifest unavailable', triad_archetype: '', temperature: null, model: '', tools: [], competence: [], not_competent: [] }];
}

// ---------------------------------------------------------------------------
// Tool Definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'truth_lookup',
    description: 'Look up a verified fact by key from the ground-truth registry. Returns the claim, evidence type, citation, and verified flag.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Fact key (e.g. care-score-formula, header-height, verify-baseline)' },
      },
      required: ['key'],
    },
  },
  {
    name: 'truth_file_map',
    description: 'Return the canonical file map from ground-truth: real files vs hallucinated paths that must never be referenced.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_invariants',
    description: 'Return the canonical toolchain invariants (direct binaries, verify command). Agents MUST follow these exactly.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_design_tokens',
    description: 'Return the verified design tokens from ground-truth (header height, glass background, drawer overlay geometry).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_layout_gates',
    description: 'Return the verified layout gates (dashboard grid, viz-body sibling, research collapse, cockpit stage).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_care_score',
    description: 'Return the verified care-score formula and weights (spoons 40% + love 30% + mesh 20% + rituals 10%) with source citation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_mcp_inventory',
    description: 'Return the MCP server inventory (per-server tool counts) from ground-truth.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_manifest',
    description: 'Return the crew manifest location plus the parsed agent list (archetype, temperature, competence boundary).',
    inputSchema: {
      type: 'object',
      properties: {
        includeCompetence: { type: 'boolean', description: 'Include competence / not-competent lists (default true)' },
      },
    },
  },
  {
    name: 'truth_verify_baseline',
    description: 'Return the verify-suite baseline (target gate count, run-twice policy, command, known flakes). Paid tool — gates the full baseline payload.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_register_fact',
    description: 'Register a new verified fact into the ground-truth registry (appends to facts[] and persists). Requires evidence + citation. Paid tool — mutates the canonical registry.',
    inputSchema: {
      type: 'object',
      properties: {
        key: { type: 'string', description: 'Unique fact key (snake_case)' },
        claim: { type: 'string', description: 'The verified claim' },
        evidence: { type: 'string', description: 'Evidence type (Source Code, Test Suite Output, Verify Suite, Primary Source, Published DOI, ...)' },
        citation: { type: 'string', description: 'Citation, e.g. src/pages/DashboardPage.tsx:66-72' },
        file: { type: 'string', description: 'Optional target file (default: the canonical ground-truth.json). Used by tests to avoid mutating the registry.' },
      },
      required: ['key', 'claim', 'evidence', 'citation'],
    },
  },
  {
    name: 'truth_facts',
    description: 'List all verified facts in the registry.',
    inputSchema: {
      type: 'object',
      properties: {
        verifiedOnly: { type: 'boolean', description: 'Only include verified facts (default true)' },
      },
    },
  },
  {
    name: 'truth_paths',
    description: 'Return the canonical root paths (shell, workspace, agents).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_evidence',
    description: 'Return the OQE evidence categories reference (how to cite each type).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'truth_health',
    description: 'Registry health: file readable, top-level sections present, fact count, verified-fact count, and payload sizes.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ---------------------------------------------------------------------------
// Tool Implementations
// ---------------------------------------------------------------------------

function truthLookup({ key } = {}) {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: `Ground-truth registry not found at ${GROUND_TRUTH_PATH}` };
  if (!key) return { status: 'error', error: 'Missing key' };
  const fact = (gt.facts || []).find(f => f.key === key);
  if (!fact) {
    return {
      status: 'ok',
      found: false,
      available_keys: (gt.facts || []).map(f => f.key),
    };
  }
  return { status: 'ok', found: true, fact };
}

function truthFileMap() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  return {
    status: 'ok',
    real: gt.fileMap?.real || {},
    hallucinated: gt.fileMap?.hallucinated || [],
    rule: 'Reference real files only. Hallucinated paths must never be used.',
  };
}

function truthInvariants() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  return {
    status: 'ok',
    invariants: gt.toolchain?.invariants || [],
    count: (gt.toolchain?.invariants || []).length,
  };
}

function truthDesignTokens() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  return { status: 'ok', tokens: gt.designTokens || {} };
}

function truthLayoutGates() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  return { status: 'ok', layout: gt.layout || {} };
}

function truthCareScore() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  const cs = gt.careScore || {};
  return {
    status: 'ok',
    formula: 'care_score = spoons*0.40 + love*0.30 + mesh*0.20 + rituals*0.10',
    weights: cs.weights || {},
    location: cs.location || 'unknown',
  };
}

function truthMcpInventory() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  return { status: 'ok', inventory: gt.mcpInventory || {} };
}

function truthManifest({ includeCompetence = true } = {}) {
  const gt = getGroundTruth();
  const crew = (gt && gt.crew) || {};
  const agents = getAgents().map(a => ({
    name: a.name,
    description: a.description,
    triad_archetype: a.triad_archetype,
    temperature: a.temperature,
    ...(includeCompetence ? { competence: a.competence, not_competent: a.not_competent } : {}),
  }));
  return {
    status: 'ok',
    manifest_path: crew.manifest || MANIFEST_PATH,
    protocol_path: crew.protocol || null,
    count: agents.length,
    agents,
  };
}

function truthVerifyBaseline() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  const v = gt.verify || {};
  return {
    status: 'ok',
    baseline: v.baseline || 'unknown',
    runTwice: v.runTwice === true,
    command: v.command || 'unknown',
    knownFlakes: v.knownFlakes || [],
  };
}

function truthRegisterFact({ key, claim, evidence, citation, file } = {}) {
  const target = file ? path.resolve(file) : GROUND_TRUTH_PATH;
  const gt = readJsonSafe(target);
  if (!gt) return { status: 'error', error: `Registry not found at ${target}` };
  if (!key || !claim || !evidence || !citation) {
    return { status: 'error', error: 'Missing key, claim, evidence, or citation' };
  }
  if (!/^[a-z0-9_-]+$/.test(key)) {
    return { status: 'error', error: `Invalid fact key: ${key} (snake_case alnum, dash, underscore only)` };
  }
  const existing = (gt.facts || []).find(f => f.key === key);
  if (existing) {
    return { status: 'error', error: `Fact key already exists: ${key}` };
  }
  const fact = { key, claim, evidence, citation, verified: true };
  gt.facts = gt.facts || [];
  gt.facts.push(fact);
  try {
    fs.writeFileSync(target, JSON.stringify(gt, null, 2) + '\n', 'utf-8');
  } catch (e) {
    return { status: 'error', error: `Failed to persist registry: ${e.message}` };
  }
  return {
    status: 'ok',
    persisted: true,
    file: target,
    fact,
    factCount: gt.facts.length,
  };
}

function truthFacts({ verifiedOnly = true } = {}) {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  const facts = (gt.facts || []).filter(f => !verifiedOnly || f.verified !== false);
  return { status: 'ok', facts, count: facts.length };
}

function truthPaths() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: 'Ground-truth registry not found' };
  return { status: 'ok', paths: gt.paths || {} };
}

function truthEvidence() {
  const categories = [
    { type: 'Test Suite Output', cite: 'Vitest reports all passing (verified)' },
    { type: 'Compiler Output', cite: 'TypeScript passes (tsc --noEmit)' },
    { type: 'Deployment Log', cite: 'Deployed as Version [ID]' },
    { type: 'Source Code', cite: 'Care score formula at DashboardPage.tsx:66-72' },
    { type: 'Verify Suite', cite: 'Verify suite reports 186/186 checks passing' },
    { type: 'Primary Source', cite: 'Per [source], Section [n]' },
    { type: 'Published DOI', cite: 'As documented in Paper XIX, Section 3' },
  ];
  return { status: 'ok', categories, rule: 'Claims that cannot be traced to OQE are aspirational and must be clearly labeled as such.' };
}

function truthHealth() {
  const gt = getGroundTruth();
  if (!gt) return { status: 'error', error: `Registry missing or unreadable at ${GROUND_TRUTH_PATH}` };
  const sections = ['paths', 'toolchain', 'verify', 'careScore', 'designTokens', 'layout', 'mcpInventory', 'fileMap', 'crew', 'facts'];
  const present = sections.filter(s => gt[s] !== undefined);
  const missing = sections.filter(s => gt[s] === undefined);
  const facts = gt.facts || [];
  const verifiedCount = facts.filter(f => f.verified === true).length;
  return {
    status: 'ok',
    file: GROUND_TRUTH_PATH,
    schema: gt.$schema || null,
    sections_present: present.length,
    sections_total: sections.length,
    missing_sections: missing,
    facts: facts.length,
    verified_facts: verifiedCount,
    unverified_facts: facts.length - verifiedCount,
    healthy: missing.length === 0,
  };
}

// ---------------------------------------------------------------------------
// Tool Execution Router
// ---------------------------------------------------------------------------

function executeTool(name, args) {
  switch (name) {
    case 'truth_lookup':
      return truthLookup(args);
    case 'truth_file_map':
      return truthFileMap(args);
    case 'truth_invariants':
      return truthInvariants(args);
    case 'truth_design_tokens':
      return truthDesignTokens(args);
    case 'truth_layout_gates':
      return truthLayoutGates(args);
    case 'truth_care_score':
      return truthCareScore(args);
    case 'truth_mcp_inventory':
      return truthMcpInventory(args);
    case 'truth_manifest':
      return truthManifest(args);
    case 'truth_verify_baseline':
      return truthVerifyBaseline(args);
    case 'truth_register_fact':
      return truthRegisterFact(args);
    case 'truth_facts':
      return truthFacts(args);
    case 'truth_paths':
      return truthPaths(args);
    case 'truth_evidence':
      return truthEvidence(args);
    case 'truth_health':
      return truthHealth(args);
    default:
      return { status: 'error', error: `Unknown tool: ${name}` };
  }
}

// ---------------------------------------------------------------------------
// JSON-RPC over stdio
// ---------------------------------------------------------------------------

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
      handleRequest(JSON.parse(trimmed));
    } catch (_) {}
  }
});

function handleRequest(req) {
  const { id, method, params } = req;
  switch (method) {
    case 'initialize':
      respond(id, {
        protocolVersion: '2026-07-28',
        capabilities: { tools: {} },
        serverInfo: { name: 'p31-ground-truth', version: '2.0.0', upgraded: true },
      });
      break;
    case 'notifications/initialized':
      break;
    case 'tools/list':
      respond(id, { tools: TOOLS });
      break;
    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS.find(t => t.name === toolName);
      if (!tool) {
        respondError(id, -32602, `Unknown tool: ${toolName}`);
        break;
      }
      try {
        const out = executeTool(toolName, toolArgs);
        respond(id, { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] });
      } catch (e) {
        respond(id, {
          content: [{ type: 'text', text: JSON.stringify({ error: e.message, status: 'error' }) }],
          isError: true,
        });
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
