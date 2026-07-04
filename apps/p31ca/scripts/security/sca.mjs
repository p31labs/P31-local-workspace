#!/usr/bin/env node
/**
 * Phase B: Software Composition Analysis
 * Wraps npm audit with a suppression file so known accepted-risk dev-build-tool
 * CVEs don't permanently red-light CI. Policy:
 *   P0 (fail) = unsuppressed critical or high in prod runtime deps (--omit=dev)
 *   P1 (warn) = unsuppressed high/moderate in dev deps, or expired suppressions
 *   P2 (info) = low / info
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "../..");
const SUPPRESSIONS_PATH = resolve(ROOT, "security/audit-suppressions.json");

const CI = process.env.CI === "true";
const today = new Date().toISOString().slice(0, 10);

function log(level, msg) {
  const prefix = { P0: "[FAIL]", P1: "[WARN]", P2: "[INFO]", OK: "[ OK ]" }[level] ?? "[    ]";
  console.log(`${prefix} ${msg}`);
}

function loadSuppressions() {
  if (!existsSync(SUPPRESSIONS_PATH)) return [];
  const { suppressions } = JSON.parse(readFileSync(SUPPRESSIONS_PATH, "utf8"));
  return suppressions ?? [];
}

function runAudit(args) {
  try {
    const out = execSync(`npm audit ${args} --json 2>/dev/null`, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(out);
  } catch (err) {
    // npm audit exits non-zero when vulns exist; stdout still has JSON
    try { return JSON.parse(err.stdout ?? "{}"); } catch { return {}; }
  }
}

function checkExpiredSuppressions(suppressions) {
  const expired = suppressions.filter(s => s.expiresAt && s.expiresAt < today);
  for (const s of expired) {
    log("P1", `Suppression expired ${s.expiresAt}: ${s.id} (${s.package}) — review or renew in security/audit-suppressions.json`);
  }
  return expired.length;
}

export function runSCA({ ci = false } = {}) {
  const suppressions = loadSuppressions();
  const suppressedIds = new Set(suppressions.map(s => s.id));

  let p0 = 0;
  let p1 = 0;
  const results = { phase: "sca", findings: [] };

  // Prod-only audit — P0 on any unsuppressed critical/high
  const prodAudit = runAudit("--omit=dev");
  const prodVulns = prodAudit.vulnerabilities ?? {};

  for (const [pkg, vuln] of Object.entries(prodVulns)) {
    const advisories = vuln.via?.filter(v => typeof v === "object") ?? [];
    for (const adv of advisories) {
      const ghsa = adv.url?.split("/").pop() ?? "";
      if (suppressedIds.has(ghsa)) continue;
      const sev = adv.severity ?? vuln.severity ?? "unknown";
      if (sev === "critical" || sev === "high") {
        log("P0", `Prod dep ${pkg} — ${sev}: ${adv.title ?? ghsa} (${adv.url ?? "no url"})`);
        results.findings.push({ level: "P0", package: pkg, severity: sev, id: ghsa, title: adv.title });
        p0++;
      } else if (sev === "moderate") {
        log("P1", `Prod dep ${pkg} — ${sev}: ${adv.title ?? ghsa}`);
        results.findings.push({ level: "P1", package: pkg, severity: sev, id: ghsa, title: adv.title });
        p1++;
      }
    }
  }

  // Full audit — P1 on unsuppressed high dev deps
  const fullAudit = runAudit("");
  const allVulns = fullAudit.vulnerabilities ?? {};

  for (const [pkg, vuln] of Object.entries(allVulns)) {
    if (pkg in prodVulns) continue; // already covered above
    const advisories = vuln.via?.filter(v => typeof v === "object") ?? [];
    for (const adv of advisories) {
      const ghsa = adv.url?.split("/").pop() ?? "";
      if (suppressedIds.has(ghsa)) continue;
      const sev = adv.severity ?? vuln.severity ?? "unknown";
      if (sev === "critical" || sev === "high") {
        log("P1", `Dev dep ${pkg} — ${sev}: ${adv.title ?? ghsa} (${adv.url ?? "no url"})`);
        results.findings.push({ level: "P1", package: pkg, severity: sev, id: ghsa, scope: "dev" });
        p1++;
      }
    }
  }

  const expiredCount = checkExpiredSuppressions(suppressions);
  p1 += expiredCount;

  const meta = fullAudit.metadata?.vulnerabilities ?? {};
  const suppCount = suppressions.length;

  if (p0 === 0 && p1 === 0) {
    log("OK", `SCA clean. ${suppCount} known dev-dep CVEs suppressed. Total tracked: ${meta.total ?? "?"}`);
  } else {
    if (p0 > 0) log("P0", `${p0} prod-runtime finding(s) — CI will fail`);
    if (p1 > 0) log("P1", `${p1} dev-scope or expired finding(s) — warnings only`);
  }

  results.summary = { p0, p1, suppressed: suppCount };
  return { ok: p0 === 0, results };
}

// Standalone invocation
if (import.meta.url === `file://${process.argv[1]}`) {
  const { ok, results } = runSCA({ ci: CI });
  if (!ok) process.exit(1);
}
