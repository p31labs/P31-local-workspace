// Gate: revenue-ledger-integrity
// constitution.command: node scripts/gates/revenue-ledger-integrity.mjs
// Scope: revenue-ledger D1: every summary must reconcile with raw rows.
// Canonical detection: RevenueLedger.verifyHashChain + the real
// UNIQUE(prev_hash) schema (source
// /home/p31/p31-capital-machine/workers/revenue-ledger/ledger.ts). verifyHashChain
// is the ledger worker's own integrity detector; it flags any row that cannot
// be reached from genesis exactly once — i.e. a forged/duplicate row forking
// the chain (the 93f4407d fork class the ledger serializes against).
// Loaded via the shared canonical loader, same as the negative control
// scripts/nc/ledger-integrity.mjs.
//
// The gate's job: given the CURRENT state (the revenue_events rows), is the
// invariant upheld? The gate materializes the state rows into the REAL schema
// (UNIQUE(prev_hash) rejects a forged sibling row at insert) and then runs the
// REAL verifyHashChain. Any fork/orphan → GATE_FAIL.
//
// Markers (audit chain):
//   GATE_PASS: revenue-ledger-integrity                  exit 0
//   GATE_FAIL: revenue-ledger-integrity: <reason>        exit 1
//   GATE_UNRUNNABLE: revenue-ledger-integrity: <reason>  exit 1
//
// Usage: node scripts/gates/revenue-ledger-integrity.mjs [--state <path>]
//   --state <path>   JSON state document (schema revenue-ledger-integrity.state.v1)
//                    or a directory containing state.json. Falls back to the
//                    GATE_STATE env var.
//   No --state and no GATE_LIVE_SOURCE → GATE_UNRUNNABLE (never a fake pass).
//   GATE_LIVE_SOURCE → GET {base}/revenue/verify-chain, which is the worker's
//   real integrity route: { valid: bool }. valid:false → FAIL.

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { loadCanonical } from '../../../../scripts/nc/_canonical.mjs';

const GATE_ID = 'revenue-ledger-integrity';
const STATE_SCHEMA = 'revenue-ledger-integrity.state.v1';
const BUILD = '/tmp/opencode/gate-build/monetization';
const LEDGER_TS = '/home/p31/p31-capital-machine/workers/revenue-ledger/ledger.ts';

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
    const res = await fetch(`${base}/revenue/verify-chain`);
    if (!res.ok) {
      unrunnable(`live verify-chain returned HTTP ${res.status}`);
    }
    const body = await res.json();
    if (typeof body.valid !== 'boolean') {
      unrunnable(`live verify-chain payload missing boolean valid: ${JSON.stringify(body)}`);
    }
    if (!body.valid) {
      fail(`live verify-chain reports hash chain invalid (broken_at=${body.broken_at ?? 'unknown'})`);
    }
    console.log(`GATE_PASS: ${GATE_ID}`);
    console.log(`revenue-ledger-integrity: live verify-chain reports a valid hash chain (${body.total_entries ?? '?'} entries).`);
    process.exit(0);
  } catch (e) {
    unrunnable(`live source unreachable: ${e.message}`);
  }
}

// The canonical storage schema from RevenueLedger.ensureSchema, including the
// UNIQUE(prev_hash) index that makes a fork impossible to land.
function createSchema(db) {
  db.exec(`CREATE TABLE revenue_events (id TEXT PRIMARY KEY, source TEXT NOT NULL, payer_did TEXT NOT NULL, merchant_did TEXT NOT NULL, amount_usdc TEXT NOT NULL, asset TEXT NOT NULL, metadata TEXT, settlement_tx TEXT, created_at INTEGER NOT NULL, prev_hash TEXT NOT NULL, hash TEXT NOT NULL, UNIQUE(hash))`);
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS uq_rev_prev_hash ON revenue_events(prev_hash)');
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

  const events = state.events || [];
  if (!Array.isArray(events) || events.length === 0) {
    unrunnable('state declares no revenue_events rows to verify (events: [])');
  }

  const db = new DatabaseSync(':memory:');
  createSchema(db);

  // Storage layer: the REAL schema must accept every row in the state. A
  // forged duplicate (same prev_hash as an existing row) is rejected at insert
  // by UNIQUE(prev_hash) — that rejection IS the first line of detection.
  const insert = db.prepare(
    `INSERT INTO revenue_events
     (id, source, payer_did, merchant_did, amount_usdc, asset, metadata, settlement_tx, created_at, prev_hash, hash)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`
  );
  for (const ev of events) {
    try {
      insert.run(
        ev.id, ev.source, ev.payer_did, ev.merchant_did, ev.amount_usdc, ev.asset,
        ev.metadata ?? null, ev.settlement_tx ?? null, ev.created_at, ev.prev_hash, ev.hash
      );
    } catch (e) {
      fail(
        `revenue_events row ${ev.id} violates the real schema at insert (${e.message}) — a forged row cannot land in a conformant ledger`
      );
    }
  }

  // Audit backstop: even with a schema regression (constraint dropped), the
  // real verifyHashChain must flag any orphan/fork.
  const { RevenueLedger } = await loadCanonical(LEDGER_TS, { buildDir: BUILD });
  const noopLogger = { debug() {}, info() {}, warn() {}, error() {} };
  const ledger = new RevenueLedger(new D1Like(db), noopLogger);
  const verification = await ledger.verifyHashChain();

  if (!verification.valid) {
    fail(
      `real verifyHashChain flags the chain (broken_at=${verification.broken_at}, total=${verification.total_entries})`
    );
  }

  console.log(`GATE_PASS: ${GATE_ID}`);
  console.log(`revenue-ledger-integrity: ${events.length} revenue_events row(s) materialized into the real schema and the hash chain verifies (${verification.total_entries} reachable from genesis).`);
  process.exit(0);
}

main().catch((e) => {
  console.error(`${GATE_ID} gate error:`, e);
  process.exit(1);
});