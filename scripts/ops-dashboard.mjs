#!/usr/bin/env node
/**
 * ops-dashboard.mjs — aggregate all P31 ops logs into a single ops-status.json.
 *
 * Reads:
 *   - cli/logs/monitor.jsonl       (p31-monitor.sh)
 *   - ~/.p31/yardmaster.jsonl      (yardmaster)
 *   - logs/fleet-integrity.jsonl   (fleet-integrity-check.mjs)
 *   - logs/d1-storage.jsonl        (d1-storage-monitor.mjs)
 *
 * Usage: node scripts/ops-dashboard.mjs [--json]
 * Output: prints ops-status.json to stdout
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(new URL('.', import.meta.url)));
const ROOT = join(__dirname, '..');

function readJsonl(p) {
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split('\n').filter(Boolean).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function latest(lines) {
  return lines.length ? lines[lines.length - 1] : null;
}

function aggregate(lines) {
  const latestEntry = latest(lines);
  if (!latestEntry) return null;
  return {
    ts: latestEntry.ts,
    pass: latestEntry.pass ?? null,
    fail: latestEntry.fail ?? null,
    fails: latestEntry.fails || '',
    due_soon: latestEntry.due_soon || '',
  };
}

const monitor = aggregate(readJsonl(join(ROOT, 'cli/logs/monitor.jsonl')));
const yard = aggregate(readJsonl(join(ROOT, process.env.HOME || '/root', '.p31/yardmaster.jsonl')));
const fleet = aggregate(readJsonl(join(ROOT, 'logs/fleet-integrity.jsonl')));
const d1 = aggregate(readJsonl(join(ROOT, 'logs/d1-storage.jsonl')));

const status = {
  timestamp: new Date().toISOString(),
  monitor,
  yardmaster: yard,
  fleet_integrity: fleet,
  d1_storage: d1,
  overall: 'ok',
};

if (monitor?.fail > 0 || fleet?.drift) status.overall = 'degraded';
if (monitor?.fail > 3) status.overall = 'critical';

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(status, null, 2));
} else {
  console.log('=== P31 Ops Dashboard ===');
  console.log(`Overall: ${status.overall.toUpperCase()}`);
  if (monitor) console.log(`Monitor:   PASS ${monitor.pass} / FAIL ${monitor.fail}${monitor.fails ? ' — ' + monitor.fails : ''}`);
  if (yard) console.log(`Yardmaster: PASS ${yard.pass} / FAIL ${yard.fail}`);
  if (fleet) console.log(`Fleet:     drift=${fleet.drift ? 'YES' : 'no'}${fleet.missing_from_live?.length ? ' — missing: ' + fleet.missing_from_live.join(',') : ''}`);
  if (d1) console.log(`D1 Storage: ${d1.totalSizeGB || '?'} GB / 10 GB`);
}
