// Negative control: entitlement-preflight
// Gate: "entitlement worker preflight route — who can access paid tools"
// constitution.command: node scripts/gates/entitlement-preflight.mjs
//
// This NC does NOT run the canonical detection directly. It exercises the GATE
// COMMAND — the exact script the constitution declares — by writing a corrupted
// fixture STATE (schema entitlement-preflight.state.v1) and asserting the gate
// emits GATE_FAIL + exits 1 on it, and GATE_PASS + exits 0 on a clean fixture.
// The "reachable but not exercised" failure class: if the constitution's
// command field were mis-wired to a wrong/empty script, the gate could not
// react to the corruption and this NC fails.
//
// Corruption injected: the M-001 portal-bypass class — access decisions
// RECORDED as granted that the real preflight would deny. A zero-balance
// free-tier DID and a pro DID whose monthly allowance is exhausted are both
// recorded as "allow"; the real checkEntitlement denies both. The gate must
// flag the mismatch (GATE_FAIL). A clean fixture — denials recorded as deny and
// a funded pro as allow — must pass (GATE_PASS), proving the FAIL is
// corruption-specific.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE_ID = 'entitlement-preflight';
const GATE_SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'gates',
  `${GATE_ID}.mjs`
);
const STATE_SCHEMA = 'entitlement-preflight.state.v1';
const TOOL = 'tool-paid';
const COST = '5.00';

function buildCleanState() {
  const now = Date.now();
  return {
    schema: STATE_SCHEMA,
    entitlements: [
      {
        did: 'did:key:zero-balance',
        balance_usdc: '0',
        balance_love: '0',
        tier: 'free',
        monthly_allowance_usdc: '0',
        monthly_used_usdc: '0',
        last_updated: now,
        created_at: now,
      },
      {
        did: 'did:key:over-allowance',
        balance_usdc: '100',
        balance_love: '0',
        tier: 'pro',
        monthly_allowance_usdc: '50',
        monthly_used_usdc: '50',
        last_updated: now,
        created_at: now,
      },
      {
        did: 'did:key:funded',
        balance_usdc: '100',
        balance_love: '0',
        tier: 'pro',
        monthly_allowance_usdc: '50',
        monthly_used_usdc: '10',
        last_updated: now,
        created_at: now,
      },
    ],
    tier_limits: [],
    decisions: [
      { did: 'did:key:zero-balance', tool: TOOL, cost_usdc: COST, decision: 'deny' },
      { did: 'did:key:over-allowance', tool: TOOL, cost_usdc: COST, decision: 'deny' },
      { did: 'did:key:funded', tool: TOOL, cost_usdc: COST, decision: 'allow' },
    ],
  };
}

// CORRUPTION (M-001 portal-bypass class): the same DIDs the real preflight
// would refuse are RECORDED as granted — a wrongful grant that must be flagged.
function buildCorruptState() {
  const now = Date.now();
  return {
    schema: STATE_SCHEMA,
    entitlements: [
      {
        did: 'did:key:zero-balance',
        balance_usdc: '0',
        balance_love: '0',
        tier: 'free',
        monthly_allowance_usdc: '0',
        monthly_used_usdc: '0',
        last_updated: now,
        created_at: now,
      },
      {
        did: 'did:key:over-allowance',
        balance_usdc: '100',
        balance_love: '0',
        tier: 'pro',
        monthly_allowance_usdc: '50',
        monthly_used_usdc: '50',
        last_updated: now,
        created_at: now,
      },
    ],
    tier_limits: [],
    decisions: [
      { did: 'did:key:zero-balance', tool: TOOL, cost_usdc: COST, decision: 'allow' },
      { did: 'did:key:over-allowance', tool: TOOL, cost_usdc: COST, decision: 'allow' },
    ],
  };
}

function runGate(statePath) {
  return spawnSync('node', [GATE_SCRIPT, '--state', statePath], {
    encoding: 'utf8',
    timeout: 30000,
  });
}

function markerLine(output) {
  return (output.split('\n').find((l) => l.startsWith('GATE_')) || output.trim()).trim();
}

async function main() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), `gate-nc-${GATE_ID}-`));
  try {
    const cleanPath = path.join(tmp, 'clean-state.json');
    const corruptPath = path.join(tmp, 'corrupt-state.json');
    writeFileSync(cleanPath, JSON.stringify(buildCleanState(), null, 2));
    writeFileSync(corruptPath, JSON.stringify(buildCorruptState(), null, 2));

    const clean = runGate(cleanPath);
    const cleanOut = `${clean.stdout ?? ''}${clean.stderr ?? ''}`;
    if (clean.status !== 0 || !cleanOut.includes(`GATE_PASS: ${GATE_ID}`)) {
      throw new Error(
        `gate command did NOT pass on a CLEAN state fixture (exit=${clean.status}):\n${markerLine(cleanOut)}`
      );
    }
    console.log(`  clean fixture → ${markerLine(cleanOut)} (exit ${clean.status})`);

    const corrupt = runGate(corruptPath);
    const corruptOut = `${corrupt.stdout ?? ''}${corrupt.stderr ?? ''}`;
    if (corrupt.status !== 1 || !corruptOut.includes(`GATE_FAIL: ${GATE_ID}`)) {
      throw new Error(
        `gate command did NOT fail on the corrupted fixture (exit=${corrupt.status}) — ` +
          `the GATE (not just the scanner) must react to this corruption:\n${markerLine(corruptOut)}`
      );
    }
    console.log(`  corrupt fixture → ${markerLine(corruptOut)} (exit ${corrupt.status})`);

    console.log(
      `entitlement-preflight: the ACTUAL gate command (scripts/gates/entitlement-preflight.mjs --state <fixture>) ` +
        `proved it can fail on the M-001 portal-bypass class (zero-balance / allowance-exhausted DIDs recorded as allowed) `
        + `and pass on a clean fixture.`
    );
    console.log('NEGATIVE_CONTROL_OK');
  } catch (e) {
    console.error(`${GATE_ID} NEGATIVE CONTROL FAILED: ${e.message}`);
    process.exitCode = 1;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((e) => {
  console.error(`${GATE_ID} NC error:`, e);
  process.exitCode = 1;
});