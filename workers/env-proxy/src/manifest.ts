// env-proxy manifest — worker -> declared required secrets, built from the
// curated wrangler.toml files (Phase 1 scope).
//
// Source convention: a `secrets.required` TOML property is the formal
// declaration. Where a wrangler.toml declares secrets instead via the empty-var
// pattern (`X = ""  # set via wrangler secret put X`) or an inline comment,
// those names are promoted into `required` below. Workers with no declaration
// get required = [].
//
// Deployed script names differ from repo directory names in two cases:
//   dir auto-compounder  -> script p31-auto-compounder
//   dir alerting         -> script monetization-alerting
// `worker` always carries the DEPLOYED script name (what the CF API queries).

export type Scope = 'capital' | 'mcp'
export interface WorkerEntry {
  worker: string
  scope: Scope
  required: string[]
  /** wrangler.toml source path this entry was derived from (for provenance). */
  source: string
  /** declared-but-conditional secrets that are NOT in `required` (kept for humans). */
  conditional?: string[]
}

export const MANIFEST: WorkerEntry[] = [
  // ---- P31-local-workspace/workers (mcp scope) ----
  { worker: 'bros', scope: 'mcp', required: [], source: 'workers/bros/wrangler.toml' },
  { worker: 'dads', scope: 'mcp', required: [], source: 'workers/dads/wrangler.toml' },
  { worker: 'marketplace-mcp', scope: 'mcp', required: [], source: 'workers/marketplace-mcp/wrangler.toml' },
  { worker: 'p31-crypto-mcp', scope: 'mcp', required: [], source: 'workers/p31-crypto-mcp/wrangler.toml' },
  { worker: 'p31-justice-hub', scope: 'mcp', required: [], source: 'workers/p31-justice-hub/wrangler.toml' },
  { worker: 'music-maker-mcp', scope: 'mcp', required: [], source: 'workers/music-maker-mcp/wrangler.toml' },
  { worker: 'phenix-wallet-mcp', scope: 'mcp', required: [], source: 'workers/phenix-wallet-mcp/wrangler.toml' },
  {
    worker: 'mcp-x402-gateway',
    scope: 'mcp',
    // Comment "Secrets (wrangler secret put), never in code" + empty var
    // ENTITLEMENT_API_TOKEN = "" (# set via wrangler secret put). LOVE_AUTH_SECRET
    // is bound via [[secrets_store_secrets]] (Secrets Store), not a script secret.
    required: ['ENTITLEMENT_API_TOKEN', 'FACILITATOR_KEY_ID', 'FACILITATOR_SECRET_KEY', 'REVENUE_API_TOKEN'],
    source: 'workers/mcp-x402-gateway/wrangler.toml',
  },
  { worker: 'p31-mcp-server', scope: 'mcp', required: [], source: 'workers/p31-mcp-server/wrangler.toml' },
  { worker: 'p31-design-mcp', scope: 'mcp', required: [], source: 'workers/design-mcp/wrangler.toml' },
  { worker: 'spaceship-relay', scope: 'mcp', required: [], source: 'packages/spaceship-earth/wrangler.toml' },

  // ---- p31-capital-machine/workers (capital scope) ----
  {
    worker: 'entitlement',
    scope: 'capital',
    required: ['HONEYCOMB_API_KEY'],
    conditional: ['CDP_API_KEY_ID', 'CDP_API_KEY_SECRET', 'X402_SELF_HOSTED_URL'],
    source: 'p31-capital-machine/workers/entitlement/wrangler.toml',
  },
  { worker: 'revenue-ledger', scope: 'capital', required: [], source: 'p31-capital-machine/workers/revenue-ledger/wrangler.toml' },
  { worker: 'btcpay-gateway', scope: 'capital', required: [], source: 'p31-capital-machine/workers/btcpay-gateway/wrangler.toml' },
  { worker: 'config-gateway', scope: 'capital', required: [], source: 'p31-capital-machine/workers/config-gateway/wrangler.toml' },
  {
    worker: 'capital-allocator',
    scope: 'capital',
    required: ['HONEYCOMB_API_KEY'],
    source: 'p31-capital-machine/workers/capital-allocator/wrangler.toml',
  },
  { worker: 'yield-vault', scope: 'capital', required: [], source: 'p31-capital-machine/workers/yield-vault/wrangler.toml' },
  { worker: 'p31-auto-compounder', scope: 'capital', required: [], source: 'p31-capital-machine/workers/auto-compounder/wrangler.toml' },
  { worker: 'mev-arbitrage', scope: 'capital', required: [], source: 'p31-capital-machine/workers/mev-arbitrage/wrangler.toml' },
  { worker: 'monetization-alerting', scope: 'capital', required: [], source: 'p31-capital-machine/workers/alerting/wrangler.toml' },
]

export const MCP_WORKERS = MANIFEST.filter((w) => w.scope === 'mcp').map((w) => w.worker)
export const CAPITAL_WORKERS = MANIFEST.filter((w) => w.scope === 'capital').map((w) => w.worker)

export function workersForScope(scope: string): WorkerEntry[] {
  if (scope === 'capital') return MANIFEST.filter((w) => w.scope === 'capital')
  if (scope === 'mcp') return MANIFEST.filter((w) => w.scope === 'mcp')
  return MANIFEST
}

/** Total declared-required secret names across the fleet. */
export function declaredRequired(entries: WorkerEntry[]): string[] {
  return entries.flatMap((w) => w.required)
}