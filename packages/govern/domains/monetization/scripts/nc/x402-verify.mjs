// Negative control: x402-verify
// Gate: "x402 verify route — must reject invalid payment headers"
// constitution.command: node scripts/gates/x402-verify.mjs
//
// This NC does NOT run the canonical detection directly. It exercises the GATE
// COMMAND — the exact script the constitution declares — by writing a corrupted
// fixture STATE (schema x402-verify.state.v1) and asserting the gate emits
// GATE_FAIL + exits 1 on it, and GATE_PASS + exits 0 on a clean fixture.
//
// Corruption injected: invalid X-PAYMENT headers RECORDED as accepted — the
// gate's state says the verify route let them through. Non-base64 garbage,
// base64 of non-JSON bytes, and well-formed JSON of the wrong shape must all be
// rejected by the real parse+match logic; recording them as accepted is a
// mismatch the gate must flag (GATE_FAIL). A clean fixture — a well-formed v2
// payload accepted and garbage rejected — must pass (GATE_PASS), proving the
// FAIL is corruption-specific.

import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const GATE_ID = 'x402-verify';
const GATE_SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'gates',
  `${GATE_ID}.mjs`
);
const STATE_SCHEMA = 'x402-verify.state.v1';
const NETWORK = 'eip155:84532';
const PAY_TO = '0x51c285Df171C76bE36252e32679F098d90768413';
const PRICE = '$0.01';
const ASSET = 'USDC';
const AMOUNT = '0.01';

const b64 = (s) => Buffer.from(s, 'utf8').toString('base64');

// The exact accepted-requirement shape the gate builds from the state and that
// a well-formed header must echo to be accepted.
function buildRequirement() {
  return {
    scheme: 'exact',
    network: NETWORK,
    asset: ASSET,
    amount: AMOUNT,
    payTo: PAY_TO,
    maxTimeoutSeconds: 60,
    extra: {},
  };
}

function buildCleanState() {
  const valid = {
    x402Version: 2,
    accepted: buildRequirement(),
    payload: { txHash: '0xabc', token: 'signed-token' },
  };
  return {
    schema: STATE_SCHEMA,
    network: NETWORK,
    payTo: PAY_TO,
    price: PRICE,
    asset: ASSET,
    amount: AMOUNT,
    maxTimeoutSeconds: 60,
    headers: [
      { label: 'well-formed v2 payload', value: b64(JSON.stringify(valid)), expected: 'accept' },
      { label: 'non-base64 garbage', value: '!!!not-base64-at-all!!!', expected: 'reject' },
    ],
  };
}

// CORRUPTION: invalid headers RECORDED as accepted — the wrongful-grant class.
function buildCorruptState() {
  return {
    schema: STATE_SCHEMA,
    network: NETWORK,
    payTo: PAY_TO,
    price: PRICE,
    asset: ASSET,
    amount: AMOUNT,
    maxTimeoutSeconds: 60,
    headers: [
      { label: 'non-base64 garbage RECORDED accepted', value: '!!!not-base64-at-all!!!', expected: 'accept' },
      { label: 'base64 of non-JSON RECORDED accepted', value: b64('this is not json { at all'), expected: 'accept' },
      { label: 'wrong-shape JSON RECORDED accepted', value: b64(JSON.stringify({ foo: 1 })), expected: 'accept' },
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
      `x402-verify: the ACTUAL gate command (scripts/gates/x402-verify.mjs --state <fixture>) ` +
        `proved it can fail on the wrongful-accept class (invalid X-PAYMENT headers recorded as accepted) `
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