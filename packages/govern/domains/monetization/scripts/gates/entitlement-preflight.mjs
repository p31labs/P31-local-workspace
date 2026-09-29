// Gate: entitlement-preflight
// constitution.command: node scripts/gates/entitlement-preflight.mjs
// Scope: entitlement worker preflight route — who can access paid tools.
// Canonical detection: EntitlementService.checkEntitlement — the REAL source
// /home/p31/p31-capital-machine/workers/entitlement/service.ts, the exact
// function the worker's /entitlement/check route runs before granting a paid
// tool. Loaded via the shared canonical loader (scripts/nc/_canonical.mjs),
// same as the negative control scripts/nc/entitlement-preflight.mjs.
//
// The gate's job: given the CURRENT state (who is recorded as allowed/denied),
// is the invariant upheld? Every recorded access decision must agree with what
// the real preflight would decide. A state that records a grant the real
// preflight would DENY (the M-001 portal-bypass class: someone was let into a
// paid tool that checkEntitlement would refuse) is corruption → GATE_FAIL.
//
// Markers (audit chain):
//   GATE_PASS: entitlement-preflight                     exit 0
//   GATE_FAIL: entitlement-preflight: <reason>           exit 1
//   GATE_UNRUNNABLE: entitlement-preflight: <reason>     exit 1
//
// Usage: node scripts/gates/entitlement-preflight.mjs [--state <path>]
//   --state <path>   JSON state document (schema entitlement-preflight.state.v1)
//                    or a directory containing state.json. Falls back to the
//                    GATE_STATE env var.
//   No --state and no GATE_LIVE_SOURCE → GATE_UNRUNNABLE (honest "declared,
//   not enforced" — never a fabricated pass).
//   GATE_LIVE_SOURCE → the entitlement worker exposes no read-only route that
//   replays checkEntitlement against recorded grants, so a live verdict is
//   unverifiable; the gate reports GATE_UNRUNNABLE with that reason.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { loadCanonical } from '../../../../scripts/nc/_canonical.mjs';

const GATE_ID = 'entitlement-preflight';
const STATE_SCHEMA = 'entitlement-preflight.state.v1';
const BUILD = '/tmp/opencode/gate-build/monetization';
const SERVICE_TS = '/home/p31/p31-capital-machine/workers/entitlement/service.ts';

// Default tier limits mirror the negative control's seed rows; state rows
// override them.
const DEFAULT_TIER_LIMITS = [
  { tier: 'free', monthly_allowance_usdc: '0', monthly_calls_per_tool: 100, burst_multiplier: 1.0 },
  { tier: 'pro', monthly_allowance_usdc: '50', monthly_calls_per_tool: 1000, burst_multiplier: 2.0 },
  { tier: 'enterprise', monthly_allowance_usdc: '500', monthly_calls_per_tool: 10000, burst_multiplier: 5.0 },
];

class D1Like {
  constructor(db) {
    this.db = db;
  }
  exec(sql) {
    this.db.exec(sql);
  }
  prepare(sql) {
    const stmt = { params: [] };
    const chain = {
      bind: (...p) => {
        stmt.params = p;
        return chain;
      },
      all: async () => {
        const rows = this.db.prepare(sql).all(...stmt.params);
        return { results: rows };
      },
      first: async () => {
        const row = this.db.prepare(sql).get(...stmt.params);
        return row ?? null;
      },
      run: async () => {
        const r = this.db.prepare(sql).run(...stmt.params);
        return { meta: { changes: r.changes } };
      },
    };
    return chain;
  }
}

function printUsage() {
  console.log(`usage: node scripts/gates/${GATE_ID}.mjs [--state <path>]
  --state <path>   state JSON (schema ${STATE_SCHEMA}) or a directory with state.json
  (or set GATE_STATE; or set GATE_LIVE_SOURCE for an attempted live check)`);
}

function resolveStateSource() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--state' && argv[i + 1]) return argv[i + 1];
    if (argv[i].startsWith('--state=')) return argv[i].slice('--state='.length);
    if (argv[i] === '--help' || argv[i] === '-h') {
      printUsage();
      process.exit(0);
    }
  }
  return process.env.GATE_STATE || null;
}

function loadState(statePath) {
  let p = statePath;
  const stat = statSync(p);
  if (stat.isDirectory()) p = path.join(p, 'state.json');
  return JSON.parse(readFileSync(p, 'utf8'));
}

function unrunnable(reason) {
  console.log(`GATE_UNRUNNABLE: ${GATE_ID}: ${reason}`);
  process.exit(1);
}

function fail(reason) {
  console.log(`GATE_FAIL: ${GATE_ID}: ${reason}`);
  process.exit(1);
}

async function liveCheck() {
  const base = process.env.GATE_LIVE_SOURCE;
  try {
    const res = await fetch(`${base}/health`);
    const body = await res.json();
    if (body && body.service === 'entitlement' && body.status === 'ok') {
      // The worker is reachable but /health is NOT the preflight invariant and
      // the worker exposes no read-only route that replays checkEntitlement
      // against the recorded grants. A live verdict is unverifiable.
      unrunnable('live source reachable but exposes no verifiable preflight invariant (only /health); provide --state');
    }
    unrunnable(`live source returned unexpected health payload (HTTP ${res.status})`);
  } catch (e) {
    unrunnable(`live source unreachable: ${e.message}`);
  }
}

async function main() {
  const statePath = resolveStateSource();
  if (!statePath) {
    if (process.env.GATE_LIVE_SOURCE) return liveCheck();
    unrunnable('no state source configured (use --state <path> or GATE_STATE; or set GATE_LIVE_SOURCE)');
  }

  let state;
  try {
    state = loadState(statePath);
  } catch (e) {
    unrunnable(`cannot read state at ${statePath}: ${e.message}`);
  }
  if (!state || state.schema !== STATE_SCHEMA) {
    unrunnable(`state at ${statePath} is not a ${STATE_SCHEMA} document`);
  }

  const entitlements = state.entitlements || [];
  const tier_limits = state.tier_limits || [];
  const decisions = state.decisions || [];
  if (!Array.isArray(decisions) || decisions.length === 0) {
    unrunnable('state declares no access decisions to verify (decisions: [])');
  }

  const db = new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE entitlements (
    did TEXT PRIMARY KEY, balance_usdc TEXT NOT NULL DEFAULT '0',
    balance_love TEXT NOT NULL DEFAULT '0', tier TEXT DEFAULT 'free',
    monthly_allowance_usdc TEXT DEFAULT '0', monthly_used_usdc TEXT NOT NULL DEFAULT '0',
    last_updated INTEGER NOT NULL, created_at INTEGER NOT NULL)`);
  db.exec(`CREATE TABLE tier_limits (
    tier TEXT PRIMARY KEY, monthly_allowance_usdc TEXT NOT NULL,
    monthly_calls_per_tool INTEGER NOT NULL, burst_multiplier REAL NOT NULL)`);
  for (const tl of DEFAULT_TIER_LIMITS) {
    db.prepare('INSERT OR REPLACE INTO tier_limits VALUES (?,?,?,?)').run(
      tl.tier, tl.monthly_allowance_usdc, tl.monthly_calls_per_tool, tl.burst_multiplier
    );
  }
  for (const tl of tier_limits) {
    db.prepare('INSERT OR REPLACE INTO tier_limits VALUES (?,?,?,?)').run(
      tl.tier, tl.monthly_allowance_usdc, tl.monthly_calls_per_tool, tl.burst_multiplier
    );
  }
  for (const ent of entitlements) {
    db.prepare(
      `INSERT OR REPLACE INTO entitlements
       (did, balance_usdc, balance_love, tier, monthly_allowance_usdc, monthly_used_usdc, last_updated, created_at)
       VALUES (?,?,?,?,?,?,?,?)`
    ).run(
      ent.did, ent.balance_usdc || '0', ent.balance_love || '0', ent.tier || 'free',
      ent.monthly_allowance_usdc || '0', ent.monthly_used_usdc || '0',
      ent.last_updated || Date.now(), ent.created_at || Date.now()
    );
  }

  const { EntitlementService } = await loadCanonical(SERVICE_TS, { buildDir: BUILD });
  const svc = new EntitlementService(new D1Like(db), { ENVIRONMENT: 'production' });

  const failures = [];
  for (const d of decisions) {
    if (!d.did || !d.tool || !d.cost_usdc || !['allow', 'deny'].includes(d.decision)) {
      failures.push(`malformed decision: ${JSON.stringify(d)}`);
      continue;
    }
    const r = await svc.checkEntitlement(d.did, d.tool, d.cost_usdc);
    const actual = r.ok ? 'allow' : 'deny';
    if (actual !== d.decision) {
      failures.push(
        `state records ${d.did} (${d.tool} @ ${d.cost_usdc}) as "${d.decision}" but real checkEntitlement says "${actual}" (${r.message})`
      );
    }
  }

  if (failures.length > 0) {
    fail(failures.join('; '));
  }

  console.log(`GATE_PASS: ${GATE_ID}`);
  console.log(`entitlement-preflight: ${decisions.length} recorded access decision(s) all agree with the real checkEntitlement.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(`${GATE_ID} gate error:`, e);
  process.exit(1);
});