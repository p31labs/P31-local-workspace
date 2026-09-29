// Negative control: evidence-chain-verify
// Gate: "evidence entries: chainHash must link prevHash, dual signatures must verify"
// Canonical detection: EvidenceVaultDO in the real worker source
// (/home/p31/P31-local-workspace/workers/p31-justice-hub/src/index.ts) — the
// /deposit + /verify handlers run the real SHA-256 chain recompute and the
// dual-signature truncation guards.
//
// This NC does NOT call the detection logic directly. It builds corrupted
// fixture STATE and executes the ACTUAL gate command the constitution declares:
//   node scripts/gates/evidence-chain-verify.mjs --state <fixture>
// The gate replays the fixture through the real canonical logic. The NC asserts
// the gate emits GATE_FAIL + exits 1 on each corruption (proves the gate can
// fail), and GATE_PASS + exits 0 on a clean fixture (specificity).
//
// Corruption injected (the state the gate must catch):
//   1. tampered stored chainHash       — /verify recompute diverges
//   2. truncated ML-DSA-65 signature   — deposit length-guard (< 6600 hex chars)
//   3. broken prevHash→chainHash link  — chaining invariant violated
//
// HONESTY: the canonical source only length-checks the dual signatures — real
// Ed25519 / ML-DSA-65 crypto verification is NOT implemented. This NC proves the
// GATE command rejects chain-integrity + signature-guard corruption, NOT crypto
// verification.
//
// Leak discipline: the temp fixture dir is removed in `finally`. Failures set
// process.exitCode (never process.exit inside the try — that skips finally).

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE_ID = 'evidence-chain-verify';
const GATE_SCRIPT = fileURLToPath(new URL('../gates/evidence-chain-verify.mjs', import.meta.url));
const CASE = 'case-nc';

function sha256hex(s) {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

// Mirror the canonical /verify recompute: SHA-256 over
// {entryId, caseId, payloadHash, prevHash, ts} (key order matters).
function chainHash(entryId, caseId, payloadHash, prevHash, ts) {
  return sha256hex(JSON.stringify({ entryId, caseId, payloadHash, prevHash, ts }));
}

function baseEntry(over) {
  return {
    entryId: 'e',
    caseId: CASE,
    uploaderDid: 'did:key:uploader',
    payloadHash: 'ab'.repeat(32),
    prevHash: null,
    ts: 1000,
    ed25519Sig: 'cd'.repeat(64),
    mldsa65Sig: 'ef'.repeat(3309),
    ...over,
  };
}

// A pristine 2-entry chain in one case: e2.prevHash === e1.chainHash, and every
// stored chainHash recomputes under the canonical formula.
function cleanState() {
  const e1 = baseEntry({ entryId: 'e1', prevHash: null, ts: 1000 });
  e1.chainHash = chainHash(e1.entryId, e1.caseId, e1.payloadHash, e1.prevHash, e1.ts);
  const e2 = baseEntry({ entryId: 'e2', prevHash: e1.chainHash, ts: 2000 });
  e2.chainHash = chainHash(e2.entryId, e2.caseId, e2.payloadHash, e2.prevHash, e2.ts);
  return { chain: [e1, e2] };
}

function runGate(dir, state) {
  const stateFile = path.join(dir, 'state.json');
  writeFileSync(stateFile, JSON.stringify(state, null, 2));
  const res = spawnSync(process.execPath, [GATE_SCRIPT, '--state', stateFile], {
    encoding: 'utf8',
    timeout: 30000,
  });
  return { status: res.status, stdout: res.stdout || '', stderr: res.stderr || '', error: res.error };
}

function assertGateFail(dir, state, corruption) {
  const r = runGate(dir, state);
  const all = (r.stdout + r.stderr).trim();
  if (r.status !== 1)
    throw new Error(`${corruption}: gate exited ${r.status} (expected 1). Output: ${all}`);
  if (!r.stdout.includes(`GATE_FAIL: ${GATE_ID}`))
    throw new Error(`${corruption}: gate did not emit GATE_FAIL: ${GATE_ID}. Output: ${all}`);
  if (r.stdout.includes(`GATE_PASS: ${GATE_ID}`))
    throw new Error(`${corruption}: gate emitted GATE_PASS on a corrupted fixture (gate broken). Output: ${all}`);
  return r;
}

function assertGatePass(dir, state) {
  const r = runGate(dir, state);
  const all = (r.stdout + r.stderr).trim();
  if (r.status !== 0)
    throw new Error(`clean fixture: gate exited ${r.status} (expected 0). Output: ${all}`);
  if (!r.stdout.includes(`GATE_PASS: ${GATE_ID}`))
    throw new Error(`clean fixture: gate did not emit GATE_PASS: ${GATE_ID}. Output: ${all}`);
  if (r.stdout.includes(`GATE_FAIL: ${GATE_ID}`))
    throw new Error(`clean fixture: gate emitted GATE_FAIL on a clean fixture (not specific). Output: ${all}`);
  return r;
}

function failMarker(r) {
  return (r.stdout.split('\n').find((l) => l.includes('GATE_FAIL')) || '').trim();
}

async function main() {
  let tmp = null;
  try {
    tmp = mkdtempSync(path.join(tmpdir(), 'nc-evidence-chain-'));

    const clean = assertGatePass(tmp, cleanState());
    console.log(`evidence-chain: clean fixture → GATE_PASS (exit 0)`);

    const corruptions = [
      ['tampered stored chainHash', (s) => { s.chain[0].chainHash = '00'.repeat(32); s.chain[1].prevHash = '00'.repeat(32); }],
      ['truncated ML-DSA-65 signature', (s) => { s.chain[0].mldsa65Sig = 'ef'.repeat(8); }],
      ['broken prevHash→chainHash link', (s) => { s.chain[1].prevHash = '00'.repeat(32); }],
    ];
    for (const [name, mutate] of corruptions) {
      const state = cleanState();
      mutate(state);
      const r = assertGateFail(tmp, state, name);
      console.log(`evidence-chain: ${name} → ${failMarker(r)} (exit ${r.status})`);
    }

    console.log(
      'evidence-chain: the REAL gate command (node scripts/gates/evidence-chain-verify.mjs --state <fixture>) ' +
      'rejected tampered chainHash, truncated ML-DSA-65, and broken prevHash links with GATE_FAIL + exit 1, ' +
      'and passed a clean chain with GATE_PASS + exit 0. Signature CRYPTO verification is not implemented ' +
      'in the canonical source (only length guards), so this proves the chain-integrity + signature-guard ' +
      'failure paths, NOT crypto verification.'
    );
    console.log('NEGATIVE_CONTROL_OK');
  } catch (e) {
    console.error('evidence-chain NEGATIVE CONTROL FAILED: ' + e.message);
    process.exitCode = 1;
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}

main();