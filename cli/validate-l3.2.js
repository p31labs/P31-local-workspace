#!/usr/bin/env node
// ============================================================================
// L3.2 — mcp-x402-gateway Worker Validation (automated runbook)
//
// Encodes cwp-2026-009-sierpinski-expansion/L3.2-VALIDATION-RUNBOOK.md
// steps 1-4 into a single runnable check.
//
// REQUIRES: Node 20+, network access to the npm registry.
// Runs on the OPERATOR machine — the agent sandbox cannot reach the registry
// (pnpm resolves the 73-project workspace but silently skips the worker's
// x402 deps; npm install hangs on the flaky registry).
//
// Usage:  node cli/validate-l3.2.js
// ============================================================================
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execP = util.promisify(exec);

const ROOT = path.resolve(__dirname, '..');
const COUNTERSCALE = path.join(ROOT, 'apps/counterscale');
const WORKER = path.join(ROOT, 'software/workers/mcp-x402-gateway');

const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m', gray: '\x1b[90m'
};
const log = {
  info: (m) => console.log(`${c.cyan}[ℹ]${c.reset} ${m}`),
  ok: (m) => console.log(`${c.green}[✔]${c.reset} ${m}`),
  warn: (m) => console.log(`${c.yellow}[⚠]${c.reset} ${m}`),
  err: (m) => console.log(`${c.red}[✖]${c.reset} ${m}`),
  gray: (m) => console.log(`${c.gray}${m}${c.reset}`),
  header: (m) => console.log(`\n${c.magenta}=== ${m} ===${c.reset}\n`)
};

const steps = [];
async function run(label, cmd, cwd, opts = {}) {
  const { timeout = 300000, fatal = false } = opts;
  log.info(`${label}\n  → ${cmd}`);
  try {
    const { stdout, stderr } = await execP(cmd, { cwd, timeout, maxBuffer: 10 * 1024 * 1024 });
    if (stderr && !stderr.toLowerCase().includes('warning')) log.gray(`  stderr: ${stderr.trim().split('\n')[0]}`);
    steps.push({ label, cmd, ok: true, out: stdout.trim(), err: stderr.trim() });
    return { ok: true, out: stdout.trim(), err: stderr.trim() };
  } catch (e) {
    const out = (e.stdout || '').trim();
    const err = (e.stderr || e.message || '').trim();
    steps.push({ label, cmd, ok: false, out, err });
    if (fatal) { log.err(`FATAL: ${label}\n${err}`); process.exit(1); }
    log.warn(`${label} — non-fatal: ${err.split('\n')[0]}`);
    return { ok: false, out, err };
  }
}

async function main() {
  log.header('L3.2 x402 Worker Validation');
  log.gray(`Workspace: ${ROOT}`);
  log.gray(`Worker:   ${WORKER}`);

  // --- Step 1: install hygiene (optional, best-effort) ---
  log.header('Step 1 — Install hygiene (counterscale lockfile drift)');
  await run('Sync counterscale devDeps',
    'pnpm add -D eslint-config-prettier@^9.1.0 prettier@^3.3.2 turbo@^2.0.0 @rollup/rollup-linux-x64-gnu@4.9.5',
    COUNTERSCALE, { fatal: false });
  log.gray('  p31ca postinstall missing-file bug already stubbed @ 58e9772 — no action.');

  // --- Step 2: worker dependency install (version-pin fix @ b60a353) ---
  log.header('Step 2 — Install worker dependencies');
  log.gray('  Pins: x402-hono@^1.2.0, @coinbase/x402@^2.1.0, @cloudflare/workers-types@^5.0.0');
  let installed = await run('pnpm install (no frozen lockfile)',
    'pnpm install --no-frozen-lockfile', WORKER, { fatal: false });
  let ls = await run('Verify x402 deps resolved', 'pnpm ls x402-hono @coinbase/x402', WORKER, { fatal: false });
  const skipped = !ls.ok || /(missing|UNMET|not found)/i.test(ls.out + ls.err);
  if (skipped) {
    log.warn('  pnpm skipped x402 deps (pre-dated lockfile) — falling back to npm.');
    await run('npm install --legacy-peer-deps (fallback)',
      'npm install --legacy-peer-deps', WORKER, { fatal: false });
  }

  // --- Step 3: typecheck ---
  log.header('Step 3 — Typecheck (npx tsc --noEmit)');
  const tsc = await run('tsc', 'npx tsc --noEmit', WORKER, { fatal: false });
  if (tsc.ok) log.ok('Typecheck passed.');
  else log.warn('Typecheck reported errors (likely x402 version mismatch — see report block).');

  // --- Step 4: deploy dry-run (optional) ---
  log.header('Step 4 — Deploy dry-run (optional)');
  await run('wrangler deploy --dry-run', 'npx wrangler deploy --dry-run', WORKER, { fatal: false });

  // --- Step 5: report block for the agent ---
  log.header('Report Back — paste to agent');
  const env = await run('Environment', 'node -v && pnpm -v', ROOT, { fatal: false });
  const pkg = require(path.join(WORKER, 'package.json'));
  console.log('```');
  console.log('node/pnpm:');
  console.log(env.out || env.err);
  console.log('worker package.json dependencies:');
  console.log(JSON.stringify(pkg.dependencies || {}, null, 2));
  console.log('x402 resolved versions:');
  console.log((ls.out || ls.err || '').trim());
  console.log('tsc output:');
  console.log((tsc.out || tsc.err || '').trim());
  console.log('```');

  const allGood = installed.ok && tsc.ok && steps.every((s) => s.ok || s.label.includes('fallback') || s.label.includes('dry-run') || s.label.includes('Sync'));
  log.header('Summary');
  if (allGood) log.ok('L3.2 validation green. Worker ready for deploy.');
  else log.warn('L3.2 validation had non-fatal issues — review the report block above.');
}

main().catch((e) => { log.err(`Unexpected: ${e.message}`); process.exit(1); });
