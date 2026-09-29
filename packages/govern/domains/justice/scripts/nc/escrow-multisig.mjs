// Negative control: escrow-multisig
// Gate: "escrow release: 2-of-3 multi-sig consensus"
// Canonical detection: EscrowEngineDO in the real worker source
// (/home/p31/P31-local-workspace/workers/p31-justice-hub/src/index.ts) — the
// /lock + /release handlers enforce the 2-of-3 requirement with distinct
// signer DIDs (dedup via approvals.includes).
//
// This NC does NOT call the detection logic directly. It builds corrupted
// fixture STATE and executes the ACTUAL gate command the constitution declares:
//   node scripts/gates/escrow-multisig.mjs --state <fixture>
// The gate replays the stored approvals through the real /release handler and
// asserts the stored status is a reachable canonical state. The NC asserts the
// gate emits GATE_FAIL + exits 1 on each corruption (proves the gate can fail),
// and GATE_PASS + exits 0 on a clean fixture (specificity).
//
// Corruption injected (the state the gate must catch):
//   1. single-signer release   — RELEASED with one distinct signer recorded
//   2. duplicate signer        — same DID twice recorded as two approvals
//   3. outsider signer (403)   — unauthorized DID in the approval sequence
//
// HONESTY: the canonical source trusts signerDid in the release request — there
// is no cryptographic proof that the DID owns the signature. This NC proves the
// GATE command enforces the 2-of-3 consensus rule on stored state, NOT that each
// approval was cryptographically signed.
//
// Leak discipline: the temp fixture dir is removed in `finally`. Failures set
// process.exitCode (never process.exit inside the try — that skips finally).

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE_ID = 'escrow-multisig';
const GATE_SCRIPT = fileURLToPath(new URL('../gates/escrow-multisig.mjs', import.meta.url));

function escrow(over) {
  return {
    escrowId: 'esc-nc',
    payerDid: 'did:key:A',
    payeeDid: 'did:key:B',
    arbiterDid: 'did:key:C',
    amount: 100,
    condition: 'both parties satisfied',
    ts: 1000,
    ...over,
  };
}

// A clean escrow: two DISTINCT authorized signers, status RELEASED — the only
// reachable canonical released state.
function cleanState() {
  return { escrows: [escrow({ approvals: ['did:key:A', 'did:key:B'], status: 'RELEASED' })] };
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
    tmp = mkdtempSync(path.join(tmpdir(), 'nc-escrow-multisig-'));

    const clean = assertGatePass(tmp, cleanState());
    console.log(`escrow-multisig: clean fixture → GATE_PASS (exit 0)`);

    const corruptions = [
      ['single-signer release', { approvals: ['did:key:A'], status: 'RELEASED' }],
      ['duplicate signer (same DID twice)', { approvals: ['did:key:A', 'did:key:A'], status: 'RELEASED' }],
      ['outsider signer (403)', { approvals: ['did:key:A', 'did:key:outsider'], status: 'RELEASED' }],
    ];
    for (const [name, over] of corruptions) {
      const state = { escrows: [escrow(over)] };
      const r = assertGateFail(tmp, state, name);
      console.log(`escrow-multisig: ${name} → ${failMarker(r)} (exit ${r.status})`);
    }

    console.log(
      'escrow-multisig: the REAL gate command (node scripts/gates/escrow-multisig.mjs --state <fixture>) ' +
      'rejected a single-signer release, a duplicate signer, and an outsider signer with GATE_FAIL + exit 1, ' +
      'and passed a clean 2-of-3 release with GATE_PASS + exit 0. The canonical source trusts signerDid — ' +
      'this proves the 2-of-3 consensus rule is enforced on stored state, NOT that each approval was ' +
      'cryptographically signed.'
    );
    console.log('NEGATIVE_CONTROL_OK');
  } catch (e) {
    console.error('escrow-multisig NEGATIVE CONTROL FAILED: ' + e.message);
    process.exitCode = 1;
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}

main();