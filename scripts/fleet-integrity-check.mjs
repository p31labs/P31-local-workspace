#!/usr/bin/env node
/**
 * fleet-integrity-check.mjs — cross-reference declared fleet (status.json + wrangler.toml)
 * against live /health endpoints. Reports drift.
 *
 * Usage: node scripts/fleet-integrity-check.mjs [--json]
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function readJson(p) {
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

const status = readJson(join(ROOT, 'workers/command-center/status.json')) || {};
const declared = new Set();
if (status.workers && Array.isArray(status.workers)) {
  for (const w of status.workers) declared.add(w.name);
}
if (status.portals && Array.isArray(status.portals)) {
  for (const p of status.portals) declared.add(p.name);
}

// Also scan wrangler.toml files for worker names
import { execSync } from 'child_process';
let wranglerWorkers = [];
try {
  const out = execSync('find workers -name wrangler.toml -not -path "*/node_modules/*" -exec grep -H "^name =" {} \\;', { encoding: 'utf8' });
  wranglerWorkers = out.split('\n').filter(Boolean).map(l => l.split('=')[1]?.trim().replace(/"/g, '') || l);
} catch { /* ignore */ }

const healthUrlMap = {
  'k4-cage': 'https://k4-cage.trimtab-signal.workers.dev/health',
  'k4-personal': 'https://k4-personal.trimtab-signal.workers.dev/health',
  'k4-hubs': 'https://k4-hubs.trimtab-signal.workers.dev/health',
  'p31-dispatch': 'https://p31-dispatch.trimtab-signal.workers.dev/health',
  'p31-passport': 'https://p31-passport.trimtab-signal.workers.dev/health',
  'spaceship-relay': 'https://spaceship-relay.trimtab-signal.workers.dev/mcp',
  'terminal-relay': 'https://terminal-relay.trimtab-signal.workers.dev/api/health',
  'command-center': 'https://command-center.trimtab-signal.workers.dev/api/health',
  'mesh': 'https://mesh.p31ca.org/health',
  'phos': 'https://phos.p31ca.org/health',
};

async function checkHealth(name, url) {
  try {
    const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10000) });
    return { name, status: res.status, ok: res.status >= 200 && res.status < 400 };
  } catch {
    return { name, status: 0, ok: false };
  }
}

async function main() {
  const results = [];
  for (const [name, url] of Object.entries(healthUrlMap)) {
    results.push(await checkHealth(name, url));
  }

  const live = new Set(results.filter(r => r.ok).map(r => r.name));
  const missing = [...declared].filter(n => !live.has(n));
  const undeclared = [...live].filter(n => !declared.has(n));

  const report = {
    timestamp: new Date().toISOString(),
    declared: declared.size,
    live: live.size,
    missing_from_live: missing,
    undeclared_in_status: undeclared,
    wrangler_workers: wranglerWorkers.filter(Boolean).length,
    drift: missing.length > 0 || undeclared.length > 0,
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log('=== P31 Fleet Integrity Check ===');
    console.log(`Declared: ${report.declared} | Live: ${report.live}`);
    if (missing.length) {
      console.log(`\n⚠ Missing from live (${missing.length}):`);
      for (const m of missing) console.log(`  - ${m}`);
    }
    if (undeclared.length) {
      console.log(`\n⚠ Live but undeclared (${undeclared.length}):`);
      for (const u of undeclared) console.log(`  - ${u}`);
    }
    if (!report.drift) console.log('\n✅ No drift detected');
  }

  process.exit(report.drift ? 1 : 0);
}

main();
