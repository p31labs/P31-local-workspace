import { createPrivateKey, createPublicKey, sign, verify } from 'node:crypto';
import * as jose from 'jose';
import { scanToolSurface } from './scanner';
import { validateArgs, validateBodySize } from './sanitizer';
import { LedgerLog } from './ledger-do';

export { LedgerLog };

/**
 * mcp-registry — P31 MCP Server Marketplace API (Phase 1)
 *
 * Central discovery + playground backend for all P31 MCP servers.
 * Powers mcp.p31ca.org (the MCP Marketplace portal).
 *
 * Two catalog tiers:
 *   - Official: the curated P31 fleet (OFFICIAL_CATALOG below), live-probed.
 *   - Community: POST /servers registrations, liveness-validated, marked
 *     "unverified" until P31 reviews them.
 *
 * Endpoints:
 *   GET  /                        HTML listing page
 *   GET  /health                  Health check
 *   GET  /servers                 Catalog summaries (search/filter via query)
 *   GET  /categories              Category + tool counts
 *   GET  /servers/:name           Full server detail incl. tool schemas
 *   GET  /servers/:name/tools     Full tool schemas (name/desc/inputSchema)
 *   GET  /servers/:name/health    Live health probe
 *   POST /servers                 Register a community server (rate-limited)
 *   POST /servers/:name/call      Proxy tools/call to the server
 *
 * Protocol version used for probes: 2025-11-25 (latest supported by the
 * ecosystem; servers advertising fabricated versions like 2026-07-28 are
 * reported degraded until fixed).
 */

const PROBE_PROTOCOL_VERSION = '2025-11-25';
const SUPPORTED_PROTOCOL_VERSIONS = new Set([
  '2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05', '2024-10-07',
]);

interface Env {
  REGISTRY_KV: KVNamespace;
  /** Durable Object binding for the audit + transparency hash chains (N3). */
  LEDGER?: DurableObjectNamespace;
  /** Service bindings to same-account MCP workers (bypass DNS 1042). */
  MUSIC_MAKER_MCP?: Fetcher;
  P31_CRYPTO_MCP?: Fetcher;
  P31_JUSTICE_HUB?: Fetcher;
  BROS?: Fetcher;
  DADS?: Fetcher;
  MARKETPLACE?: Fetcher;
  PHENIX_WALLET?: Fetcher;
  X402_GATEWAY?: Fetcher;
  /** Admin bearer token for moderation + observability endpoints. */
  ADMIN_TOKEN?: string;
  /** Base64 32-byte Ed25519 seed used to sign review decisions. */
  REVIEW_SIGNING_KEY?: string;
  /** Legacy signing seed for verifying historical audit entries after rotation. */
  REVIEW_SIGNING_KEY_PREV?: string;
  /** Optional OTLP/HTTP collector endpoint (e.g. a SIEM's OTLP receiver). */
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  /** Optional: run the LLM scan pass for high-risk registration categories. */
  SCANNER_LLM_ENABLED?: string;
  /** Principal reported when authenticating via ADMIN_TOKEN (default admin-token). */
  ADMIN_PRINCIPAL?: string;
  /** Cloudflare Access JWKS endpoint (https://<team>.cloudflareaccess.com/cdn-cgi/access/certs). */
  CF_ACCESS_CERT_URL?: string;
  /** Cloudflare Access application audience tag (CF_ACCESS_AUD). */
  CF_ACCESS_AUD?: string;
  /** When "1", reject anonymous write-risk proxy calls (strict deployments). */
  REQUIRE_AUTH_WRITE?: string;
}

// ─── Types ──────────────────────────────────────────────────────────────────

type Category = 'design' | 'crypto' | 'government' | 'finance' | 'social' | 'infra' | 'local';
type Status = 'live' | 'unverified' | 'degraded' | 'down';
type Health = 'up' | 'degraded' | 'down';

interface VerifyMeta {
  alg: 'ML-DSA-65';
  sbt?: boolean;
  checkedAt: string;
}

interface ReviewMeta {
  signedBy: string;
  alg: 'Ed25519';
  signature: string;
  checkedAt: string;
}

interface CapabilityManifest {
  tools: string[];
  dataSources: string[];
  externalServices: string[];
  writeCapable: boolean;
}

interface QuotaSpec {
  read: { perMinute: number; perDay: number };
  write: { perMinute: number; perDay: number };
}

interface ScanMeta {
  verdict: 'clean' | 'suspicious' | 'malicious';
  score: number;
  maliciousCount: number;
  suspiciousCount: number;
  scannedAt: string;
}

interface ToolDef {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

interface McpServerEntry {
  id: string;
  name: string;
  endpoint: string;
  kind: 'remote' | 'local';
  category: Category;
  description: string;
  tags: string[];
  author: string;
  icon?: string;
  status: Status;
  verify?: VerifyMeta;
  review?: ReviewMeta;
  capabilities?: CapabilityManifest;
  quota?: QuotaSpec;
  scan?: ScanMeta;
  needsReview?: boolean;
  monetized?: boolean;
  readOnlySafe: boolean;
  binding?: keyof Env;
  tools?: ToolDef[];
  localNote?: string;
}

interface HealthRecord {
  status: Health;
  latencyMs: number;
  checkedAt: string;
  detail?: string;
}

// ─── Official catalog (curated P31 fleet) ──────────────────────────────────

const OFFICIAL_CATALOG: McpServerEntry[] = [
  {
    id: 'p31-crypto',
    name: 'PQC Crypto',
    endpoint: 'https://p31-crypto-mcp.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'crypto',
    description: 'Post-quantum crypto — ML-DSA-65 keygen/sign/verify, ML-KEM-768, SLH-DSA-128s, SD-JWT, Taler, x402.',
    tags: ['post-quantum', 'signing', 'kem', 'identity'],
    author: 'P31 Labs, Inc.',
    icon: '🔐',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'P31_CRYPTO_MCP',
  },
  {
    id: 'p31-justice-hub',
    name: 'Sovereign Justice',
    endpoint: 'https://p31-justice-hub.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'government',
    description: 'Evidence chain (Ed25519 + ML-DSA-65), 2-of-3 escrow, ODR case/offer/resolve.',
    tags: ['evidence', 'escrow', 'odr', 'legal'],
    author: 'P31 Labs, Inc.',
    icon: '⚖️',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'P31_JUSTICE_HUB',
  },
  {
    id: 'bros',
    name: 'BROS Care',
    endpoint: 'https://bros.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'social',
    description: 'Persona switching (dad/sj/cj/wj), signaling rooms, care issuance, crisis pings.',
    tags: ['care', 'signaling', 'personas', 'family'],
    author: 'P31 Labs, Inc.',
    icon: '💞',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'BROS',
  },
  {
    id: 'dads',
    name: 'DADS Trust Engine',
    endpoint: 'https://dads.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'social',
    description: 'Incremental EigenTrust, task dispatch, LOVE minting (emotional 1.4× / self-care 1.3×).',
    tags: ['trust', 'tasks', 'love-economy'],
    author: 'P31 Labs, Inc.',
    icon: '🤝',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'DADS',
  },
  {
    id: 'marketplace-mcp',
    name: 'P31 Marketplace',
    endpoint: 'https://marketplace-mcp.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'finance',
    description: 'Sovereign Marketplace — listings, offers, trades, escrow, disputes (SHA-256 evidence).',
    tags: ['commerce', 'escrow', 'listings', 'finance'],
    author: 'P31 Labs, Inc.',
    icon: '🛒',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'MARKETPLACE',
  },
  {
    id: 'phenix-wallet',
    name: 'Phenix Wallet',
    endpoint: 'https://phenix-wallet-mcp.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'finance',
    description: 'Vault create/unlock/lock, credential store/present, recovery guardians.',
    tags: ['vault', 'credentials', 'wallet', 'identity'],
    author: 'P31 Labs, Inc.',
    icon: '💠',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'PHENIX_WALLET',
  },
  {
    id: 'music-maker-mcp',
    name: 'Spatial Music Maker',
    endpoint: 'https://music-maker-mcp.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'social',
    description: 'Observe/place/clear/name/trigger the family\u2019s spatial composition (5 tools).',
    tags: ['music', 'composition', 'family', 'realtime'],
    author: 'P31 Labs, Inc.',
    icon: '🎵',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'MUSIC_MAKER_MCP',
  },
  {
    id: 'roblox-bridge',
    name: 'Roblox Bridge',
    endpoint: 'https://roblox-bridge.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'social',
    description: 'Roblox bridge — create, deploy, terrain, worlds, skin (14 tools).',
    tags: ['roblox', 'gaming', 'worlds'],
    author: 'P31 Labs, Inc.',
    icon: '🧱',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
  },
  {
    id: 'p31-mcp-server',
    name: 'P31 Native MCP',
    endpoint: 'https://p31-mcp-server.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'infra',
    description: 'P31 native MCP front door — oasis, phos, jitterbug, healer, bus (9 core tools).',
    tags: ['oasis', 'phos', 'cli', 'front-door'],
    author: 'P31 Labs, Inc.',
    icon: '🛰️',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
  },
  {
    id: 'p31-shell',
    name: 'P31 Sovereign Shell',
    endpoint: 'https://p31-shell.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'infra',
    description: 'Sovereign shell — 90+ commands: spoons, navigation, identity, mesh, cognitive tools, MCP.',
    tags: ['shell', 'sovereign', 'commands', 'mesh'],
    author: 'P31 Labs, Inc.',
    icon: '🖥️',
    status: 'degraded',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
  },
  {
    id: 'x402-gateway',
    name: 'x402 Payment Gateway',
    endpoint: 'https://mcp-x402-gateway.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'finance',
    description: 'x402 pay-per-request MCP gateway — free + metered tools with a 402 challenge.',
    tags: ['payments', 'x402', 'metered', 'billing'],
    author: 'P31 Labs, Inc.',
    icon: '💳',
    status: 'degraded',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    binding: 'X402_GATEWAY',
  },
  {
    id: 'spaceship-relay',
    name: 'Spaceship Relay',
    endpoint: 'https://spaceship-relay.trimtab-signal.workers.dev/mcp',
    kind: 'remote',
    category: 'infra',
    description: 'Spaceship Earth relay — telemetry, LED control, mesh presence for the geodesic dome.',
    tags: ['spaceship', '3d', 'telemetry', 'mesh'],
    author: 'P31 Labs, Inc.',
    icon: '🚀',
    status: 'degraded',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
  },
  {
    id: 'design-mcp',
    name: 'Design System MCP',
    endpoint: 'https://design-mcp.trimtab-signal.workers.dev/',
    kind: 'remote',
    category: 'design',
    description: 'P31 Design System — tokens, components, recipes, generation, WCAG audit, parity validation.',
    tags: ['design-system', 'tokens', 'components', 'audit'],
    author: 'P31 Labs, Inc.',
    icon: '🎨',
    status: 'degraded',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: true,
  },
  {
    id: 'soulsafe',
    name: 'SOULSAFE Architect',
    endpoint: 'local://cli/soulsafe-server.js',
    kind: 'local',
    category: 'infra',
    description: 'SOULSAFE 3-gate verification — competence, Red Board, OQE, severity, deploy clearing.',
    tags: ['governance', 'verification', 'protocol', '3-gate'],
    author: 'P31 Labs, Inc.',
    icon: '🛡️',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: true,
    localNote: 'Local stdio server — add via opencode/claude config (node cli/soulsafe-server.js).',
  },
  {
    id: 'oasis',
    name: 'Oasis CLI',
    endpoint: 'local://cli/mcp-server.js',
    kind: 'local',
    category: 'local',
    description: 'Oasis TUI session state — status, todos, theme, mode, sandbox execute.',
    tags: ['cli', 'session', 'sandbox'],
    author: 'P31 Labs, Inc.',
    icon: '🌿',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: false,
    localNote: 'Local stdio server — provides sandbox shell execution; connect via opencode config.',
  },
  {
    id: 'phos-forge',
    name: 'PHOS Forge',
    endpoint: 'local://cli/phos-forge-mcp.mjs',
    kind: 'local',
    category: 'local',
    description: 'PHOS cognitive toolkit — adopt, classify, learn, rollback, cartographer, healer (26+ tools).',
    tags: ['cognitive', 'phos', 'cli', 'classification'],
    author: 'P31 Labs, Inc.',
    icon: '🧠',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: true,
    localNote: 'Local stdio server — node tools/phos-forge/mcp-server.mjs.',
  },
  {
    id: 'component-registry',
    name: 'Component Registry',
    endpoint: 'local://cli/component-registry.js',
    kind: 'local',
    category: 'design',
    description: 'PHOS component registry — list components, tokens, search, spoon guide (5 tools).',
    tags: ['components', 'design', 'registry'],
    author: 'P31 Labs, Inc.',
    icon: '🧩',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: true,
    localNote: 'Local stdio server — node cli/component-registry.js.',
  },
  {
    id: 'ground-truth',
    name: 'Ground Truth',
    endpoint: 'local://cli/ground-truth-server.js',
    kind: 'local',
    category: 'infra',
    description: 'Canonical verify invariants — toolchain, gates, direct binaries from ground-truth.json.',
    tags: ['verify', 'invariants', 'toolchain', 'oqe'],
    author: 'P31 Labs, Inc.',
    icon: '🧭',
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt: '2026-09-23T00:00:00Z' },
    readOnlySafe: true,
    localNote: 'Local stdio server — node cli/ground-truth-server.js.',
  },
];

// ─── Storage keys ───────────────────────────────────────────────────────────

const KV_SCHEMAS_PREFIX = 'schemas:';
const KV_HEALTH_PREFIX = 'health:';
const KV_SCAN_PREFIX = 'scan:';
const KV_CAPS_PREFIX = 'caps:';
const KV_REGISTERED = 'servers:registered';
const KV_REJECTED = 'servers:rejected';
const KV_RATELIMIT_PREFIX = 'ratelimit:';
const KV_AUDIT_LOG = 'audit:log';
const KV_AUDIT_HEAD = 'audit:head';
const KV_LOGS = 'logs:events';
const KV_ERRORS = 'errors:events';
const KV_TRANSPARENCY_LOG = 'transparency:log';
const KV_TRANSPARENCY_HEAD = 'transparency:head';
const KV_BASELINE_PREFIX = 'baseline:';
const KV_BASELINE_SCHEMAS_PREFIX = 'baseline:schemas:';
const KV_ROLES_PREFIX = 'roles:authn:';
const KV_GROUP_ROLES_PREFIX = 'roles:mapping:';
const KV_TOOLRATE_PREFIX = 'ratelimit:tool:';
const KV_REJECTIONS_PREFIX = 'rejections:';
const KV_TTL = 300; // 5 minutes for tool schemas
const HEALTH_TTL = 120; // 2 minutes for health probes
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 3600; // 1 hour
const AUDIT_MAX = 2000; // bounded audit chain (rolling)
const LOG_MAX = 500; // bounded structured log ring
const ERROR_MAX = 500; // bounded error ring

// ─── Helpers ────────────────────────────────────────────────────────────────

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(data, { status, headers: { ...corsHeaders(), ...extraHeaders } });
}

async function getAllEntries(env: Env): Promise<McpServerEntry[]> {
  const registeredRaw = await env.REGISTRY_KV.get(KV_REGISTERED);
  const registered: McpServerEntry[] = registeredRaw ? JSON.parse(registeredRaw) : [];
  return [...OFFICIAL_CATALOG, ...registered];
}

async function rpcCall(
  env: Env,
  entry: McpServerEntry,
  method: string,
  params: unknown,
  timeoutMs = 6000,
  extraHeaders: Record<string, string> = {},
): Promise<{ result?: any; error?: any }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: params ?? {} });
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...extraHeaders };

  let res: Response;
  const binding = entry.binding ? (env[entry.binding] as Fetcher | undefined) : undefined;
  try {
    if (binding) {
      res = await binding.fetch(new Request(entry.endpoint, { method: 'POST', headers, body, signal: controller.signal }));
    } else {
      res = await fetch(entry.endpoint, { method: 'POST', headers, body, signal: controller.signal });
    }
  } catch (e: any) {
    clearTimeout(timer);
    return { error: { code: -32000, message: String(e?.message ?? e) } };
  }
  clearTimeout(timer);

  let text = '';
  try { text = await res.text(); } catch { return { error: { code: -32000, message: 'empty response' } }; }

  let parsed: any = null;
  // SSE unwrap: MCP Streamable HTTP may return `data: {...}` and/or
  // `event: message\ndata: {...}` frames — strip both the event + data
  // prefixes from each line, then parse (single frame or last JSON frame).
  const stripSse = (s: string) => s.replace(/^event:\s*[^\n]*\n?/gm, '').replace(/^data:\s*/gm, '').trim();
  try {
    parsed = JSON.parse(stripSse(text));
  } catch {
    const frames = text.split('\n\n').map(stripSse).filter(Boolean);
    for (let i = frames.length - 1; i >= 0; i--) {
      try { parsed = JSON.parse(frames[i]); break; } catch { /* skip */ }
    }
  }
  if (!parsed) return { error: { code: -32000, message: `unparseable response (HTTP ${res.status})` } };
  if (parsed.error) return { error: parsed.error };
  return { result: parsed.result };
}

async function probeTools(env: Env, entry: McpServerEntry): Promise<ToolDef[] | null> {
  if (entry.kind === 'local') return entry.tools ?? null;

  const first = await rpcCall(env, entry, 'tools/list', {});
  if (!first.error) {
    const tools = first.result?.tools;
    return Array.isArray(tools) ? tools : null;
  }
  // Some stateless servers require an initialize handshake first.
  const init = await rpcCall(env, entry, 'initialize', {
    protocolVersion: PROBE_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'p31-mcp-registry', version: '1.0.0' },
  });
  if (init.error) return null;
  const second = await rpcCall(env, entry, 'tools/list', {});
  if (second.error) return null;
  const tools = second.result?.tools;
  return Array.isArray(tools) ? tools : null;
}

/**
 * Full endpoint probe: initialize handshake (validates the advertised
 * protocol version) then tools/list. Returns tools plus a diagnostics record
 * used by both health and registration.
 */
async function probeEndpoint(
  env: Env,
  entry: McpServerEntry,
): Promise<{ tools: ToolDef[] | null; detail?: string }> {
  const init = await rpcCall(env, entry, 'initialize', {
    protocolVersion: PROBE_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: { name: 'p31-mcp-registry', version: '1.0.0' },
  });
  if (init.error) {
    return { tools: null, detail: `initialize failed: ${JSON.stringify(init.error)}` };
  }
  const advertised = init.result?.protocolVersion as string | undefined;
  if (advertised && !SUPPORTED_PROTOCOL_VERSIONS.has(advertised)) {
    return { tools: null, detail: `unsupported protocol version ${advertised} — server must advertise one of ${[...SUPPORTED_PROTOCOL_VERSIONS].join(', ')}` };
  }
  const list = await rpcCall(env, entry, 'tools/list', {});
  if (list.error) {
    return { tools: null, detail: `tools/list failed: ${JSON.stringify(list.error)}` };
  }
  const tools = list.result?.tools;
  if (!Array.isArray(tools)) {
    return { tools: null, detail: 'tools/list returned no tool array' };
  }
  return { tools };
}

async function probeHealth(env: Env, entry: McpServerEntry): Promise<HealthRecord> {
  if (entry.kind === 'local') {
    return { status: 'up', latencyMs: 0, checkedAt: new Date().toISOString(), detail: 'local — not probed from the edge' };
  }
  const cached = await env.REGISTRY_KV.get(KV_HEALTH_PREFIX + entry.id);
  if (cached) return JSON.parse(cached) as HealthRecord;

  const start = Date.now();
  const { tools, detail } = await probeEndpoint(env, entry);
  const latencyMs = Date.now() - start;

  let rec: HealthRecord;
  if (tools !== null && tools.length > 0) rec = { status: 'up', latencyMs, checkedAt: new Date().toISOString() };
  else if (tools !== null) rec = { status: 'degraded', latencyMs, checkedAt: new Date().toISOString(), detail: detail ?? 'reachable but returned zero tools' };
  else rec = { status: 'down', latencyMs, checkedAt: new Date().toISOString(), detail: detail ?? 'probe failed (handshake or tools/list error)' };

  await env.REGISTRY_KV.put(KV_HEALTH_PREFIX + entry.id, JSON.stringify(rec), { expirationTtl: HEALTH_TTL });
  return rec;
}

async function getToolSchemas(env: Env, entry: McpServerEntry): Promise<ToolDef[]> {
  if (entry.kind === 'local') return entry.tools ?? [];

  const cached = await env.REGISTRY_KV.get(KV_SCHEMAS_PREFIX + entry.id);
  if (cached) return JSON.parse(cached) as ToolDef[];

  const tools = await probeTools(env, entry);
  const schemas: ToolDef[] = Array.isArray(tools)
    ? tools.map((t: any) => ({
        name: String(t.name),
        description: String(t.description ?? ''),
        inputSchema: t.inputSchema ?? undefined,
      }))
    : [];
  if (schemas.length > 0) {
    await env.REGISTRY_KV.put(KV_SCHEMAS_PREFIX + entry.id, JSON.stringify(schemas), { expirationTtl: KV_TTL });
  }
  return schemas;
}

// ─── H1: scanner verdict + capability backfill for every entry ─────────────
// Official catalog entries are scanned at probe time and cached in KV so the
// verdict is visible on every card. Per R1, official verdicts are
// informational only — never gate. Capabilities are auto-derived from the
// tool surface (auto:true) and diffed against any declared manifest.

function deriveCapabilities(schemas: ToolDef[]): CapabilityManifest & { auto: true } {
  const names = schemas.map((t) => t.name)
  const writeCapable = schemas.some((t) => toolRisk(t) === 'write')
  // Conservative inference: dataSources only from schema fields that name a
  // source/path/uri/query; externalServices only from URL-shaped schema fields.
  const dataSources = new Set<string>()
  const externalServices = new Set<string>()
  for (const t of schemas) {
    const props = ((t.inputSchema as any)?.properties ?? {}) as Record<string, any>
    for (const [k, p] of Object.entries(props)) {
      if (/\b(source|path|uri|file|query|collection|bucket|repo)\b/i.test(k)) dataSources.add(String(p?.type ?? 'unknown'))
      if (/\b(url|endpoint|host|origin)\b/i.test(k)) externalServices.add(String(p?.type ?? 'unknown'))
    }
  }
  return { tools: names, dataSources: [...dataSources], externalServices: [...externalServices], writeCapable, auto: true }
}

async function getScanMeta(env: Env, entry: McpServerEntry, schemas: ToolDef[]): Promise<ScanMeta> {
  if (entry.scan) return entry.scan
  const cached = await env.REGISTRY_KV.get(KV_SCAN_PREFIX + entry.id)
  if (cached) return JSON.parse(cached) as ScanMeta
  const scan = scanToolSurface(schemas as Array<{ name: string; description?: string }>)
  const meta: ScanMeta = {
    verdict: scan.worst,
    score: scan.results.reduce((a, r) => a + r.score, 0),
    maliciousCount: scan.maliciousCount,
    suspiciousCount: scan.suspiciousCount,
    scannedAt: new Date().toISOString(),
  }
  await env.REGISTRY_KV.put(KV_SCAN_PREFIX + entry.id, JSON.stringify(meta), { expirationTtl: KV_TTL * 6 })
  return meta
}

async function getCapabilityMeta(env: Env, entry: McpServerEntry, schemas: ToolDef[]): Promise<CapabilityManifest> {
  if (entry.capabilities) return entry.capabilities
  const cached = await env.REGISTRY_KV.get(KV_CAPS_PREFIX + entry.id)
  if (cached) return JSON.parse(cached) as CapabilityManifest
  const derived = deriveCapabilities(schemas)
  await env.REGISTRY_KV.put(KV_CAPS_PREFIX + entry.id, JSON.stringify(derived), { expirationTtl: KV_TTL * 6 })
  return derived
}

// ─── Governance: hash-chained + Ed25519-signed audit log ───────────────────
// Each tool call through the proxy is appended to a SHA-256 hash chain AND
// signed with the registry's Ed25519 key (non-repudiation — matches the IETF
// signed-receipts pattern: Ed25519 over deterministic JSON canonicalization).
// entry.hash = sha256(prevHash ∥ canonical(payload)); entry.sig = Ed25519 over
// canonical(payload). The head hash is stored separately so the whole chain
// can be re-verified independently of the log operator.

async function sha256Hex(data: string): Promise<string> {
  const bytes = new TextEncoder().encode(data);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuditEntry {
  seq: number;
  ts: string;
  serverId: string;
  tool: string;
  risk: 'read' | 'write';
  args: Record<string, unknown>;
  latencyMs: number;
  status: 'done' | 'error';
  prev: string;
  hash: string;
  sig?: string;
  sigAlg?: string;
  capToken?: { aud: string; tool: string; exp: number };
}

function canonical(payload: unknown): string {
  return JSON.stringify(payload, Object.keys(payload as object).sort());
}

/** Resolve the DO stub for a given ledger ('audit' | 'transparency'). */
function ledgerStub(env: Env, name: 'audit' | 'transparency'): LedgerLog | null {
  if (!env.LEDGER) return null
  try {
    const id = env.LEDGER.idFromName(name)
    return env.LEDGER.get(id) as unknown as LedgerLog
  } catch {
    return null
  }
}

/**
 * Read a ledger: DO is authoritative. If the DO is empty but KV holds history
 * (pre-migration entries), backfill the DO from KV in chain order, then read
 * from the DO. Falls back to KV if the DO is unavailable.
 */
async function readLedger(env: Env, name: 'audit' | 'transparency', kvLogKey: string, kvHeadKey: string): Promise<{ log: any[]; head: string; source: 'do' | 'kv' }> {
  const doStub = ledgerStub(env, name)
  const kvRaw = await env.REGISTRY_KV.get(kvLogKey)
  const kvLog: any[] = kvRaw ? JSON.parse(kvRaw) : []
  const kvHead = (await env.REGISTRY_KV.get(kvHeadKey)) ?? 'GENESIS'
  if (doStub) {
    try {
      if ((await doStub.size()) === 0 && kvLog.length > 0) {
        // Cold start / migration: replay the full KV chain into the DO.
        const backfill = await doStub.backfill(kvLog)
        if (!backfill.ok) {
          // Chain couldn't be backfilled intact — read from KV to avoid loss.
          return { log: kvLog, head: kvHead, source: 'kv' }
        }
      }
      const exported = await doStub.exportAll()
      // Reconcile: a transient DO append failure leaves a hole (size() > 0,
      // so the empty-only backfill above never runs). If the DO head diverges
      // from KV, replay the KV suffix after the DO's existing prefix; the DO
      // backfill verifies prev === head, so it can only repair — never fork.
      if (exported.head !== kvHead) {
        const suffix = kvLog.slice(exported.log.length)
        if (suffix.length > 0) {
          const reconciled = await doStub.backfill(suffix)
          if (!reconciled.ok) {
            // DO is unrecoverable this pass — serve the intact KV chain.
            return { log: kvLog, head: kvHead, source: 'kv' }
          }
          const reExported = await doStub.exportAll()
          return { log: reExported.log, head: reExported.head, source: 'do' }
        }
      }
      return { log: exported.log, head: exported.head, source: 'do' }
    } catch {
      /* DO unavailable — fall back to KV */
    }
  }
  return { log: kvLog, head: kvHead, source: 'kv' }
}

/** Canonical fields an auditor needs to recompute hash + signature. */
function auditCanonical(e: Pick<AuditEntry, 'seq' | 'ts' | 'serverId' | 'tool' | 'risk' | 'args' | 'latencyMs' | 'status' | 'capToken'> & { prev: string }) {
  return canonical({ prev: e.prev, seq: e.seq, ts: e.ts, serverId: e.serverId, tool: e.tool, risk: e.risk, args: e.args, latencyMs: e.latencyMs, status: e.status, capToken: e.capToken });
}

async function appendAudit(env: Env, payload: Omit<AuditEntry, 'seq' | 'ts' | 'prev' | 'hash' | 'sig' | 'sigAlg'>): Promise<AuditEntry> {
  const raw = await env.REGISTRY_KV.get(KV_AUDIT_LOG);
  const log: AuditEntry[] = raw ? JSON.parse(raw) : [];
  const head = (await env.REGISTRY_KV.get(KV_AUDIT_HEAD)) ?? 'GENESIS';
  const seq = log.length > 0 ? log[log.length - 1].seq + 1 : 1;
  const ts = new Date().toISOString();
  const body = { prev: head, seq, ts, ...payload };
  const hash = await sha256Hex(canonical(body));
  const signed = await ed25519Sign(env, body);
  const entry: AuditEntry = { seq, ts, prev: head, hash, ...payload, ...(signed ? { sig: signed.signature, sigAlg: signed.alg } : {}) };
  log.push(entry);
  if (log.length > AUDIT_MAX) log.splice(0, log.length - AUDIT_MAX);
  await env.REGISTRY_KV.put(KV_AUDIT_LOG, JSON.stringify(log));
  await env.REGISTRY_KV.put(KV_AUDIT_HEAD, hash);
  // N3 — dual-write to the Durable Object (authoritative); KV stays as legacy
  // fallback through the transition. DO failure is non-fatal for appends.
  const doStub = ledgerStub(env, 'audit');
  if (doStub) {
    try {
      await doStub.append(entry as any);
    } catch {
      /* DO unavailable — KV remains the durable store */
    }
  }
  return entry;
}

async function verifyAuditChain(env: Env, log?: AuditEntry[]): Promise<{ ok: boolean; checked: number; head: string; signed: number; sigOk: boolean }> {
  const raw = log ? null : await env.REGISTRY_KV.get(KV_AUDIT_LOG);
  const entries: AuditEntry[] = log ?? (raw ? JSON.parse(raw) : []);
  let prev = 'GENESIS';
  let signed = 0;
  let sigOk = true;
  for (const e of entries) {
    const body = { prev, seq: e.seq, ts: e.ts, serverId: e.serverId, tool: e.tool, risk: e.risk, args: e.args, latencyMs: e.latencyMs, status: e.status, capToken: e.capToken };
    const recomputed = await sha256Hex(canonical(body));
    if (recomputed !== e.hash) return { ok: false, checked: entries.length, head: prev, signed, sigOk };
    if (e.sig) {
      signed += 1;
      const good = await ed25519Verify(env, body, e.sig);
      if (!good) sigOk = false;
    }
    prev = e.hash;
  }
  return { ok: true, checked: entries.length, head: prev, signed, sigOk };
}

// ─── Governance: transparency lifecycle log (server events) ────────────────
// Second hash chain recording server lifecycle events (registered / approved /
// rejected / drifted / tool-changed) so privilege escalation or rug-pulls
// become publicly visible. Same SHA-256 + Ed25519 pattern as the call audit.

interface TransparencyEntry {
  seq: number;
  ts: string;
  event: 'registered' | 'approved' | 'rejected' | 'drifted' | 'tool-changed' | 'reviewed';
  serverId: string;
  detail?: string;
  prev: string;
  hash: string;
  sig?: string;
}

async function appendTransparency(env: Env, ev: Omit<TransparencyEntry, 'seq' | 'ts' | 'prev' | 'hash' | 'sig'>): Promise<void> {
  const raw = await env.REGISTRY_KV.get(KV_TRANSPARENCY_LOG);
  const log: TransparencyEntry[] = raw ? JSON.parse(raw) : [];
  const head = (await env.REGISTRY_KV.get(KV_TRANSPARENCY_HEAD)) ?? 'GENESIS';
  const seq = log.length > 0 ? log[log.length - 1].seq + 1 : 1;
  const ts = new Date().toISOString();
  const body = { prev: head, seq, ts, event: ev.event, serverId: ev.serverId, detail: ev.detail };
  const hash = await sha256Hex(canonical(body));
  const signed = await ed25519Sign(env, body);
  const entry: TransparencyEntry = { seq, ts, prev: head, hash, ...ev, ...(signed ? { sig: signed.signature } : {}) };
  log.push(entry);
  if (log.length > AUDIT_MAX) log.splice(0, log.length - AUDIT_MAX);
  await env.REGISTRY_KV.put(KV_TRANSPARENCY_LOG, JSON.stringify(log));
  await env.REGISTRY_KV.put(KV_TRANSPARENCY_HEAD, hash);
  // N3 — dual-write to the transparency Durable Object (authoritative).
  const doStub = ledgerStub(env, 'transparency');
  if (doStub) {
    try {
      await doStub.append(entry as any);
    } catch {
      /* DO unavailable — KV remains the durable store */
    }
  }
}

// ─── A4: capability drift (contentHash of the tools/list surface) ──────────

function toolsHash(tools: ToolDef[]): string {
  const canonicalTools = tools
    .map((t) => ({ name: t.name, description: t.description ?? '', schema: t.inputSchema ?? null }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));
  return canonical(canonicalTools);
}

async function checkDrift(env: Env, entry: McpServerEntry, schemas: ToolDef[]): Promise<{ baseline: string | null; current: string; drifted: boolean }> {
  const current = toolsHash(schemas);
  const baseline = await env.REGISTRY_KV.get(KV_BASELINE_PREFIX + entry.id);
  if (!baseline) return { baseline: null, current, drifted: false };
  const drifted = baseline !== current;
  if (drifted && entry.kind === 'remote') {
    // Fire a transparency event when a previously-approved surface changes.
    void appendTransparency(env, { event: 'drifted', serverId: entry.id, detail: `surface changed (baseline ${baseline.slice(0, 12)} → ${current.slice(0, 12)})` }).catch(() => {});
  }
  return { baseline, current, drifted };
}

// ─── A3: per-tool quotas (429 technical, 402 monetized) ─────────────────────

const DEFAULT_QUOTA: QuotaSpec = { read: { perMinute: 60, perDay: 5000 }, write: { perMinute: 10, perDay: 300 } };

interface QuotaDecision {
  ok: boolean;
  status: number;
  limit: number;
  remaining: number;
  windowSec: number;
}

async function enforceToolQuota(env: Env, request: Request, entry: McpServerEntry, toolName: string, risk: 'read' | 'write'): Promise<QuotaDecision> {
  const quota = entry.quota ?? DEFAULT_QUOTA;
  const spec = risk === 'write' ? quota.write : quota.read;
  const ip = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const key = KV_TOOLRATE_PREFIX + `${entry.id}:${toolName}:${ip}`;

  // Per-minute window (rolling). KV is eventually consistent; good enough for quotas.
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / 60) * 60;
  const windowKey = `${key}:${windowStart}`;
  const n = Number((await env.REGISTRY_KV.get(windowKey)) ?? '0');
  await env.REGISTRY_KV.put(windowKey, String(n + 1), { expirationTtl: 120 });
  const remaining = Math.max(0, spec.perMinute - (n + 1));
  if (n + 1 > spec.perMinute) {
    const status = entry.monetized ? 402 : 429;
    return { ok: false, status, limit: spec.perMinute, remaining: 0, windowSec: 60 };
  }
  return { ok: true, status: 200, limit: spec.perMinute, remaining, windowSec: 60 };
}

// ─── Governance: structured logging + self-hosted error ingestion ─────────

interface LogEvent {
  ts: string;
  level: 'info' | 'warn' | 'error';
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  serverId?: string;
}

async function appendLog(env: Env, ev: Omit<LogEvent, 'ts'>): Promise<void> {
  const raw = await env.REGISTRY_KV.get(KV_LOGS);
  const log: LogEvent[] = raw ? JSON.parse(raw) : [];
  log.push({ ts: new Date().toISOString(), ...ev });
  if (log.length > LOG_MAX) log.splice(0, log.length - LOG_MAX);
  await env.REGISTRY_KV.put(KV_LOGS, JSON.stringify(log));
}

interface ErrorEvent {
  ts: string;
  source: string;
  message: string;
  stack?: string;
  url?: string;
  userAgent?: string;
}

async function appendError(env: Env, ev: Omit<ErrorEvent, 'ts'>): Promise<void> {
  const raw = await env.REGISTRY_KV.get(KV_ERRORS);
  const log: ErrorEvent[] = raw ? JSON.parse(raw) : [];
  log.push({ ts: new Date().toISOString(), ...ev });
  if (log.length > ERROR_MAX) log.splice(0, log.length - ERROR_MAX);
  await env.REGISTRY_KV.put(KV_ERRORS, JSON.stringify(log));
}

// ─── C1: OTLP-shaped event emission (Claude Code schema) ───────────────────
// Emits mcp_server_connection / tool_result / tool_decision events. If an
// OTLP/HTTP collector endpoint is configured, POSTs in OTLP JSON; otherwise
// the KV structured log (appendLog) already carries the same fields.

async function emitOtlpEvent(env: Env, name: string, attrs: Record<string, string | number | boolean | undefined>): Promise<void> {
  const endpoint = env.OTEL_EXPORTER_OTLP_ENDPOINT;
  if (!endpoint) return;
  const payload = {
    resourceLogs: [
      {
        resource: { attributes: [{ key: 'service.name', value: { stringValue: 'p31-mcp-registry' } }] },
        scopeLogs: [
          {
            scope: { name: 'p31.mcp.marketplace' },
            logRecords: [
              {
                timeUnixNano: String(BigInt(Date.now()) * 1000000n),
                severityText: 'INFO',
                body: { stringValue: name },
                attributes: Object.entries(attrs)
                  .filter(([, v]) => v !== undefined)
                  .map(([k, v]) => ({ key: k, value: { stringValue: String(v) } })),
              },
            ],
          },
        ],
      },
    ],
  };
  try {
    await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  } catch {
    /* OTLP export is best-effort; KV logs remain the durable store */
  }
}

// ─── Governance: RBAC roles + review signing ───────────────────────────────
// Roles: viewer (read catalog/audit), publisher (register), reviewer
// (pending/review), admin (logs/errors/roles). Principal resolution is
// header-based (X-Principal → CF-Access-Authenticated-User-Email → anonymous).
// Role assignments live in KV; ADMIN_TOKEN remains a super-admin fallback.

type Role = 'viewer' | 'publisher' | 'reviewer' | 'admin'
const ROLE_RANK: Record<Role, number> = { viewer: 0, publisher: 1, reviewer: 2, admin: 3 }

/**
 * Verify a Cloudflare Access JWT (Cf-Access-Jwt-Assertion) against the
 * configured JWKS + audience. Returns the principal (email/sub) and IdP
 * groups, or null when no token/config is present or verification fails.
 * The JWKS is cached in KV via jose's jwksCache so Access tokens verify
 * without a network fetch on every request.
 */
const KV_ACCESS_JWKS = 'access:jwks'

async function verifyAccessJwt(env: Env, request: Request): Promise<{ principal: string; groups: string[] } | null> {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  const certUrl = env.CF_ACCESS_CERT_URL
  const aud = env.CF_ACCESS_AUD
  if (!token || !certUrl || !aud) return null
  try {
    const raw = await env.REGISTRY_KV.get(KV_ACCESS_JWKS)
    const cache: jose.JWKSCacheInput = raw ? JSON.parse(raw) : {}
    const jwks = jose.createRemoteJWKSet(new URL(certUrl), { [jose.jwksCache]: cache })
    const { payload } = await jose.jwtVerify(token, jwks, { audience: aud })
    await env.REGISTRY_KV.put(KV_ACCESS_JWKS, JSON.stringify(cache), { expirationTtl: 3600 })
    const groups = Array.isArray(payload.groups) ? payload.groups.map(String) : []
    return { principal: String(payload.email ?? payload.sub ?? 'access-user'), groups }
  } catch {
    return null
  }
}

async function resolvePrincipal(env: Env, request: Request): Promise<string> {
  const access = await verifyAccessJwt(env, request)
  if (access) return access.principal
  const x = request.headers.get('X-Principal')?.trim()
  if (x) return x
  const cf = request.headers.get('CF-Access-Authenticated-User-Email')?.trim()
  if (cf) return cf
  return 'anonymous'
}

async function getRole(env: Env, request: Request): Promise<Role> {
  const token = env.ADMIN_TOKEN
  const bearer = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? request.headers.get('X-Admin-Token')
  if (token && bearer === token) return 'admin'
  // N4 — IdP groups → roles via roles:mapping:<group> (highest wins).
  const access = await verifyAccessJwt(env, request)
  if (access) {
    let best: Role = 'viewer'
    for (const g of access.groups) {
      const stored = await env.REGISTRY_KV.get(KV_GROUP_ROLES_PREFIX + g)
      if (stored && ROLE_RANK[stored as Role] > ROLE_RANK[best]) best = stored as Role
    }
    if (best !== 'viewer') return best
  }
  const principal = await resolvePrincipal(env, request)
  if (principal === 'anonymous') return 'viewer'
  const stored = await env.REGISTRY_KV.get(KV_ROLES_PREFIX + principal)
  return (stored as Role) || 'viewer'
}

/** Resolve the acting principal, honoring the admin-token machine principal. */
async function resolveActingPrincipal(env: Env, request: Request): Promise<string> {
  const role = await getRole(env, request)
  const p = await resolvePrincipal(env, request)
  if (role === 'admin' && p === 'anonymous') return env.ADMIN_PRINCIPAL || 'admin-token'
  return p
}

interface AuthResult { ok: boolean; principal: string; role: Role }

async function requireRole(request: Request, env: Env, allowed: Role[]): Promise<AuthResult> {
  const role = await getRole(env, request)
  const ok = allowed.some((r) => ROLE_RANK[role] >= ROLE_RANK[r])
  return { ok, principal: await resolvePrincipal(env, request), role }
}

function roleError(result: AuthResult): Response {
  return json({ error: `unauthorized — requires ${result.role === 'viewer' ? 'elevation' : `role >= ${result.role}`}`, principal: result.principal, role: result.role }, 401)
}

async function requireAdmin(request: Request, env: Env): Promise<AuthResult> {
  return requireRole(request, env, ['admin'])
}

// ─── Governance: Ed25519 signing helpers (FIPS 186-5, node:crypto) ─────────

function ed25519PrivateKey(env: Env): unknown {
  return ed25519PrivateKeyFromB64(env.REVIEW_SIGNING_KEY)
}

function ed25519PrivateKeyFromB64(seedB64?: string): unknown {
  if (!seedB64) return null;
  try {
    const seed = Buffer.from(seedB64, 'base64');
    if (seed.length !== 32) return null;
    // Ed25519 private key from a raw 32-byte seed via PKCS#8 DER. `node:crypto`
    // is available under the worker's nodejs_compat flag (and in tests).
    const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
    return createPrivateKey({ key: der, format: 'der', type: 'pkcs8' });
  } catch {
    return null;
  }
}

/** Sign canonical(payload) with the registry's Ed25519 key. Returns null if unconfigured. */
async function ed25519Sign(env: Env, payload: Record<string, unknown>): Promise<{ signature: string; alg: 'Ed25519' } | null> {
  const seedB64 = env.REVIEW_SIGNING_KEY;
  if (!seedB64) return null;
  const seed = Buffer.from(seedB64, 'base64');
  if (seed.length !== 32) return null;
  const data = new TextEncoder().encode(canonical(payload));

  // Path 1: node:crypto (works under Node — tests). workerd's polyfill doesn't
  // implement sign(), so this throws there and we fall through.
  try {
    const key = ed25519PrivateKey(env);
    if (key) {
      for (const alg of [null, 'ed25519']) {
        try {
          return { signature: sign(alg, data, key).toString('base64'), alg: 'Ed25519' };
        } catch {
          /* next form */
        }
      }
    }
  } catch {
    /* fall through */
  }

  // Path 2: WebCrypto PKCS#8 (works under workerd).
  try {
    const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
    const key = await crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, false, ['sign']);
    const sig = await crypto.subtle.sign({ name: 'Ed25519' }, key, data);
    return { signature: Buffer.from(sig as ArrayBuffer).toString('base64'), alg: 'Ed25519' };
  } catch {
    return null;
  }
}

/** Verify an Ed25519 signature over canonical(payload), trying current + previous keys. */
async function ed25519Verify(env: Env, payload: Record<string, unknown>, signature: string): Promise<boolean> {
  const data = new TextEncoder().encode(canonical(payload));
  const sig = Buffer.from(signature, 'base64');
  const seeds = [env.REVIEW_SIGNING_KEY, env.REVIEW_SIGNING_KEY_PREV].filter(Boolean) as string[]
  for (const seedB64 of seeds) {
    const seed = Buffer.from(seedB64, 'base64')
    if (seed.length !== 32) continue
    const ok = await ed25519VerifyWithSeed(env, seed, data, sig)
    if (ok) return true
  }
  return false
}

async function ed25519VerifyWithSeed(env: Env, seed: Buffer, data: Uint8Array, sig: Buffer): Promise<boolean> {
  // Path 1: node:crypto.
  try {
    const key = ed25519PrivateKeyFromB64(seed.toString('base64'));
    if (key) {
      const publicKey = createPublicKey(key);
      for (const alg of [null, 'ed25519']) {
        try {
          if (verify(alg, data, publicKey, sig)) return true;
        } catch {
          /* next form */
        }
      }
    }
  } catch {
    /* fall through */
  }

  // Path 2: WebCrypto — derive the public key via JWK export, then verify.
  try {
    const der = Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), seed]);
    const priv = await crypto.subtle.importKey('pkcs8', der, { name: 'Ed25519' }, true, ['sign']);
    const jwk = (await crypto.subtle.exportKey('jwk', priv)) as { x?: string };
    if (!jwk.x) return false;
    const pubBuf = Uint8Array.from(atob(jwk.x.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
    const pubKey = await crypto.subtle.importKey('raw', pubBuf, { name: 'Ed25519' }, false, ['verify']);
    return await crypto.subtle.verify({ name: 'Ed25519' }, pubKey, sig, data);
  } catch {
    return false;
  }
}

async function signReview(env: Env, payload: Record<string, unknown>): Promise<{ signature: string; alg: 'Ed25519' } | null> {
  return ed25519Sign(env, payload);
}

// ─── N1: session-scoped capability tokens for write calls ──────────────────
// On a write-tool call the registry mints a short-TTL Ed25519-signed token
// scoped to {serverId, tool, principal}, attaches it to the upstream request,
// and logs issuance in the audit chain — the "capability-scoped credential
// provisioning" pattern the risk panel now truthfully advertises.

const CAP_TOKEN_TTL_SEC = 60;

async function mintCapabilityToken(env: Env, opts: { serverId: string; tool: string; principal: string }): Promise<{ token: string; exp: number } | null> {
  const exp = Math.floor(Date.now() / 1000) + CAP_TOKEN_TTL_SEC;
  const payload = { iss: 'p31-registry', aud: opts.serverId, sub: opts.principal, tool: opts.tool, exp };
  const signed = await ed25519Sign(env, payload);
  if (!signed) return null;
  return { token: [btoa(JSON.stringify({ alg: 'Ed25519', typ: 'capability' })), btoa(JSON.stringify(payload)), signed.signature].join('.'), exp };
}

// ─── Governance: rate limiting helper (per-IP) ─────────────────────────────

async function rateLimited(env: Env, request: Request, key: string, max: number, windowSec: number): Promise<boolean> {
  const ip = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const k = KV_RATELIMIT_PREFIX + key + ':' + ip;
  const n = Number((await env.REGISTRY_KV.get(k)) ?? '0');
  if (n >= max) return true;
  await env.REGISTRY_KV.put(k, String(n + 1), { expirationTtl: windowSec });
  return false;
}

// Risk heuristic: a tool is write-capable if its name implies mutation.
const WRITE_RE = /(create|write|update|delete|remove|send|execute|deploy|mint|sign|issue|lock|unlock|place|clear|trigger|call|pay|offer|accept|dispute|set|put|post|save|submit|start|stop|rotate|transfer|withdraw|deposit|invite|publish)/i;

function toolRisk(t: ToolDef): 'read' | 'write' {
  if (WRITE_RE.test(t.name)) return 'write';
  return 'read';
}

function inferReadOnlySafe(tools: ToolDef[]): boolean {
  return tools.length > 0 && tools.every((t) => toolRisk(t) === 'read');
}

async function summary(env: Env, entry: McpServerEntry, schemas: ToolDef[], health: HealthRecord) {
  const [drift, scan, capabilities] = await Promise.all([
    checkDrift(env, entry, schemas),
    getScanMeta(env, entry, schemas),
    getCapabilityMeta(env, entry, schemas),
  ]);
  return {
    id: entry.id,
    name: entry.name,
    endpoint: entry.endpoint,
    kind: entry.kind,
    category: entry.category,
    description: entry.description,
    tags: entry.tags,
    author: entry.author,
    icon: entry.icon,
    status: entry.status,
    verify: entry.verify,
    review: entry.review,
    scan,
    needsReview: entry.needsReview,
    capabilities,
    readOnlySafe: entry.readOnlySafe,
    health: health.status,
    healthDetail: health.detail,
    latencyMs: health.latencyMs,
    checkedAt: health.checkedAt,
    toolCount: schemas.length,
    tools: schemas.map((t) => t.name),
    localNote: entry.localNote,
    contentHash: drift.current,
    baselineHash: drift.baseline,
    drifted: drift.drifted,
  };
}

async function buildSummaries(env: Env, entries: McpServerEntry[]): Promise<Awaited<ReturnType<typeof summary>>[]> {
  return Promise.all(
    entries.map(async (e) => {
      const [schemas, health] = await Promise.all([getToolSchemas(env, e), probeHealth(env, e)]);
      return summary(env, e, schemas, health);
    }),
  );
}

// ─── Route handlers ─────────────────────────────────────────────────────────

async function handleHealth(env: Env): Promise<Response> {
  const entries = await getAllEntries(env);
  const remote = entries.filter((e) => e.kind === 'remote');
  const live = (await Promise.all(remote.map((e) => probeHealth(env, e)))).filter((h) => h.status === 'up').length;
  const categories: Record<string, number> = {};
  for (const e of entries) categories[e.category] = (categories[e.category] ?? 0) + 1;
  return json({
    status: 'ok',
    service: 'mcp-registry',
    servers: entries.length,
    remote: remote.length,
    local: entries.length - remote.length,
    liveUp: live,
    categories,
  });
}

async function handleListServers(env: Env, url: URL): Promise<Response> {
  const q = (url.searchParams.get('q') ?? '').toLowerCase().trim();
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');
  const kind = url.searchParams.get('kind');

  const entries = await getAllEntries(env);
  const filtered = entries.filter((e) => {
    if (category && e.category !== category) return false;
    if (status && e.status !== status) return false;
    if (kind && e.kind !== kind) return false;
    if (q) {
      const hay = `${e.name} ${e.description} ${e.tags.join(' ')} ${e.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const summaries = await buildSummaries(env, filtered);
  return json({ servers: summaries, count: summaries.length, filters: { q, category, status, kind } });
}

async function handleCategories(env: Env): Promise<Response> {
  const entries = await getAllEntries(env);
  const summaries = await buildSummaries(env, entries);
  const byCat = new Map<Category, { id: Category; count: number; toolCount: number }>();
  for (const s of summaries) {
    const cur = byCat.get(s.category) ?? { id: s.category, count: 0, toolCount: 0 };
    cur.count += 1;
    cur.toolCount += s.toolCount;
    byCat.set(s.category, cur);
  }
  const categories = [...byCat.values()].sort((a, b) => b.count - a.count);
  return json({ categories });
}

async function findEntry(env: Env, id: string): Promise<McpServerEntry | null> {
  const entries = await getAllEntries(env);
  return entries.find((e) => e.id === id || e.name === id) ?? null;
}

async function handleServerDetail(env: Env, id: string): Promise<Response> {
  const entry = await findEntry(env, id);
  if (!entry) return json({ error: 'server not found' }, 404);
  const [schemas, health] = await Promise.all([getToolSchemas(env, entry), probeHealth(env, entry)]);
  const baselineRaw = await env.REGISTRY_KV.get(KV_BASELINE_SCHEMAS_PREFIX + entry.id);
  const baselineTools = baselineRaw ? JSON.parse(baselineRaw) : null;
  return json({ ...(await summary(env, entry, schemas, health)), tools: schemas.map((t) => ({ ...t, risk: toolRisk(t) })), baselineTools });
}

async function handleServerTools(env: Env, id: string): Promise<Response> {
  const entry = await findEntry(env, id);
  if (!entry) return json({ error: 'server not found' }, 404);
  const schemas = await getToolSchemas(env, entry);
  return json({ server: entry.id, tools: schemas.map((t) => ({ ...t, risk: toolRisk(t) })) });
}

async function handleServerHealth(env: Env, id: string): Promise<Response> {
  const entry = await findEntry(env, id);
  if (!entry) return json({ error: 'server not found' }, 404);
  const health = await probeHealth(env, entry);
  return json({ id: entry.id, status: entry.status, health, readOnlySafe: entry.readOnlySafe, category: entry.category });
}

async function handleRegister(env: Env, request: Request): Promise<Response> {
  // Registration is community-open (anonymous allowed) but liveness-,
  // scanner-, and review-gated. RBAC governs moderation + admin surfaces.
  if (await rateLimited(env, request, 'register', RATE_LIMIT_MAX, RATE_LIMIT_WINDOW)) {
    return json({ error: `rate limited — ${RATE_LIMIT_MAX} registrations per ${RATE_LIMIT_WINDOW / 3600}h per IP` }, 429);
  }

  const body: any = await request.json().catch(() => null);
  if (!body) return json({ error: 'invalid JSON body' }, 400);

  const { id, name, endpoint, category, description, tags, author, capabilities, quota, monetized } = body as Partial<McpServerEntry>;
  if (!id || !name || !endpoint || !category || !description) {
    return json({ error: 'required: id, name, endpoint, category, description' }, 400);
  }
  if (!['design', 'crypto', 'government', 'finance', 'social', 'infra', 'local'].includes(category)) {
    return json({ error: `invalid category: ${category}` }, 400);
  }
  if (!/^https:\/\//.test(endpoint)) {
    return json({ error: 'endpoint must be an https:// URL (local servers cannot self-register from the edge)' }, 400);
  }
  const existing = await getAllEntries(env);
  if (existing.some((e) => e.id === id || e.name === name)) {
    return json({ error: `server id/name already exists: ${id}` }, 409);
  }

  // Liveness validation: must pass initialize (with a supported protocol
  // version) and return a tools/list array.
  const candidate: McpServerEntry = {
    id,
    name,
    endpoint,
    kind: 'remote',
    category: category as Category,
    description,
    tags: Array.isArray(tags) ? tags.map(String) : [],
    author: String(author ?? 'anonymous'),
    icon: undefined,
    status: 'unverified',
    verify: { alg: 'ML-DSA-65', checkedAt: new Date().toISOString() },
    capabilities,
    quota,
    monetized: Boolean(monetized),
    readOnlySafe: false,
  };

  const { tools, detail } = await probeEndpoint(env, candidate);
  if (tools === null) {
    return json({ error: `liveness check failed: ${detail ?? 'tools/list did not return a tool list'}` }, 400);
  }
  candidate.readOnlySafe = inferReadOnlySafe(tools);

  // A1 — tool-description scanner (tool poisoning defense).
  const scan = scanToolSurface(tools as Array<{ name: string; description?: string }>);
  candidate.scan = { verdict: scan.worst, score: 0, maliciousCount: scan.maliciousCount, suspiciousCount: scan.suspiciousCount, scannedAt: new Date().toISOString() };
  if (scan.worst === 'malicious') {
    // Reject outright and record in the rejected registry (transparency).
    const rejectedRaw = await env.REGISTRY_KV.get(KV_REJECTED);
    const rejected: McpServerEntry[] = rejectedRaw ? JSON.parse(rejectedRaw) : [];
    rejected.push({ ...candidate, status: 'down', review: undefined, verify: { alg: 'ML-DSA-65', checkedAt: new Date().toISOString() } });
    await env.REGISTRY_KV.put(KV_REJECTED, JSON.stringify(rejected.slice(-200)));
    void appendTransparency(env, { event: 'rejected', serverId: candidate.id, detail: `scanner verdict: malicious (${scan.maliciousCount} tools)` }).catch(() => {});
    return json({ error: 'registration rejected — tool-description scanner flagged malicious content', scan: candidate.scan }, 400);
  }
  if (scan.worst === 'suspicious') candidate.needsReview = true;

  // A4 — capability manifest attestation: declared tools vs observed tools.
  const observedNames = tools.map((t: any) => String(t.name));
  let manifestMismatch: string[] = [];
  if (capabilities?.tools?.length) {
    const declared = new Set(capabilities.tools);
    manifestMismatch = observedNames.filter((n) => !declared.has(n));
    // H1b — declared vs derived writeCapable mismatch is a verification flag.
    const derived = deriveCapabilities(tools as ToolDef[]);
    if (capabilities.writeCapable !== undefined && capabilities.writeCapable !== derived.writeCapable) {
      manifestMismatch.push(`writeCapable: declared ${capabilities.writeCapable}, observed ${derived.writeCapable}`);
    }
    if (manifestMismatch.length > 0) candidate.needsReview = true;
  }

  // Baseline content hash for drift detection (A4 / B2).
  const baselineHash = toolsHash(tools as ToolDef[]);
  await env.REGISTRY_KV.put(KV_BASELINE_PREFIX + candidate.id, baselineHash);
  // Baseline tool surface (name + description) so the portal can diff later.
  await env.REGISTRY_KV.put(KV_BASELINE_SCHEMAS_PREFIX + candidate.id, JSON.stringify(tools.map((t: any) => ({ name: String(t.name), description: String(t.description ?? '') }))));

  const registeredRaw = await env.REGISTRY_KV.get(KV_REGISTERED);
  const registered: McpServerEntry[] = registeredRaw ? JSON.parse(registeredRaw) : [];
  registered.push(candidate);
  await env.REGISTRY_KV.put(KV_REGISTERED, JSON.stringify(registered));
  await env.REGISTRY_KV.delete(KV_SCHEMAS_PREFIX + candidate.id);
  await env.REGISTRY_KV.delete(KV_HEALTH_PREFIX + candidate.id);
  void appendTransparency(env, { event: 'registered', serverId: candidate.id, detail: `${scan.worst} scan · ${observedNames.length} tools` }).catch(() => {});

  return json(
    { ...(await summary(env, candidate, tools as ToolDef[], await probeHealth(env, candidate))), note: 'registered as unverified — pending P31 review', scan: candidate.scan, needsReview: candidate.needsReview, manifestMismatch },
    201,
  );
}

async function handleCall(env: Env, id: string, request: Request): Promise<Response> {
  const entry = await findEntry(env, id);
  if (!entry) return json({ error: 'server not found' }, 404);
  if (entry.kind === 'local') return json({ error: 'local server not reachable from the edge' }, 503);

  const bodyText = await request.text().catch(() => '');
  const sizeCheck = validateBodySize(bodyText);
  if (!sizeCheck.ok) return json({ error: { code: -32000, message: sizeCheck.reason } }, 413);
  let body: any = null
  try { body = JSON.parse(bodyText || 'null') } catch { body = null }
  if (!body) return json({ error: 'invalid JSON body' }, 400);

  const toolName = body?.params?.name ?? (typeof body?.name === 'string' ? body.name : 'unknown');
  const args = body?.params?.arguments ?? body?.arguments ?? {};
  const r = await proxyToolCall(env, entry, String(toolName), (args as Record<string, unknown>) ?? {}, request);
  return json(r.body, r.status, r.rlHeaders ?? {});
}

/**
 * Shared guarded proxy path — used by BOTH the REST /servers/:id/call handler
 * and the MCP-native call_tool surface, so every proxied invocation gets the
 * same: REQUIRE_AUTH_WRITE gate → sanitizer → per-tool quota → capability
 * token → signed audit entry → OTLP event.
 */
async function proxyToolCall(
  env: Env,
  entry: McpServerEntry,
  toolName: string,
  args: Record<string, unknown>,
  request: Request,
): Promise<{ ok: boolean; status: number; rlHeaders?: Record<string, string>; body: unknown }> {
  const risk = toolRisk({ name: toolName });

  if (env.REQUIRE_AUTH_WRITE === '1' && risk === 'write') {
    const principal = await resolvePrincipal(env, request)
    if (principal === 'anonymous') {
      return { ok: false, status: 401, body: { error: { code: -32000, message: 'write tools require an authenticated principal' } } }
    }
  }

  const toolSchema = (await getToolSchemas(env, entry)).find((t) => t.name === toolName)?.inputSchema;
  const sanitized = validateArgs(args, toolSchema as { properties?: Record<string, { type?: string }> });
  if (!sanitized.ok) {
    const ip = (request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
    const rlKey = KV_RATELIMIT_PREFIX + 'sanitizer:' + ip;
    const rl = Number((await env.REGISTRY_KV.get(rlKey)) ?? '0');
    await env.REGISTRY_KV.put(rlKey, String(rl + 1), { expirationTtl: 3600 });
    if (rl >= 100) return { ok: false, status: 429, body: { error: { code: -32029, message: 'too many rejected requests from this client' } } };
    const k = KV_REJECTIONS_PREFIX + `${entry.id}:${toolName}`;
    const n = Number((await env.REGISTRY_KV.get(k)) ?? '0');
    await env.REGISTRY_KV.put(k, String(n + 1), { expirationTtl: 600 });
    void emitOtlpEvent(env, 'tool_rejected', { serverId: entry.id, tool: toolName, reason: sanitized.reason, status: String(sanitized.status) }).catch(() => {});
    return { ok: false, status: sanitized.status, body: { error: { code: -32000, message: `rejected: ${sanitized.reason}`, field: sanitized.field } } };
  }

  const quota = await enforceToolQuota(env, request, entry, toolName, risk);
  const rlHeaders = {
    'X-RateLimit-Limit': String(quota.limit),
    'X-RateLimit-Remaining': String(quota.remaining),
    'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + quota.windowSec),
  };
  if (!quota.ok) {
    const msg = quota.status === 402
      ? { error: { code: -32029, message: `quota exhausted for ${toolName} — upgrade plan` } }
      : { error: { code: -32029, message: `rate limited — ${toolName} (${quota.limit}/min)` } };
    return { ok: false, status: quota.status, rlHeaders, body: msg };
  }

  const start = Date.now();
  let capToken: { token: string; exp: number } | null = null;
  const extraHeaders: Record<string, string> = {};
  if (risk === 'write') {
    capToken = await mintCapabilityToken(env, { serverId: entry.id, tool: toolName, principal: await resolvePrincipal(env, request) });
    if (capToken) extraHeaders['X-Capability-Token'] = capToken.token;
  }
  const res = await rpcCall(env, entry, 'tools/call', { name: toolName, arguments: args }, 10000, extraHeaders);
  const latencyMs = Date.now() - start;
  const ok = !res.error;

  await appendAudit(env, {
    serverId: entry.id,
    tool: toolName,
    risk,
    args,
    latencyMs,
    status: ok ? 'done' : 'error',
    capToken: capToken ? { aud: entry.id, tool: toolName, exp: capToken.exp } : undefined,
  });
  void emitOtlpEvent(env, 'tool_result', { serverId: entry.id, tool: toolName, ok, latencyMs }).catch(() => {});

  if (!ok) return { ok: false, status: 502, rlHeaders, body: { error: res.error, errorCode: res.error?.code } };
  return { ok: true, status: 200, rlHeaders, body: res.result };
}

// ─── Governance: community moderation queue ─────────────────────────────────

async function handlePending(env: Env, request: Request): Promise<Response> {
  const auth = await requireRole(request, env, ['reviewer', 'admin']); if (!auth.ok) return roleError(auth);
  const registeredRaw = await env.REGISTRY_KV.get(KV_REGISTERED);
  const registered: McpServerEntry[] = registeredRaw ? JSON.parse(registeredRaw) : [];
  const pending = registered.filter((e) => e.status === 'unverified');
  return json({ pending: pending.length, servers: pending.map((e) => ({ id: e.id, name: e.name, endpoint: e.endpoint, category: e.category, description: e.description, tags: e.tags, author: e.author, readOnlySafe: e.readOnlySafe, verify: e.verify })) });
}

async function handleReview(env: Env, id: string, request: Request): Promise<Response> {
  const auth = await requireRole(request, env, ['reviewer', 'admin']); if (!auth.ok) return roleError(auth);
  const body: any = await request.json().catch(() => null);
  const action = body?.action;
  if (action !== 'approve' && action !== 'reject') return json({ error: 'action must be "approve" or "reject"' }, 400);

  const registeredRaw = await env.REGISTRY_KV.get(KV_REGISTERED);
  const registered: McpServerEntry[] = registeredRaw ? JSON.parse(registeredRaw) : [];
  const idx = registered.findIndex((e) => e.id === id || e.name === id);
  if (idx === -1) return json({ error: 'server not found (must be a registered community entry)' }, 404);
  const entry = registered[idx];

  if (action === 'reject') {
    registered.splice(idx, 1);
    await env.REGISTRY_KV.put(KV_REGISTERED, JSON.stringify(registered));
    const rejectedRaw = await env.REGISTRY_KV.get(KV_REJECTED);
    const rejected: McpServerEntry[] = rejectedRaw ? JSON.parse(rejectedRaw) : [];
    rejected.push({ ...entry, status: 'down', verify: { alg: 'ML-DSA-65', checkedAt: new Date().toISOString() } });
    await env.REGISTRY_KV.put(KV_REJECTED, JSON.stringify(rejected.slice(-200)));
    await env.REGISTRY_KV.delete(KV_SCHEMAS_PREFIX + entry.id);
    await env.REGISTRY_KV.delete(KV_HEALTH_PREFIX + entry.id);
    void appendLog(env, { level: 'info', method: 'POST', path: `/servers/${id}/review`, status: 200, latencyMs: 0, serverId: id });
    return json({ id: entry.id, action: 'rejected', note: body?.note ?? null });
  }

  // approve → live, with an Ed25519-signed review record.
  const checkedAt = new Date().toISOString();
  const signed = await signReview(env, { id: entry.id, name: entry.name, endpoint: entry.endpoint, category: entry.category, action: 'approve', checkedAt });
  registered[idx] = {
    ...entry,
    status: 'live',
    verify: { alg: 'ML-DSA-65', checkedAt },
    review: signed ? { ...signed, signedBy: 'p31-registry', checkedAt } : undefined,
  };
  await env.REGISTRY_KV.put(KV_REGISTERED, JSON.stringify(registered));
  await env.REGISTRY_KV.delete(KV_SCHEMAS_PREFIX + entry.id);
  await env.REGISTRY_KV.delete(KV_HEALTH_PREFIX + entry.id);
  // Baseline the reviewed surface so future drift is diffable.
  const current = await getToolSchemas(env, entry);
  await env.REGISTRY_KV.put(KV_BASELINE_PREFIX + entry.id, toolsHash(current));
  await env.REGISTRY_KV.put(KV_BASELINE_SCHEMAS_PREFIX + entry.id, JSON.stringify(current.map((t) => ({ name: t.name, description: t.description ?? '' }))));
  void appendTransparency(env, { event: 'approved', serverId: entry.id, detail: `signed by ${signed?.alg ?? 'none'} @ ${checkedAt}` }).catch(() => {});
  void appendLog(env, { level: 'info', method: 'POST', path: `/servers/${id}/review`, status: 200, latencyMs: 0, serverId: id });
  return json({ id: entry.id, action: 'approved', status: 'live', review: registered[idx].review ?? null });
}

// ─── Observability: audit, structured logs, error ingestion ────────────────

async function handleAudit(env: Env, request: Request): Promise<Response> {
  const { log, head, source } = await readLedger(env, 'audit', KV_AUDIT_LOG, KV_AUDIT_HEAD);
  const verify = await verifyAuditChain(env, log); // chain over the returned source
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') ?? '50'), 500);
  const entries = log.slice(-limit);
  if (new URL(request.url).searchParams.get('verify') === 'signatures') {
    // Re-verify each returned entry's Ed25519 signature over its canonical body.
    const sigResults = await Promise.all(
      entries.map(async (e) => ({
        seq: e.seq,
        signed: Boolean(e.sig),
        valid: e.sig ? await ed25519Verify(env, { prev: e.prev, seq: e.seq, ts: e.ts, serverId: e.serverId, tool: e.tool, risk: e.risk, args: e.args, latencyMs: e.latencyMs, status: e.status, capToken: e.capToken }, e.sig) : false,
      })),
    );
    return json({ chain: verify, head, entries, source, signatureCheck: sigResults });
  }
  return json({ chain: verify, head, entries, source });
}

async function handleAuditExport(env: Env, _request: Request): Promise<Response> {
  const { log, head, source } = await readLedger(env, 'audit', KV_AUDIT_LOG, KV_AUDIT_HEAD);
  const lines = log.map((e) => JSON.stringify(e)).join('\n')
  const body = `# P31 MCP audit chain — ${log.length} entries · head ${head} · source ${source}\n${lines}\n`
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="p31-mcp-audit.ndjson"',
      ...corsHeaders(),
    },
  })
}

async function handleTransparency(env: Env, request: Request): Promise<Response> {
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') ?? '50'), 500);
  const { log, head, source } = await readLedger(env, 'transparency', KV_TRANSPARENCY_LOG, KV_TRANSPARENCY_HEAD);
  let prev = 'GENESIS';
  let ok = true;
  for (const e of log) {
    const body = { prev, seq: e.seq, ts: e.ts, event: e.event, serverId: e.serverId, detail: e.detail };
    const recomputed = await sha256Hex(canonical(body));
    if (recomputed !== e.hash) { ok = false; break; }
    prev = e.hash;
  }
  return json({ chain: { ok, checked: log.length, head: prev }, events: log.slice(-limit), source });
}

async function handleLogs(env: Env, request: Request): Promise<Response> {
  const adminAuth = await requireAdmin(request, env); if (!adminAuth.ok) return roleError(adminAuth);
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') ?? '100'), 500);
  const raw = await env.REGISTRY_KV.get(KV_LOGS);
  const log: LogEvent[] = raw ? JSON.parse(raw) : [];
  return json({ events: log.slice(-limit) });
}

async function handleErrors(env: Env, request: Request): Promise<Response> {
  const adminAuth = await requireAdmin(request, env); if (!adminAuth.ok) return roleError(adminAuth);
  const limit = Math.min(Number(new URL(request.url).searchParams.get('limit') ?? '100'), 500);
  const raw = await env.REGISTRY_KV.get(KV_ERRORS);
  const log: ErrorEvent[] = raw ? JSON.parse(raw) : [];
  return json({ events: log.slice(-limit) });
}

async function handleIngestError(env: Env, request: Request): Promise<Response> {
  if (await rateLimited(env, request, 'ingest', 300, 3600)) return json({ error: 'rate limited' }, 429);
  const body: any = await request.json().catch(() => null);
  if (!body) return json({ error: 'invalid JSON body' }, 400);
  const events = Array.isArray(body?.events) ? body.events : [body];
  for (const raw of events.slice(0, 20)) {
    const ev = {
      source: String(raw?.source ?? 'unknown').slice(0, 80),
      message: String(raw?.message ?? '').slice(0, 500),
      stack: raw?.stack ? String(raw.stack).slice(0, 2000) : undefined,
      url: raw?.url ? String(raw.url).slice(0, 300) : undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
    };
    await appendError(env, ev);
  }
  return json({ ok: true, ingested: events.length });
}

// ─── C2: anomaly detection ──────────────────────────────────────────────────

async function handleAnomalies(env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return roleError(auth);
  const findings: Array<{ type: string; severity: 'low' | 'medium' | 'high'; serverId?: string; detail: string }> = [];
  const cutoff = Date.now() - 300_000; // 5-minute window

  // 1) error-rate spikes per server (from structured logs).
  const logsRaw = await env.REGISTRY_KV.get(KV_LOGS);
  const logs: LogEvent[] = logsRaw ? JSON.parse(logsRaw) : [];
  const recentErrors = logs.filter((e) => new Date(e.ts).getTime() > cutoff && e.status >= 500);
  const errByServer = new Map<string, number>();
  for (const e of recentErrors) errByServer.set(e.serverId ?? '?', (errByServer.get(e.serverId ?? '?') ?? 0) + 1);
  for (const [sid, n] of errByServer) {
    if (n >= 5) findings.push({ type: 'error_spike', severity: n >= 20 ? 'high' : 'medium', serverId: sid, detail: `${n} 5xx responses in the last 5 minutes` });
  }

  // 2) call-frequency spikes per server/tool (from structured logs paths).
  const recentCalls = logs.filter((e) => new Date(e.ts).getTime() > cutoff && e.method === 'POST' && /^\/servers\/[^/]+\/call$/.test(e.path));
  const callByServer = new Map<string, number>();
  for (const e of recentCalls) callByServer.set(e.serverId ?? '?', (callByServer.get(e.serverId ?? '?') ?? 0) + 1);
  for (const [sid, n] of callByServer) {
    if (n >= 50) findings.push({ type: 'call_spike', severity: 'high', serverId: sid, detail: `${n} proxied calls in the last 5 minutes` });
  }

  // N2 — sanitizer rejection hotspots (rejections:<serverId>:<toolName> counter),
  // paginated so KV's 1000-key list limit never silently truncates findings.
  let cursor: string | undefined
  let scanned = 0
  do {
    const rejList = await env.REGISTRY_KV.list({ prefix: KV_REJECTIONS_PREFIX, cursor, limit: 1000 })
    cursor = rejList.list_complete ? undefined : rejList.cursor
    for (const key of rejList.keys) {
      scanned++
      const v = await env.REGISTRY_KV.get(key.name).catch(() => null)
      const n = Number(v ?? '0')
      if (n >= 5) {
        const [, sid, tool] = key.name.split(':')
        findings.push({ type: 'sanitizer_rejections', severity: 'medium', serverId: sid ?? undefined, detail: `${n} rejected calls for ${tool ?? key.name} in the last 10 minutes` })
      }
      if (scanned >= 5000) break
    }
  } while (cursor && scanned < 5000)

  // 3) write-tool calls against read-only-safe servers (from the audit log).
  const entries = await getAllEntries(env);
  const roServers = new Map(entries.filter((e) => e.readOnlySafe).map((e) => [e.id, true]));
  const auditRaw = await env.REGISTRY_KV.get(KV_AUDIT_LOG);
  const audit: AuditEntry[] = auditRaw ? JSON.parse(auditRaw) : [];
  const writeOnRO = audit.slice(-200).filter((e) => e.risk === 'write' && roServers.has(e.serverId));
  for (const e of writeOnRO.slice(0, 5)) {
    findings.push({ type: 'write_on_readonly', severity: 'medium', serverId: e.serverId, detail: `${e.tool} (write) invoked on a read-only-safe server @ ${e.ts}` });
  }

  return json({ findings, windowSec: 300, checkedAt: new Date().toISOString() });
}

async function handleMe(env: Env, request: Request): Promise<Response> {
  const role = await getRole(env, request);
  const principal = await resolveActingPrincipal(env, request);
  return json({
    principal,
    role,
    can: {
      publish: ROLE_RANK[role] >= ROLE_RANK.publisher,
      review: ROLE_RANK[role] >= ROLE_RANK.reviewer,
      admin: ROLE_RANK[role] >= ROLE_RANK.admin,
    },
  });
}

async function handleRoles(env: Env, request: Request): Promise<Response> {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return roleError(auth);
  const body: any = await request.json().catch(() => null);
  const { principal, group, role } = body ?? {};
  if (!['viewer', 'publisher', 'reviewer', 'admin'].includes(role)) {
    return json({ error: 'required: role (viewer|publisher|reviewer|admin) + principal OR group' }, 400);
  }
  if (group) {
    await env.REGISTRY_KV.put(KV_GROUP_ROLES_PREFIX + String(group), role);
    return json({ group, role, assigned: true });
  }
  if (!principal) {
    return json({ error: 'required: principal + role (or group + role)' }, 400);
  }
  await env.REGISTRY_KV.put(KV_ROLES_PREFIX + String(principal), role);
  return json({ principal, role, assigned: true });
}

// ─── MCP-native discovery surface + well-known server card ─────────────────
// The marketplace itself is an MCP server: agents can tools/list → list_servers
// → get_server → call_tool and consume the catalog via the protocol. This is
// the "marketplace for agents" premise, and it makes the marketplace
// registrable in MCP directories.

const MCP_SURFACE_TOOLS = [
  {
    name: 'list_servers',
    description: 'List the MCP marketplace catalog (optional category/status filter).',
    inputSchema: { type: 'object', properties: { category: { type: 'string', description: 'design|crypto|government|finance|social|infra|local' }, status: { type: 'string', description: 'live|unverified|degraded|down' } } },
  },
  {
    name: 'get_server',
    description: 'Get a server\'s detail + tool schemas by id.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'server id (e.g. p31-crypto, context7)' } }, required: ['id'] },
  },
  {
    name: 'call_tool',
    description: 'Invoke a tool on a registered server through the marketplace proxy (sanitized, audited, quota-gated).',
    inputSchema: { type: 'object', properties: { server: { type: 'string' }, tool: { type: 'string' }, arguments: { type: 'object' } }, required: ['server', 'tool'] },
  },
]

async function handleMcpSurface(env: Env, request: Request): Promise<Response> {
  const bodyText = await request.text().catch(() => '')
  let body: any = null
  try { body = JSON.parse(bodyText || 'null') } catch { body = null }
  const rpcId = body?.id ?? null
  const method = body?.method ?? ''
  const params = body?.params ?? {}

  if (method === 'initialize') {
    return json({ protocolVersion: PROBE_PROTOCOL_VERSION, capabilities: { tools: {} }, serverInfo: { name: 'p31-mcp-marketplace', version: '2.0.0' } })
  }
  if (method === 'notifications/initialized') {
    return new Response(null, { status: 200, headers: corsHeaders() })
  }
  if (method === 'tools/list') {
    return json({ tools: MCP_SURFACE_TOOLS })
  }
  if (method === 'tools/call') {
    const name = params?.name
    const args = params?.arguments ?? {}
    if (name === 'list_servers') {
      const u = new URL('https://registry.local/servers')
      if (args.category) u.searchParams.set('category', args.category)
      if (args.status) u.searchParams.set('status', args.status)
      const res = await handleListServers(env, u)
      const data: any = await res.json()
      return json({ content: [{ type: 'text', text: JSON.stringify(data.servers ?? []) }] })
    }
    if (name === 'get_server') {
      const entry = await findEntry(env, args.id)
      if (!entry) return json({ content: [{ type: 'text', text: JSON.stringify({ error: 'server not found' }) }] })
      const schemas = await getToolSchemas(env, entry)
      const health = await probeHealth(env, entry)
      const gov = await summary(env, entry, schemas, health)
      return json({ content: [{ type: 'text', text: JSON.stringify({ id: gov.id, name: gov.name, endpoint: gov.endpoint, status: gov.status, health: gov.health, toolCount: gov.toolCount, scan: gov.scan, review: gov.review, capabilities: gov.capabilities, drifted: gov.drifted, readOnlySafe: gov.readOnlySafe, tools: schemas.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) }) }] })
    }
    if (name === 'call_tool') {
      const entry = await findEntry(env, args.server)
      if (!entry) return json({ content: [{ type: 'text', text: JSON.stringify({ error: 'server not found' }) }], isError: true })
      const r = await proxyToolCall(env, entry, String(args.tool ?? ''), (args.arguments ?? {}) as Record<string, unknown>, request)
      if (!r.ok) return json({ content: [{ type: 'text', text: JSON.stringify(r.body) }], isError: true })
      const content = (r.body as any)?.content ?? [{ type: 'text', text: JSON.stringify(r.body) }]
      return json({ content })
    }
    return json({ error: { code: -32602, message: `unknown tool: ${name}` }, id: rpcId }, 400)
  }
  if (method === 'ping') return json({})
  return json({ error: { code: -32601, message: `method not found: ${method}` }, id: rpcId }, 400)
}

async function handleWellKnownMcp(env: Env): Promise<Response> {
  const card = {
    name: 'p31-mcp-marketplace',
    description: 'P31 MCP Marketplace — governed catalog of MCP servers with live health, tool schemas, scanner verdicts, and a sandboxed call proxy. Discover via list_servers/get_server, invoke via call_tool.',
    version: '2.0.0',
    endpoint: 'https://mcp-registry.trimtab-signal.workers.dev/mcp',
    transport: 'streamable-http',
    serverInfo: { name: 'p31-mcp-marketplace', version: '2.0.0' },
    capabilities: { tools: true },
    repository: 'https://github.com/p31labs/P31-local-workspace',
    homepage: 'https://mcp.p31ca.org',
    keywords: ['mcp', 'marketplace', 'registry', 'sovereign', 'post-quantum'],
    license: 'Apache-2.0',
  }
  return json(card)
}

// ─── HTML listing (kept light; the portal is the real UI) ──────────────────

function htmlPage(summaries: Array<Awaited<ReturnType<typeof summary>>>): string {
  const rows = summaries
    .map(
      (s) => `<tr>
        <td><span>${s.icon ?? ''}</span> <code>${s.id}</code></td>
        <td><span class="badge badge-${s.kind}">${s.kind}</span> <span class="badge badge-cat">${s.category}</span></td>
        <td>${s.description}</td>
        <td><span class="dot dot-${s.health}"></span> ${s.health}</td>
        <td>${s.toolCount}</td>
        <td><span class="badge badge-${s.status}">${s.status}</span></td>
        <td><a href="/servers/${s.id}">details</a></td>
      </tr>`,
    )
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>P31 MCP Registry</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0a0e17; color: #e0e6ed; padding: 2rem; }
    h1 { color: #00e5ff; margin-bottom: .25rem; }
    .subtitle { color: #7a8ba8; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: .6rem .8rem; border-bottom: 1px solid #1a2236; }
    th { color: #7a8ba8; font-weight: 600; }
    a { color: #00e5ff; text-decoration: none; }
    code { background: #141c2e; padding: 2px 6px; border-radius: 4px; font-size: .9em; }
    .badge { padding: 2px 8px; border-radius: 4px; font-size: .8em; font-weight: 600; }
    .badge-remote { background: #0d2b3e; color: #00e5ff; }
    .badge-local { background: #2b1d0d; color: #ffb74d; }
    .badge-cat { background: #17243a; color: #a78bfa; }
    .badge-live { background: #0d2b1e; color: #34d399; }
    .badge-unverified { background: #2b1d0d; color: #fbbf24; }
    .badge-degraded { background: #2b2410; color: #fbbf24; }
    .badge-down { background: #2b0d0d; color: #fb7185; }
    .dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
    .dot-up { background: #34d399; }
    .dot-degraded { background: #fbbf24; }
    .dot-down { background: #fb7185; }
    .footer { margin-top: 2rem; color: #556; font-size: .85em; }
  </style>
</head>
<body>
  <h1>P31 MCP Registry</h1>
  <p class="subtitle">Marketplace catalog for ${summaries.length} MCP servers — live-probed</p>
  <table>
    <thead><tr><th>Server</th><th>Type</th><th>Description</th><th>Health</th><th>Tools</th><th>Status</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="footer">
    <a href="/servers">JSON API</a> &middot;
    <a href="/categories">Categories</a> &middot;
    <a href="/health">Health</a> &middot;
    API: GET /servers, GET /servers/:name, GET /servers/:name/tools, POST /servers (register), POST /servers/:name/call
  </p>
</body>
</html>`;
}

// ─── Request router ─────────────────────────────────────────────────────────

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

    if (url.pathname === '/health') return handleHealth(env);

  // MCP-native discovery surface + well-known card
  if (url.pathname === '/mcp' && request.method === 'POST') return handleMcpSurface(env, request);
  if (url.pathname === '/mcp' && request.method === 'GET') {
    return new Response('event: endpoint\ndata: {"mcp":"p31-mcp-marketplace"}\n\n', { headers: { 'Content-Type': 'text/event-stream', ...corsHeaders() } });
  }
  if (url.pathname === '/.well-known/mcp/server-card.json' || url.pathname === '/.well-known/mcp') return handleWellKnownMcp(env);

  if (url.pathname === '/categories' && request.method === 'GET') return handleCategories(env);

  // Observability
  if (url.pathname === '/audit' && request.method === 'GET') return handleAudit(env, request);
  if (url.pathname === '/audit/export' && request.method === 'GET') return handleAuditExport(env, request);
  if (url.pathname === '/transparency' && request.method === 'GET') return handleTransparency(env, request);
  if (url.pathname === '/logs' && request.method === 'GET') return handleLogs(env, request);
  if (url.pathname === '/errors' && request.method === 'GET') return handleErrors(env, request);
  if (url.pathname === '/anomalies' && request.method === 'GET') return handleAnomalies(env, request);
  if (url.pathname === '/ingest/errors' && request.method === 'POST') return handleIngestError(env, request);

  // Moderation queue
  if (url.pathname === '/servers/pending' && request.method === 'GET') return handlePending(env, request);

  // RBAC identity + role management
  if (url.pathname === '/me' && request.method === 'GET') return handleMe(env, request);
  if (url.pathname === '/roles' && request.method === 'POST') return handleRoles(env, request);

  if (url.pathname === '/servers' && request.method === 'GET') return handleListServers(env, url);
  if (url.pathname === '/servers' && request.method === 'POST') return handleRegister(env, request);

  if (url.pathname === '/' && request.method === 'GET') {
    const entries = await getAllEntries(env);
    const summaries = await buildSummaries(env, entries);
    return new Response(htmlPage(summaries), {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() },
    });
  }

  const reviewMatch = url.pathname.match(/^\/servers\/([^/]+)\/review$/);
  if (reviewMatch && request.method === 'POST') return handleReview(env, decodeURIComponent(reviewMatch[1]), request);

  const detailMatch = url.pathname.match(/^\/servers\/([^/]+)$/);
  if (detailMatch && request.method === 'GET') return handleServerDetail(env, decodeURIComponent(detailMatch[1]));

  const toolsMatch = url.pathname.match(/^\/servers\/([^/]+)\/tools$/);
  if (toolsMatch && request.method === 'GET') return handleServerTools(env, decodeURIComponent(toolsMatch[1]));

  const healthMatch = url.pathname.match(/^\/servers\/([^/]+)\/health$/);
  if (healthMatch && request.method === 'GET') return handleServerHealth(env, decodeURIComponent(healthMatch[1]));

  const callMatch = url.pathname.match(/^\/servers\/([^/]+)\/call$/);
  if (callMatch && request.method === 'POST') return handleCall(env, decodeURIComponent(callMatch[1]), request);

  return json({ error: 'not found' }, 404);
}

async function handleFetch(request: Request, env: Env): Promise<Response> {
  const start = Date.now();
  const res = await handleRequest(request, env);
  // Structured observability: one JSON line per request (best-effort, never
  // blocks the response). Call proxy entries additionally land in /audit.
  const url = new URL(request.url);
  void appendLog(env, {
    level: res.status >= 500 ? 'error' : res.status >= 400 ? 'warn' : 'info',
    method: request.method,
    path: url.pathname,
    status: res.status,
    latencyMs: Date.now() - start,
    serverId: url.pathname.match(/^\/servers\/([^/]+)/)?.[1],
  }).catch(() => {});
  return res;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return handleFetch(request, env);
  },
};

// Named exports for tests / internal reuse. The Worker runtime only uses the
// default `fetch` export; these are harmless to ship.
export const __internal = {
  handleRequest,
  handleFetch,
  toolRisk,
  inferReadOnlySafe,
  summary,
  rpcCall,
  probeTools,
  probeEndpoint,
  probeHealth,
  getToolSchemas,
  sha256Hex,
  appendAudit,
  verifyAuditChain,
  appendTransparency,
  appendLog,
  appendError,
  ed25519Sign,
  ed25519Verify,
  signReview,
  rateLimited,
  enforceToolQuota,
  checkDrift,
  toolsHash,
  scanToolSurface,
  deriveCapabilities,
  mintCapabilityToken,
  getScanMeta,
  getCapabilityMeta,
  validateArgs,
  validateBodySize,
  ledgerStub,
  readLedger,
  getRole,
  resolvePrincipal,
  requireRole,
  verifyAccessJwt,
  OFFICIAL_CATALOG,
  PROBE_PROTOCOL_VERSION,
  SUPPORTED_PROTOCOL_VERSIONS,
};