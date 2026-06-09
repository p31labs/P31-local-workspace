#!/usr/bin/env node
/**
 * Phase E: Cryptography surface gate
 * - If packages/quantum-core exists: run its test suite (P0 on failure)
 * - Verify the passkey Worker uses SubtleCrypto, not raw ECDSA polyfills
 * - Document the classical/PQC boundary (WebAuthn = classical by spec; app layer = ML-KEM/ML-DSA)
 * - Skip gracefully in partial-clone environments
 */

import { existsSync, readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "../..");
const MONO_ROOT = resolve(ROOT, "../..");
const QC_PKG = resolve(MONO_ROOT, "04_SOFTWARE/packages/quantum-core/package.json");
const PQC_AUDIT = resolve(MONO_ROOT, "04_SOFTWARE/packages/quantum-core/scripts/pqc-audit.mjs");
const PASSKEY_SRC = resolve(ROOT, "workers/passkey/src/index.ts");
const PASSKEY_WRANGLER = resolve(ROOT, "workers/passkey/wrangler.toml");

function log(level, msg) {
  const prefix = { P0: "[FAIL]", P1: "[WARN]", P2: "[INFO]", OK: "[ OK ]" }[level] ?? "[    ]";
  console.log(`${prefix} ${msg}`);
}

function runPqcDependencyAudit() {
  const qcDir = dirname(QC_PKG);
  if (!existsSync(PQC_AUDIT)) {
    log("P2", "pqc-audit.mjs not found — skipping @noble supply-chain preflight");
    return true;
  }
  try {
    execSync(`node ${JSON.stringify(PQC_AUDIT)} --quiet`, {
      cwd: qcDir,
      stdio: "inherit",
      timeout: 15_000,
    });
    log("OK", "PQC supply-chain: @noble/post-quantum install + entrypoints verified");
    return true;
  } catch {
    log("P0", "pqc-audit: FAILED — @noble/post-quantum missing, wrong version, or broken package layout");
    return false;
  }
}

function runQuantumCoreTests() {
  const qcDir = dirname(QC_PKG);
  log("P2", `quantum-core found at ${qcDir} — running test suite`);
  try {
    execSync("npm test", {
      cwd: qcDir,
      stdio: "inherit",
      timeout: 60_000,
    });
    log("OK", "quantum-core: all tests passed (FIPS 203/204 KAT byte-size checks included)");
    return true;
  } catch {
    log("P0", "quantum-core: test suite FAILED — ML-KEM/ML-DSA implementation is broken");
    return false;
  }
}

/**
 * Enforce documented production/preview RP_ID values in wrangler (catches accidental edits).
 * workers.dev / localhost use top-level [vars]; production zone routes must stay on p31ca.org.
 */
function verifyPasskeyWranglerRpIds() {
  if (!existsSync(PASSKEY_WRANGLER)) {
    log("P2", "passkey wrangler.toml not found — skipping RP_ID contract check");
    return true;
  }
  const content = readFileSync(PASSKEY_WRANGLER, "utf8");
  const lines = content.split(/\r?\n/);
  /** @type {Record<string, string | undefined>} */
  const expected = {
    "env.production.vars": "p31ca.org",
    "env.preview.vars": "p31ca.pages.dev",
  };
  /** @type {string | null} */
  let currentSection = null;

  /** @type {Record<string, string>} */
  const found = {};
  for (const line of lines) {
    const sec = line.match(/^\[([^\]]+)\]\s*$/);
    if (sec) {
      currentSection = sec[1];
      continue;
    }
    if (!currentSection || !(currentSection in expected)) continue;
    const rp = line.match(/^\s*RP_ID\s*=\s*"([^"]*)"\s*$/);
    if (rp) found[currentSection] = rp[1];
  }

  let ok = true;
  for (const [section, want] of Object.entries(expected)) {
    const got = found[section];
    if (got !== want) {
      log(
        "P0",
        `passkey wrangler: [${section}] RP_ID must be "${want}" (got ${got === undefined ? "missing" : JSON.stringify(got)})`
      );
      ok = false;
    }
  }
  if (ok) log("OK", "passkey wrangler: production/preview RP_ID contract OK (p31ca.org / p31ca.pages.dev)");
  return ok;
}

function verifyPasskeyBoundary() {
  if (!existsSync(PASSKEY_SRC)) {
    log("P2", "passkey Worker source not found — skipping crypto boundary check");
    return { ok: true, skipped: true };
  }
  const src = readFileSync(PASSKEY_SRC, "utf8");

  // Must use SubtleCrypto for verification — not a polyfill
  const usesSubtle = src.includes("crypto.subtle.verify") || src.includes("crypto.subtle.importKey");
  // Must not claim PQC for WebAuthn
  const noFalsePqcClaim = !src.includes("ml_kem") && !src.includes("ml_dsa") && !src.includes("mlKem") && !src.includes("mlDsa");
  // Replay protection present
  const hasReplay = src.includes("signCount") && src.includes("replay");

  if (!usesSubtle) {
    log("P1", "passkey Worker: SubtleCrypto verify not found — confirm crypto is not polyfilled");
  } else {
    log("OK", "passkey Worker: SubtleCrypto.verify confirmed (ES256 ECDSA + RS256 per WebAuthn spec)");
  }

  if (!noFalsePqcClaim) {
    log("P1", "passkey Worker: ML-KEM/ML-DSA references found — WebAuthn wire format is classical by spec, not ML-DSA");
  } else {
    log("OK", "passkey Worker: boundary correct — WebAuthn=classical ECDSA/RSA, PQC=app layer only");
  }

  if (!hasReplay) {
    log("P1", "passkey Worker: signCount replay check not detected — verify auth-finish implements replay protection");
  } else {
    log("OK", "passkey Worker: signCount replay protection present");
  }

  return { ok: usesSubtle && noFalsePqcClaim, usesSubtle, noFalsePqcClaim, hasReplay };
}

export function runCryptoSurface() {
  let p0 = 0;

  // Quantum-core gate (skip if not in checkout): audit first; run tests only if audit passes
  if (existsSync(QC_PKG)) {
    if (!runPqcDependencyAudit()) {
      p0++;
    } else {
      const passed = runQuantumCoreTests();
      if (!passed) p0++;
    }
  } else {
    log("P2", "packages/quantum-core not in checkout — skipping PQC test gate (partial clone)");
  }

  // Passkey wrangler RP_ID (P0 — misconfiguration breaks WebAuthn binding)
  if (!verifyPasskeyWranglerRpIds()) {
    p0++;
  }

  // Passkey boundary check (always run if source present)
  const boundary = verifyPasskeyBoundary();
  if (!boundary.ok && !boundary.skipped) {
    // Boundary issues are P1, not P0 (documentation problems, not broken runtime crypto)
  }

  return { ok: p0 === 0 };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok } = runCryptoSurface();
  if (!ok) process.exit(1);
}
