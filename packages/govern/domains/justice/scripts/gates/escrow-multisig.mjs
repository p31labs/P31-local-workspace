// Gate: escrow-multisig
// Constitution scope: "escrow release: 2-of-3 multi-sig consensus"
//
// Detection: this gate runs the REAL canonical detection logic from the
// p31-justice-hub worker source (EscrowEngineDO). /release only transitions an
// escrow to RELEASED once two DISTINCT authorized signer DIDs have approved
// (dedup via approvals.includes, authorization via {payer,payee,arbiter}); a
// single signer, a duplicate signer, and an outsider are all held back. The
// gate replays the stored approval sequence against the real /release handler
// and asserts the stored status + approvals are a reachable canonical state.
//
// HONESTY: the canonical source trusts signerDid in the release request — there
// is no cryptographic proof that the DID owns the signature. This gate proves
// the 2-of-3 consensus rule is enforced on the stored state, NOT that each
// approval was cryptographically signed.
//
// State source: --state <path> (a JSON file, or a directory containing
// state.json), GATE_STATE (same), or GATE_LIVE_SOURCE <url> serving the same
// JSON snapshot. With no state source the gate cannot run — it exits 1 with
// GATE_UNRUNNABLE rather than faking a pass.
//
// Markers (unambiguous, machine-parseable):
//   GATE_PASS: escrow-multisig                                 exit 0
//   GATE_FAIL: escrow-multisig: <reason>                       exit 1
//   GATE_UNRUNNABLE: escrow-multisig: <reason>                 exit 1

import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCanonical } from '../nc/_canonical.mjs';

const GATE_ID = 'escrow-multisig';
const BUILD = '/tmp/opencode/nc-build/justice';
const INDEX_TS =
  process.env.GATE_CANONICAL_SOURCE ??
  '/home/p31/P31-local-workspace/workers/p31-justice-hub/src/index.ts';
const CF_STUB = fileURLToPath(new URL('../nc/cf-stub.mjs', import.meta.url));

const REQUIRED = ['escrowId', 'payerDid', 'payeeDid', 'arbiterDid', 'amount', 'condition', 'status', 'approvals'];

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

// Replay the stored approvals against the REAL EscrowEngineDO /release handler.
// Returns { ok } or { fail: reason }.
async function replayEscrow(escrow, EscrowEngineDO) {
  const { escrowId, payerDid, payeeDid, arbiterDid, amount, condition, status, approvals, ts } = escrow;
  for (const k of REQUIRED) {
    if (escrow[k] === undefined || escrow[k] === null)
      return { unrunnable: `escrow ${escrowId} missing field '${k}' (cannot run detection)` };
  }
  if (!Array.isArray(approvals))
    return { unrunnable: `escrow ${escrowId} approvals is not an array (cannot run detection)` };

  const storage = {
    _map: new Map(),
    put(k, v) {
      this._map.set(k, v);
    },
    get(k) {
      return this._map.get(k) ?? null;
    },
  };
  const doEngine = new EscrowEngineDO({ storage }, {});
  storage.put(`escrow:${escrowId}`, {
    escrowId,
    payerDid,
    payeeDid,
    arbiterDid,
    amount,
    condition,
    status: 'LOCKED',
    approvals: [],
    ts: ts ?? Date.now(),
  });
  const post = (p, body) =>
    doEngine.fetch(new Request('http://escrow' + p, { method: 'POST', body: JSON.stringify(body) }));

  for (const did of approvals) {
    const res = await post('/release', { escrowId, signerDid: did });
    if (res.status === 403)
      return { fail: `escrow ${escrowId}: unauthorized signer ${did} recorded in approvals — 2-of-3 violated` };
    if (res.status === 400)
      return { fail: `escrow ${escrowId}: release attempted after consensus — approval sequence exceeds 2-of-3` };
    const body = await res.json();
    if (body.status === 'RELEASED' && did !== approvals[approvals.length - 1])
      return { fail: `escrow ${escrowId}: released before all stored approvals were consumed` };
  }

  const final = storage.get(`escrow:${escrowId}`);
  // The canonical handler only ever persists LOCKED or RELEASED (the
  // PENDING_CONSENSUS response is not written back to storage), and RELEASED
  // requires the real /release to have seen >= 2 distinct authorized signers.
  const canonicalStatus = final.approvals.length >= 2 ? 'RELEASED' : 'LOCKED';
  if (status === 'RELEASED' && final.approvals.length < 2)
    return {
      fail: `escrow ${escrowId}: RELEASED with only ${final.approvals.length} distinct signer(s) recorded — 2-of-3 violated (single-signer release)`,
    };
  if (status === 'LOCKED' && final.approvals.length >= 2)
    return {
      fail: `escrow ${escrowId}: status LOCKED but approvals already reach 2-of-3 — canonical /release would have released`,
    };
  if (status !== canonicalStatus)
    return {
      fail: `escrow ${escrowId}: stored status '${status}' is not a reachable canonical state — canonical storage only persists '${canonicalStatus}'`,
    };
  if (
    final.approvals.length !== approvals.length ||
    final.approvals.some((d, i) => d !== approvals[i])
  )
    return { fail: `escrow ${escrowId}: stored approvals do not match the canonical release replay` };

  return { ok: true };
}

async function main() {
  const { data, err } = await resolveState(process.argv);
  if (err) return emitUnrunnable(err);

  const escrows = data && data.escrows;
  if (!Array.isArray(escrows) || escrows.length === 0)
    return emitUnrunnable('state has no non-empty escrows array (expected { escrows: [...] })');

  const { EscrowEngineDO } = await loadCanonical(INDEX_TS, {
    buildDir: BUILD,
    cloudflareDurableObjectStub: CF_STUB,
  });

  for (const escrow of escrows) {
    if (!escrow || typeof escrow !== 'object')
      return emitUnrunnable('an escrow record is not an object');
    const r = await replayEscrow(escrow, EscrowEngineDO);
    if (r.unrunnable) return emitUnrunnable(r.unrunnable);
    if (r.fail) return emitFail(r.fail);
  }

  console.log(
    `escrow-multisig: ${escrows.length} escrow record(s) — every stored approval sequence replays to the stored status against the real EscrowEngineDO /release (2-of-3 distinct authorized signers required; single/duplicate/outsider signers rejected).`
  );
  console.log(`GATE_PASS: ${GATE_ID}`);
}

main().catch((e) => {
  console.error(`${GATE_ID} error: ${e.message}`);
  console.log(`GATE_UNRUNNABLE: ${GATE_ID}: gate crashed (${e.message})`);
  process.exit(1);
});