#!/usr/bin/env node
/**
 * P31 Security Suite — main orchestrator
 *
 * Phases run in order:
 *   A  verify   — existing npm run verify (contracts, ground-truth, egg-hunt, passport)
 *   B  sca      — npm audit with suppression file (P0 = prod runtime vulns only)
 *   C  worker   — wrangler.toml inventory + CORS wildcard scan (P1 warnings)
 *   E  crypto   — quantum-core test gate + passkey boundary + wrangler RP_ID contract
 *
 * Flags:
 *   --ci         machine-readable output, strict exit codes
 *   --full       add Phase C worker inventory + Phase E crypto (default: on)
 *   --skip-A     skip existing verify scripts (useful when called from within verify)
 *   --only=B,E   run specific phases only
 *
 * Policy:
 *   Exit 1 only on P0 findings (unsuppressed critical/high in prod runtime deps,
 *   or broken quantum-core tests when package is present).
 *   P1 warnings are printed but do not fail the run.
 */

import { execSync } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "../..");

const args = process.argv.slice(2);
const CI = process.env.CI === "true" || args.includes("--ci");
const SKIP_A = args.includes("--skip-A");
const onlyArg = args.find(a => a.startsWith("--only="));
const only = onlyArg ? new Set(onlyArg.replace("--only=", "").split(",")) : null;

function shouldRun(phase) {
  return only ? only.has(phase) : true;
}

function log(level, msg) {
  const prefix = { P0: "[FAIL]", P1: "[WARN]", P2: "[INFO]", OK: "[ OK ]", H: "══════" }[level] ?? "[    ]";
  console.log(`${prefix} ${msg}`);
}

function header(msg) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${msg}`);
  console.log(`${"═".repeat(60)}`);
}

function runPhase(label, fn) {
  header(`Phase ${label}`);
  try {
    return fn();
  } catch (err) {
    log("P0", `Phase ${label} threw: ${err.message}`);
    return { ok: false };
  }
}

async function main() {
  const startMs = Date.now();
  const report = { startedAt: new Date().toISOString(), phases: {}, p0: 0, p1: 0 };

  // ── Phase A: Existing verify scripts ─────────────────────────────────────
  if (shouldRun("A") && !SKIP_A) {
    const result = runPhase("A  P31 Contracts + Egg Hunt + Passport", () => {
      try {
        execSync("npm run verify", { cwd: ROOT, stdio: "inherit", timeout: 120_000 });
        return { ok: true };
      } catch {
        return { ok: false };
      }
    });
    report.phases.A = result;
    if (!result.ok) report.p0++;
  } else {
    log("P2", "Phase A skipped (--skip-A or not in run set)");
  }

  // ── Phase B: SCA ─────────────────────────────────────────────────────────
  if (shouldRun("B")) {
    const { runSCA } = await import("./sca.mjs");
    const result = runPhase("B  Dependency Audit (SCA)", () => runSCA({ ci: CI }));
    report.phases.B = result.results ?? result;
    if (!result.ok) report.p0++;
    report.p1 += result.results?.summary?.p1 ?? 0;
  }

  // ── Phase C: Worker inventory ─────────────────────────────────────────────
  if (shouldRun("C")) {
    const { runWorkerInventory } = await import("./verify-worker-inventory.mjs");
    const result = runPhase("C  Worker Inventory + CORS Scan", () => runWorkerInventory());
    report.phases.C = { ok: result.ok, workerCount: result.inventory?.workers?.length };
    report.p1 += result.p1 ?? 0;
  }

  // ── Phase E: Crypto surface ───────────────────────────────────────────────
  if (shouldRun("E")) {
    const { runCryptoSurface } = await import("./verify-crypto-surface.mjs");
    const result = runPhase("E  Crypto Surface (PQC gate + passkey boundary)", () => runCryptoSurface());
    report.phases.E = result;
    if (!result.ok) report.p0++;
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  header("Summary");
  report.durationMs = Date.now() - startMs;
  report.completedAt = new Date().toISOString();

  if (report.p0 === 0) {
    log("OK", `Security suite PASSED. ${report.p1} warning(s). Duration: ${(report.durationMs / 1000).toFixed(1)}s`);
  } else {
    log("P0", `Security suite FAILED. ${report.p0} P0 finding(s), ${report.p1} warning(s). Duration: ${(report.durationMs / 1000).toFixed(1)}s`);
  }

  if (report.p1 > 0) {
    log("P1", `${report.p1} warning(s) — see output above. No action required for CI to pass, but review recommended.`);
  }

  // Write report
  try {
    mkdirSync(resolve(ROOT, "build"), { recursive: true });
    writeFileSync(
      resolve(ROOT, "build/security-report.json"),
      JSON.stringify(report, null, 2)
    );
    log("P2", "Report written to build/security-report.json");
  } catch {}

  if (report.p0 > 0) process.exit(1);
}

main().catch(err => {
  console.error("[P0] Security runner crashed:", err.message);
  process.exit(1);
});
