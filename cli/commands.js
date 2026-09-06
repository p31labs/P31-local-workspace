// ═════════════════════════════════════════════════════════════════════════════
// andromeda — Phase 2: Edge-Aware Commands
// status, surfaces, deploy, love
// All synchronous — uses child_process.execFileSync with node -e for HTTP.
// No external dependencies (curl/wget not required).
// ═════════════════════════════════════════════════════════════════════════════

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const GATEWAY = 'gateway.p31ca.org';
const LOVE_LEDGER_URL = process.env.LOVE_LEDGER_URL || 'https://love-ledger.p31ca.org';

// Inline Node script for synchronous HTTP GET via execFileSync.
// The script receives the URL as the argument (no shell quoting issues).
const FETCH_SCRIPT = [
  'const https=require("https"),http=require("http");',
  'const u=new URL(process.argv[1]);',
  'const mod=u.protocol==="https:"?https:http;',
  'mod.get(u,{timeout:10000},r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>{process.stdout.write(d)})}).on("error",()=>process.exit(1))',
].join('');

const STATUS_SCRIPT = [
  'const https=require("https"),http=require("http");',
  'const u=new URL(process.argv[1]);',
  'const mod=u.protocol==="https:"?https:http;',
  'mod.get(u,{timeout:6000},r=>{r.resume();const ok=r.statusCode<500;process.stdout.write(JSON.stringify({status:r.statusCode,ok}))}).on("error",()=>process.stdout.write(JSON.stringify({status:0,ok:false,error:"connection failed"})))',
].join('');

function fetchJSON(url) {
  try {
    const raw = execFileSync('node', ['-e', FETCH_SCRIPT, url], { timeout: 10000, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(raw);
  } catch (e) {
    return { _error: `HTTP error: ${e.message}` };
  }
}

function httpStatus(url) {
  try {
    const raw = execFileSync('node', ['-e', STATUS_SCRIPT, url], { timeout: 8000, encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    return JSON.parse(raw);
  } catch (e) {
    return { status: 0, ok: false, error: e.message };
  }
}

function printJSON(obj) {
  console.log(JSON.stringify(obj, null, 2));
}

// ─── Status ──────────────────────────────────────────────────────────────────

function status(options) {
  const result = { gateway: null, services: {} };

  const h = fetchJSON(`https://${GATEWAY}/api/health`);
  if (h._error) {
    result.gateway = { ok: false, error: h._error };
  } else {
    result.gateway = { ok: h.ok === true, service: h.service || 'p31-gateway', status: 200 };
  }

  const checks = {
    phos:  'https://phos.p31ca.org',
    p31ca: 'https://p31ca.org',
  };

  for (const [name, url] of Object.entries(checks)) {
    const r = httpStatus(url);
    result.services[name] = { ok: r.ok, status: r.status, error: r.error || null };
  }

  if (options.service && result.services[options.service]) {
    result.gateway = null;
    result.services = { [options.service]: result.services[options.service] };
  }

  if (options.agent) return printJSON(result);

  const icon = (ok) => ok ? '✓' : '✗';
  console.log(`\n  ${icon(result.gateway.ok)}  Gateway    ${result.gateway.service || ''}  (${result.gateway.status})`);
  for (const [name, s] of Object.entries(result.services)) {
    console.log(`  ${icon(s.ok)}  ${name.padEnd(9)} ${s.error || `HTTP ${s.status}`}`);
  }
  console.log('');
}

// ─── Surfaces ────────────────────────────────────────────────────────────────

function surfaces(options) {
  const result = fetchJSON(`https://${GATEWAY}/api/phos/surfaces`);
  if (result._error || !result.surfaces) {
    console.error(`[p31] Could not fetch surfaces: ${result._error || 'empty response'}`);
    process.exit(2);
  }

  const all = result.surfaces;
  const filtered = options.name
    ? all.filter(s => s.label.toLowerCase().includes(options.name.toLowerCase()) || s.id.toLowerCase().includes(options.name.toLowerCase()))
    : all;

  const output = { surfaces: filtered, total: all.length, shown: filtered.length };

  if (options.agent) return printJSON(output);

  const groups = {};
  for (const s of filtered) {
    const g = s.group || 'other';
    if (!groups[g]) groups[g] = [];
    groups[g].push(s);
  }

  console.log(`\n  PHOS Surfaces  (${output.shown} of ${output.total})\n`);
  for (const [group, items] of Object.entries(groups)) {
    console.log(`  ${group}`);
    for (const s of items) console.log(`    ${s.icon}  ${s.label}`);
    console.log('');
  }
}

// ─── Deploy ──────────────────────────────────────────────────────────────────

const APPS = {
  phos:          { dir: 'apps/phos',           build: 'bash node_modules/.bin/astro build',        pages: 'phos' },
  p31ca:         { dir: 'apps/p31ca',          build: 'bash node_modules/.bin/astro build',        pages: 'p31ca' },
  phosphorus31:  { dir: 'apps/phosphorus31',   build: 'npm run build',                            pages: 'phosphorus31-org' },
  bonding:       { dir: 'apps/bonding',        build: 'npm run build',                            pages: 'bonding' },
  willow:        { dir: 'apps/willow',         build: 'npm run build',                            pages: 'willow' },
  gateway:       { dir: 'apps/gateway',        build: null,                                       worker: true },
};

const MONOREPO_ROOT = path.resolve(__dirname, '..');

function deploy(options) {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.error('[p31] CLOUDFLARE_API_TOKEN environment variable required');
    process.exit(3);
  }

  const appName = options.app;
  if (!appName) {
    console.error('[p31] --app is required. Options: ' + Object.keys(APPS).join(', '));
    process.exit(1);
  }

  const app = APPS[appName];
  if (!app) {
    console.error(`[p31] Unknown app "${appName}". Options: ${Object.keys(APPS).join(', ')}`);
    process.exit(1);
  }

  const appDir = path.join(MONOREPO_ROOT, app.dir);
  if (!fs.existsSync(appDir)) {
    console.error(`[p31] App directory not found: ${appDir}`);
    process.exit(2);
  }

  const env = options.env || 'production';

  if (options.dryRun) {
    const info = {
      app: appName, env, directory: app.dir,
      build: app.build,
      target: app.worker ? 'Cloudflare Worker' : 'Cloudflare Pages',
      pagesProject: app.pages || null,
    };
    if (options.agent) return printJSON(info);
    console.log(`\n  ⚬ Dry-run: deploy ${appName} to ${env}\n`);
    for (const [k, v] of Object.entries(info)) console.log(`  ${k}: ${v}`);
    console.log('');
    return;
  }

  if (app.build) {
    console.log(`\n  Building ${appName}…\n`);
    try {
      execFileSync('bash', ['-c', app.build], { cwd: appDir, stdio: 'inherit', timeout: 300000 });
    } catch (e) {
      console.error(`[p31] Build failed:\n${e.stderr || e.message}`);
      process.exit(2);
    }
  }

  console.log(`\n  Deploying ${appName} to ${env}…\n`);
  try {
    const cmd = app.worker
      ? `npx wrangler deploy --env ${env}`
      : `npx wrangler pages deploy dist --project-name ${app.pages} --commit-dirty=true`;
    const out = execFileSync('bash', ['-c', cmd], { cwd: appDir, stdio: 'inherit', timeout: 180000 });
  } catch (e) {
    console.error(`[p31] Deploy failed:\n${e.stderr || e.message}`);
    process.exit(2);
  }

  console.log(`\n  ✓ ${appName} deployed to ${env}\n`);
}

module.exports = { status, surfaces, deploy, love, monetization };

// ─── Monetization Engine ──────────────────────────────────────────────────────

const REVENUE_URL = process.env.REVENUE_LEDGER_URL || 'https://revenue-ledger.trimtab-signal.workers.dev';
const ENTITLEMENT_URL = process.env.ENTITLEMENT_URL || 'https://entitlement.trimtab-signal.workers.dev';
const ALLOCATOR_URL = process.env.ALLOCATOR_URL || 'https://capital-allocator.trimtab-signal.workers.dev';

function monetizationFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const body = options.body ? JSON.stringify(options.body) : undefined;
  return fetchJSON(url, { method: options.method || 'GET', headers, body });
}

function monetization(options) {
  const sub = options.subcommand || 'status';
  const target = options.target || 'revenue';

  if (target === 'revenue') {
    if (sub === 'record') {
      const result = monetizationFetch(`${REVENUE_URL}/revenue/record`, {
        method: 'POST',
        body: {
          source: options.source,
          payer_did: options['payer-did'],
          merchant_did: options['merchant-did'],
          amount_usdc: options.amount,
          asset: options.asset,
        },
      });
      if (result._error) { console.error(`[p31] Revenue record failed: ${result._error}`); process.exit(2); }
      if (options.agent) return printJSON({ ...result, status: 'ok' });
      console.log(`\n  ✓ Revenue recorded: ${result.hash.slice(0, 16)}...\n`);
    } else if (sub === 'balance') {
      const did = options.did || process.env.P31_USER_ID || 'guest';
      const result = monetizationFetch(`${REVENUE_URL}/revenue/balance/${encodeURIComponent(did)}`);
      if (result._error) { console.error(`[p31] Balance fetch failed: ${result._error}`); process.exit(2); }
      if (options.agent) return printJSON({ ...result, status: 'ok' });
      console.log(`\n  DID: ${did}`);
      console.log(`  USDC: ${result.total_earned_usdc}`);
      console.log(`  EUR:  ${result.total_earned_eur}`);
      console.log(`  LOVE: ${result.total_earned_love}`);
      console.log(`  Transactions: ${result.transaction_count}\n`);
    } else {
      const range = options.range || '30d';
      const source = options.source;
      const url = new URL(`${REVENUE_URL}/revenue/summary`);
      if (source) url.searchParams.set('source', source);
      url.searchParams.set('range', range);
      const result = monetizationFetch(url.toString());
      if (result._error) { console.error(`[p31] Summary fetch failed: ${result._error}`); process.exit(2); }
      if (options.agent) return printJSON({ ...result, status: 'ok' });
      console.log(`\n  Revenue Summary (${range})`);
      console.log(`  Total USDC: ${result.total_usdc}`);
      console.log(`  Total EUR:  ${result.total_eur}`);
      console.log(`  Total LOVE: ${result.total_love}`);
      console.log(`  Transactions: ${result.count}`);
      console.log(`  Avg/tx: $${result.avg_per_transaction}\n`);
    }
  } else if (target === 'entitlement') {
    if (sub === 'check') {
      const did = options.did || process.env.P31_USER_ID || 'guest';
      const result = monetizationFetch(`${ENTITLEMENT_URL}/entitlement/check`, {
        method: 'POST',
        body: { did, tool_id: options['tool-id'], estimated_cost_usdc: options.cost },
      });
      if (result._error) { console.error(`[p31] Entitlement check failed: ${result._error}`); process.exit(2); }
      if (options.agent) return printJSON({ ...result, status: 'ok' });
      console.log(`\n  Entitlement check for ${did}:`);
      console.log(`  Tool: ${options['tool-id']}`);
      console.log(`  Cost: $${options.cost}`);
      console.log(`  Status: ${result.ok ? '✓ Authorized' : '✗ Denied'}`);
      if (result.balance) console.log(`  Balance: $${result.balance}`);
      if (result.message) console.log(`  Reason: ${result.message}`);
      console.log('');
    } else if (sub === 'tier') {
      const did = options.did || process.env.P31_USER_ID || 'guest';
      const result = monetizationFetch(`${ENTITLEMENT_URL}/entitlement/tier-set`, {
        method: 'POST',
        body: { did, tier: options.tier },
      });
      if (result._error) { console.error(`[p31] Tier set failed: ${result._error}`); process.exit(2); }
      if (options.agent) return printJSON({ ...result, status: 'ok' });
      console.log(`\n  ✓ Tier set to ${result.tier} for ${result.did}\n`);
    }
  } else if (target === 'allocation') {
    if (sub === 'create') {
      const result = monetizationFetch(`${ALLOCATOR_URL}/allocate`, {
        method: 'POST',
        body: {
          source_tx_id: options['tx-id'],
          amount_usdc: options.amount,
          targets: [{ target: options.target, weight: parseFloat(options.weight || '1.0') }],
        },
      });
      if (result._error) { console.error(`[p31] Allocation failed: ${result._error}`); process.exit(2); }
      if (options.agent) return printJSON({ ...result, status: 'ok' });
      console.log(`\n  ✓ Created ${result.allocations.length} allocation(s)\n`);
      result.allocations.forEach((a, i) => {
        console.log(`  ${i + 1}. ${a.target}: ${a.amount} USDC (${a.status})`);
      });
      console.log('');
    } else if (sub === 'status') {
      const targetName = options.target || 'yield';
      const result = monetizationFetch(`${ALLOCATOR_URL}/allocation/status?target=${encodeURIComponent(targetName)}`);
      if (result._error) { console.error(`[p31] Status fetch failed: ${result._error}`); process.exit(2); }
      if (options.agent) return printJSON({ ...result, status: 'ok' });
      console.log(`\n  Allocation Status: ${result.target}`);
      console.log(`  Position: ${result.current_allocation} USDC`);
      console.log(`  ROI: ${result.roi_bps} bps`);
      console.log(`  Health: ${result.health_check}\n`);
    }
  }
}

// ─── LOVE Ledger ─────────────────────────────────────────────────────────────

// andromeda love [status|balance|sync] [userId]
// Queries the LOVE ledger (D1-backed love-ledger worker) for care accounting state.
function love(options) {
  const sub = options.subcommand || 'status';
  const userId = options.userId || process.env.P31_USER_ID || 'guest';

  let endpoint;
  if (sub === 'balance') {
    endpoint = `${LOVE_LEDGER_URL}/api/love/balance?userId=${encodeURIComponent(userId)}`;
  } else if (sub === 'sync') {
    endpoint = `${LOVE_LEDGER_URL}/api/love/sync?userId=${encodeURIComponent(userId)}`;
  } else {
    endpoint = `${LOVE_LEDGER_URL}/api/love/status?userId=${encodeURIComponent(userId)}`;
  }

  const result = fetchJSON(endpoint);
  if (result._error) {
    console.error(`[p31] LOVE ledger error: ${result._error}`);
    process.exit(2);
  }

  if (options.agent) return printJSON({ ...result, status: 'ok' });

  if (sub === 'status') {
    console.log(`\n  LOVE Ledger  (${result.totalLove || '0'} LOVE)`);
    console.log(`  care_score:   ${result.careScore || '0'}`);
    console.log(`  sovereignty:  ${result.sovereigntyPool || '0'}`);
    console.log(`  performance:  ${result.performancePool || '0'}`);
    console.log(`  SBT count:    ${result.sbtCount || 0}`);
    console.log('');
  } else if (sub === 'balance') {
    console.log(`\n  LOVE balance for ${userId}: ${result.balance ?? result.totalLove ?? '0'}\n`);
  } else {
    console.log(`\n  ✓ Synced ${userId} with ledger\n`);
  }
}
