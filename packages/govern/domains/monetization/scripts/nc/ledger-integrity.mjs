// Negative control: revenue-ledger-integrity
// Gate: "revenue-ledger D1: every summary must reconcile with raw rows"
// constitution.command: node scripts/gates/revenue-ledger-integrity.mjs
//
// This NC does NOT run the canonical detection directly. It exercises the GATE
// COMMAND — the exact script the constitution declares — by writing a corrupted
// fixture STATE (schema revenue-ledger-integrity.state.v1) and asserting the
// gate emits GATE_FAIL + exits 1 on it, and GATE_PASS + exits 0 on a clean
// fixture.
//
// Corruption injected: the 93f4407d fork class — a forged duplicate revenue row
// claiming the same prev_hash as the committed head, inflating the source
// summary. The gate materializes the state into the REAL schema (UNIQUE index
// on prev_hash) and runs the real verifyHashChain; the forged duplicate must be
// flagged (GATE_FAIL). A clean chain must verify (GATE_PASS), proving the FAIL
// is corruption-specific.
//
// The fixture hashes are computed with the exact recordRevenue formula
// (sha256 of the canonical row payload) so the state is a REAL ledger state the
// gate replays through the real canonical logic.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE_ID = 'revenue-ledger-integrity';
const GATE_SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'gates',
  `${GATE_ID}.mjs`
);
const STATE_SCHEMA = 'revenue-ledger-integrity.state.v1';

async function sha256(data) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// The exact payload recordRevenue hashes: JSON.stringify of
// { id, source, payer_did, merchant_did, amount_usdc, asset, settlement_tx, created_at, prev_hash }.
async function chainRow(id, payerDid, amountUsdc, createdAt, prevHash) {
  const payload = JSON.stringify({
    id,
    source: 'x402',
    payer_did: payerDid,
    merchant_did: 'did:key:merchant',
    amount_usdc: amountUsdc,
    asset: 'USDC',
    settlement_tx: null,
    created_at: createdAt,
    prev_hash: prevHash,
  });
  return {
    id,
    source: 'x402',
    payer_did: payerDid,
    merchant_did: 'did:key:merchant',
    amount_usdc: amountUsdc,
    asset: 'USDC',
    metadata: null,
    settlement_tx: null,
    created_at: createdAt,
    prev_hash: prevHash,
    hash: await sha256(payload),
  };
}

async function buildCleanEvents() {
  const createdAt = Date.now();
  const events = [];
  let prev = 'genesis';
  for (let i = 1; i <= 3; i++) {
    events.push(await chainRow(`row-${i}`, 'did:key:payer', '1.00', createdAt, prev));
    prev = events[events.length - 1].hash;
  }
  return events;
}

async function buildCleanState() {
  return { schema: STATE_SCHEMA, events: await buildCleanEvents() };
}

// CORRUPTION (93f4407d fork class): a forged duplicate row claiming the SAME
// prev_hash as the committed head (the head's own predecessor) — at most one row
// may claim a given predecessor, so the real schema must reject it.
async function buildCorruptState() {
  const events = await buildCleanEvents();
  const head = events[events.length - 1];
  const forgedPrev = head.prev_hash;
  const forged = await chainRow(
    'forged-dup-row',
    'did:key:forger',
    '99999.00',
    head.created_at,
    forgedPrev
  );
  return { schema: STATE_SCHEMA, events: [...events, forged] };
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
    writeFileSync(cleanPath, JSON.stringify(await buildCleanState(), null, 2));
    writeFileSync(corruptPath, JSON.stringify(await buildCorruptState(), null, 2));

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
      `revenue-ledger-integrity: the ACTUAL gate command (scripts/gates/revenue-ledger-integrity.mjs --state <fixture>) ` +
        `proved it can fail on the 93f4407d fork class (forged duplicate row claiming the head's prev_hash, ` +
        `recorded as a $99999.00 revenue event) and pass on a clean 3-row chain.`
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