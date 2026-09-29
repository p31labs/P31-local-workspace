// Gate: evidence-chain-verify
// Constitution scope: "evidence entries: chainHash must link prevHash, dual
// signatures must verify"
//
// Detection: this gate runs the REAL canonical detection logic from the
// p31-justice-hub worker source (EvidenceVaultDO). /verify recomputes each
// entry's SHA-256 chainHash from {entryId, caseId, payloadHash, prevHash, ts}
// and compares it to the stored value; /deposit enforces the dual-signature
// length guards (ML-DSA-65 >= 6600 hex chars, Ed25519 >= 128 hex chars). The
// chain-link invariant (an entry's prevHash must equal the prior entry's
// chainHash in the same case) is checked structurally per the schema.
//
// HONESTY: the canonical source only length-checks the dual signatures — real
// Ed25519 / ML-DSA-65 crypto verification is NOT implemented. This gate proves
// chain-integrity + signature-guard, NOT crypto verification.
//
// State source: --state <path> (a JSON file, or a directory containing
// state.json), GATE_STATE (same), or GATE_LIVE_SOURCE <url> serving the same
// JSON snapshot. With no state source the gate cannot run — it exits 1 with
// GATE_UNRUNNABLE rather than faking a pass.
//
// Markers (unambiguous, machine-parseable):
//   GATE_PASS: evidence-chain-verify                         exit 0
//   GATE_FAIL: evidence-chain-verify: <reason>               exit 1
//   GATE_UNRUNNABLE: evidence-chain-verify: <reason>         exit 1

import { DatabaseSync } from 'node:sqlite';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCanonical } from '../nc/_canonical.mjs';

const GATE_ID = 'evidence-chain-verify';
const BUILD = '/tmp/opencode/nc-build/justice';
const INDEX_TS =
  process.env.GATE_CANONICAL_SOURCE ??
  '/home/p31/P31-local-workspace/workers/p31-justice-hub/src/index.ts';
const CF_STUB = fileURLToPath(new URL('../nc/cf-stub.mjs', import.meta.url));

const MLDSA65_MIN = 6600;
const ED25519_MIN = 128;

class SqlShim {
  constructor(db) {
    this.db = db;
  }
  exec(sql, ...params) {
    return this.db.prepare(sql).all(...params);
  }
}

function parseArgv(argv) {
  let state = null;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--state') state = argv[++i];
    else if (a.startsWith('--state=')) state = a.slice('--state='.length);
  }
  return { state };
}

async function resolveState(argv) {
  const { state: stateArg } = parseArgv(argv);
  const source = stateArg || process.env.GATE_STATE;
  if (source) {
    let target = source;
    try {
      if (statSync(source).isDirectory()) target = path.join(source, 'state.json');
    } catch (e) {
      return { err: `state path not readable: ${source} (${e.message})` };
    }
    let text;
    try {
      text = readFileSync(target, 'utf8');
    } catch (e) {
      return { err: `cannot read state file ${target} (${e.message})` };
    }
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return { err: `state file ${target} is not valid JSON (${e.message})` };
    }
    return { data };
  }
  if (process.env.GATE_LIVE_SOURCE) {
    const url = process.env.GATE_LIVE_SOURCE;
    let res;
    try {
      res = await fetch(url);
    } catch (e) {
      return { err: `live source unreachable (${url}): ${e.message}` };
    }
    if (!res.ok) return { err: `live source returned HTTP ${res.status} (${url})` };
    let text;
    try {
      text = await res.text();
    } catch (e) {
      return { err: `live source read failed (${url}): ${e.message}` };
    }
    try {
      return { data: JSON.parse(text) };
    } catch (e) {
      return { err: `live source ${url} did not return JSON state (${e.message})` };
    }
  }
  return {
    err: 'no state source configured (pass --state <path>, set GATE_STATE, or set GATE_LIVE_SOURCE)',
  };
}

function emitFail(msg) {
  console.log(`GATE_FAIL: ${GATE_ID}: ${msg}`);
  process.exit(1);
}

function emitUnrunnable(msg) {
  console.log(`GATE_UNRUNNABLE: ${GATE_ID}: ${msg}`);
  process.exit(1);
}

async function main() {
  const { data, err } = await resolveState(process.argv);
  if (err) return emitUnrunnable(err);

  const chain = data && data.chain;
  if (!Array.isArray(chain) || chain.length === 0)
    return emitUnrunnable('state has no non-empty chain array (expected { chain: [...] })');

  const { EvidenceVaultDO } = await loadCanonical(INDEX_TS, {
    buildDir: BUILD,
    cloudflareDurableObjectStub: CF_STUB,
  });

  const db = new DatabaseSync(':memory:');
  const storage = { sql: new SqlShim(db) };
  const vault = new EvidenceVaultDO({ storage }, {});

  db.exec(
    `CREATE TABLE IF NOT EXISTS evidence (id TEXT, caseId TEXT, uploaderDid TEXT, payloadHash TEXT, prevHash TEXT, chainHash TEXT, ts INTEGER, metadata TEXT, ed25519Sig TEXT, mldsa65Sig TEXT)`
  );

  const entries = [];
  for (const [i, e] of chain.entries()) {
    if (!e || typeof e !== 'object') return emitUnrunnable(`chain entry ${i} is not an object`);
    for (const k of ['entryId', 'caseId', 'payloadHash', 'chainHash', 'ts']) {
      if (e[k] === undefined || e[k] === null)
        return emitUnrunnable(`chain entry ${i} missing field '${k}' (cannot run detection)`);
    }
    const entry = {
      entryId: String(e.entryId),
      caseId: String(e.caseId),
      payloadHash: String(e.payloadHash),
      prevHash: e.prevHash ?? null,
      chainHash: String(e.chainHash),
      ts: Number(e.ts),
      ed25519Sig: e.ed25519Sig ?? '',
      mldsa65Sig: e.mldsa65Sig ?? '',
    };
    entries.push(entry);
    db.prepare('INSERT INTO evidence VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      entry.entryId,
      entry.caseId,
      String(e.uploaderDid ?? ''),
      entry.payloadHash,
      entry.prevHash,
      entry.chainHash,
      entry.ts,
      '{}',
      entry.ed25519Sig,
      entry.mldsa65Sig
    );
  }

  // Link integrity: in each case, an entry's prevHash must equal the prior
  // entry's chainHash (the schema's chaining rule).
  const byCase = new Map();
  for (const e of entries) {
    if (!byCase.has(e.caseId)) byCase.set(e.caseId, []);
    byCase.get(e.caseId).push(e);
  }
  for (const [caseId, list] of byCase) {
    list.sort((a, b) => a.ts - b.ts);
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1];
      const cur = list[i];
      if (cur.prevHash !== prev.chainHash)
        return emitFail(
          `entry ${cur.entryId} prevHash does not link prior chainHash (case ${caseId}) — chain broken`
        );
    }
  }

  // Dual-signature guards (the canonical /deposit thresholds).
  for (const e of entries) {
    if (e.ed25519Sig.length < ED25519_MIN)
      return emitFail(
        `entry ${e.entryId} Ed25519 signature truncated (${e.ed25519Sig.length} < ${ED25519_MIN} hex chars)`
      );
    if (e.mldsa65Sig.length < MLDSA65_MIN)
      return emitFail(
        `entry ${e.entryId} ML-DSA-65 signature truncated (${e.mldsa65Sig.length} < ${MLDSA65_MIN} hex chars)`
      );
  }

  // Real canonical detection: EvidenceVaultDO /verify recomputes the chainHash.
  for (const e of entries) {
    const res = await vault.fetch(
      new Request('http://vault/verify', {
        method: 'POST',
        body: JSON.stringify({ entryId: e.entryId }),
      })
    );
    const body = await res.json();
    if (!res.ok || body.valid !== true)
      return emitFail(
        `entry ${e.entryId} chainHash mismatch — SHA-256 recompute diverges from stored value`
      );
  }

  console.log(
    `evidence-chain-verify: ${entries.length} entry(ies) — every chainHash recomputes (real EvidenceVaultDO /verify), every prevHash links the prior chainHash, and every dual signature passes the canonical length guards.`
  );
  console.log(`GATE_PASS: ${GATE_ID}`);
}

main().catch((e) => {
  console.error(`${GATE_ID} error: ${e.message}`);
  console.log(`GATE_UNRUNNABLE: ${GATE_ID}: gate crashed (${e.message})`);
  process.exit(1);
});