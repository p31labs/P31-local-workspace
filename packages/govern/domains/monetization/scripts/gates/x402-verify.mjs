// Gate: x402-verify
// constitution.command: node scripts/gates/x402-verify.mjs
// Scope: x402 verify route — must reject invalid payment headers.
// Canonical detection: the REAL entitlement worker source
// /home/p31/p31-capital-machine/workers/entitlement/x402.ts — the exact code
// the /entitlement route runs to validate the X-PAYMENT header:
//   parsePaymentPayload() decodes base64 JSON (throws on garbage / non-JSON)
//   x402ResourceServer.findMatchingRequirements() rejects well-formed JSON
//   that does not match any accepted requirement (e.g. missing x402Version).
// Loaded exactly like the negative control scripts/nc/x402-verify.mjs: the
// raw x402.ts is imported directly (Node strips its types natively) and the
// @x402 runtime packages are resolved through the WORKER's node_modules graph.
// (The shared loader cannot rewrite x402.ts's bare package imports, so this
// gate mirrors the NC's proven mechanism rather than loadCanonical.)
//
// The gate's job: given the CURRENT state (which payment headers are recorded
// as accepted/rejected), is the invariant upheld? Every recorded verdict must
// agree with what the real parse+match logic would decide. A state that
// records an invalid header as accepted is corruption → GATE_FAIL.
//
// Markers (audit chain):
//   GATE_PASS: x402-verify                              exit 0
//   GATE_FAIL: x402-verify: <reason>                    exit 1
//   GATE_UNRUNNABLE: x402-verify: <reason>              exit 1
//
// Usage: node scripts/gates/x402-verify.mjs [--state <path>]
//   --state <path>   JSON state document (schema x402-verify.state.v1)
//                    or a directory containing state.json. Falls back to the
//                    GATE_STATE env var.
//   No --state and no GATE_LIVE_SOURCE → GATE_UNRUNNABLE (never a fake pass).
//   GATE_LIVE_SOURCE → GET {base}/entitlement/<probe-did> WITHOUT an
//   X-PAYMENT header: the real verify route must answer 402 Payment Required.
//   A 200 would mean the route accepted a missing payment header → FAIL.

import { pathToFileURL } from 'node:url';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const GATE_ID = 'x402-verify';
const STATE_SCHEMA = 'x402-verify.state.v1';
const X402_TS = '/home/p31/p31-capital-machine/workers/entitlement/x402.ts';

const { parsePaymentPayload } = await import(X402_TS);

// Resolve the real x402 packages through the WORKER's own node_modules graph
// (p31-capital-machine @x402 2.27.0), mirroring node's ESM exports resolution:
// read package.json exports[subpath].import.default and resolve that file.
function resolveWorkerPkg(pkgPath, subpath) {
  const pkg = JSON.parse(readFileSync(path.join(pkgPath, 'package.json'), 'utf8'));
  const exp = pkg.exports && pkg.exports[subpath];
  const target =
    (exp && exp.import && exp.import.default) ||
    (exp && (exp.default || (typeof exp === 'string' ? exp : null))) ||
    pkg.module ||
    pkg.main;
  if (typeof target !== 'string') {
    throw new Error(`no ESM target for ${pkgPath}#${subpath}: ${JSON.stringify(exp)}`);
  }
  return pathToFileURL(path.join(pkgPath, target)).href;
}

const X402_CORE = '/home/p31/p31-capital-machine/node_modules/@x402/core';
const X402_EVM = '/home/p31/p31-capital-machine/node_modules/@x402/evm';
const { x402ResourceServer } = await import(resolveWorkerPkg(X402_CORE, './server'));
const { ExactEvmScheme } = await import(resolveWorkerPkg(X402_EVM, './exact/server'));

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
  const probe = `${base}/entitlement/did:key:gate-live-probe`;
  try {
    const res = await fetch(probe, { headers: {} });
    if (res.status === 402) {
      console.log(`GATE_PASS: ${GATE_ID}`);
      console.log('x402-verify: live verify route rejected a missing X-PAYMENT header (402 Payment Required).');
      process.exit(0);
    }
    if (res.status === 200) {
      fail('live verify route ACCEPTED a request with no X-PAYMENT header (HTTP 200)');
    }
    unrunnable(`live verify route returned HTTP ${res.status} (unverifiable verdict)`);
  } catch (e) {
    unrunnable(`live source unreachable: ${e.message}`);
  }
}

async function verdictFor(server, requirement, header) {
  let parsed;
  try {
    parsed = parsePaymentPayload(header);
  } catch {
    return 'reject';
  }
  try {
    const matched = server.findMatchingRequirements([requirement], parsed);
    return matched ? 'accept' : 'reject';
  } catch {
    return 'reject';
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

  const headers = state.headers || [];
  if (!Array.isArray(headers) || headers.length === 0) {
    unrunnable('state declares no payment headers to verify (headers: [])');
  }

  // Build the accepted requirement set the same way the worker does: parse the
  // configured price with the real ExactEvmScheme on the configured network.
  const network = state.network || 'eip155:84532';
  const payTo = state.payTo || '0x51c285Df171C76bE36252e32679F098d90768413';
  const client = {};
  const server = new x402ResourceServer(client);
  const scheme = new ExactEvmScheme();
  server.register(network, scheme);
  const price = state.price || '$0.01';
  const parsedPrice = await scheme.parsePrice(price, network);
  const requirement = {
    scheme: 'exact',
    network,
    asset: state.asset || parsedPrice.asset,
    amount: state.amount || parsedPrice.amount,
    payTo,
    maxTimeoutSeconds: state.maxTimeoutSeconds ?? 60,
    extra: {},
  };

  const failures = [];
  for (const h of headers) {
    if (!h.value || !['accept', 'reject'].includes(h.expected)) {
      failures.push(`malformed header entry: ${JSON.stringify(h)}`);
      continue;
    }
    const actual = await verdictFor(server, requirement, h.value);
    if (actual !== h.expected) {
      failures.push(
        `state records "${h.label || h.value}" as ${h.expected} but the real verify logic says ${actual}`
      );
    }
  }

  if (failures.length > 0) {
    fail(failures.join('; '));
  }

  console.log(`GATE_PASS: ${GATE_ID}`);
  console.log(`x402-verify: ${headers.length} recorded header verdict(s) all agree with the real parse+match logic.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(`${GATE_ID} gate error:`, e);
  process.exit(1);
});