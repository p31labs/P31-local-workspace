#!/usr/bin/env node
/**
 * The Loom — family pilot seed.
 *
 * Pre-populates the LIVE D1 log with a prior family artifact so the pilot
 * platform has something for the elder to find and Lumi to remember. Uses the
 * deployed API (POST /api/loom/event) with distinct identities per role, and
 * `statedBy` code names on shared events — the same path the App uses.
 *
 * Usage (from apps/loom):
 *   node scripts/seed-family.mjs            # seed the live family log
 *   node scripts/seed-family.mjs --reset    # wipe the live log first
 *   LOOM_BASE_URL=http://localhost:5191 node scripts/seed-family.mjs  # dev
 */
import { execFileSync } from 'node:child_process';

const BASE = process.env.LOOM_BASE_URL ?? 'https://loom-8z0.pages.dev';

async function post(input, humanId) {
  const res = await fetch(`${BASE}/api/loom/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(humanId ? { 'X-Human-Id': humanId } : {}) },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST failed (${res.status}): ${body.slice(0, 120)}`);
  }
  const { event } = await res.json();
  console.log(`  ok  seq=${event.seq}  ${input.kind}${'statedBy' in input ? ` (${input.statedBy})` : ''}`);
  return event;
}

// A prior family session: the child made an amber artifact with Lumi, the
// elder viewed it, and Lumi remembers. Shared events carry code names.
const FAMILY_LOG = [
  { input: { writer: 'human', kind: 'focus', node: 'orb', scope: 'shared', statedBy: 'Dill·ember' }, id: 'child' },
  { input: { writer: 'agent', kind: 'propose', id: 'family_seed_1', node: 'color-amber', body: { color: 'Amber' } }, id: null },
  { input: { writer: 'human', kind: 'approve', proposal: 'family_seed_1', scope: 'shared', statedBy: 'Dill·ember' }, id: 'child' },
  { input: { writer: 'human', kind: 'focus', node: 'artifact', scope: 'shared', statedBy: 'Dill·ember' }, id: 'child' },
  { input: { writer: 'human', kind: 'focus', node: 'companion-next-artifact', scope: 'shared', statedBy: 'Sour·dawn' }, id: 'elder' },
];

async function main() {
  const reset = process.argv.includes('--reset');
  if (reset) {
    console.log(`resetting ${BASE} D1 log…`);
    const out = execFileSync('wrangler', ['d1', 'execute', 'loom', '--remote', '--command', 'DELETE FROM events;'], {
      encoding: 'utf8',
      cwd: process.cwd(),
    });
    if (!out.includes('success')) {
      console.error('  reset failed — wrangler D1 error above');
      process.exit(1);
    }
    console.log('  cleared.');
  }

  console.log(`seeding ${BASE} with a prior family artifact…`);
  for (const step of FAMILY_LOG) {
    await post(step.input, step.id);
  }
  console.log('done. The elder will find the artifact; Lumi will remember it.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});