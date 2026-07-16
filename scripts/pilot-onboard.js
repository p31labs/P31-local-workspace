#!/usr/bin/env node
/**
 * pilot-onboard.js — CWP-2026-046/058 (wrangler 4.110 compatible)
 * Pilot family onboarding for the P31 care mesh.
 *
 * Reads pilot_registry from the shared love-ledger D1, prints onboarding
 * links, and (--onboard <did>) marks a pilot as onboarded via a real D1 write.
 *
 * NOTE: Sending invitations is manual outreach — there is no --send mode.
 * The script only reads/prints and (optionally) flips a status column.
 *
 * Usage:
 *   node scripts/pilot-onboard.js [--status]
 *   node scripts/pilot-onboard.js [--onboard <did>] [--dry-run]
 *   node scripts/pilot-onboard.js [--export-links]
 *   node scripts/pilot-onboard.js [--export-csv]
 *   node scripts/pilot-onboard.js [--template]
 *   node scripts/pilot-onboard.js [--summary]
 */

import { writeFileSync, mkdirSync } from "fs";

// Worker dir that owns the LOVE_DB binding (shared love-ledger D1).
const WORKER_DIR = "software/workers/federation-bridge";
const PHOS_URL = "https://phos.p31ca.org";
const PORTAL_URL = "https://phos.p31ca.org/portal";
const DASHBOARD_URL = "https://pilot.p31ca.org";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const showStatus = args.includes("--status");
const onboardDid = args.includes("--onboard") ? args[args.indexOf("--onboard") + 1] : null;
const exportLinks = args.includes("--export-links");
const exportCsv = args.includes("--export-csv");
const showTemplate = args.includes("--template");
const showSummary = args.includes("--summary");

// Shell-escape a SQL string into a single-quoted argument.
function shellSql(sql) {
  return `'${sql.replace(/'/g, `'\\''`)}'`;
}

async function run(command) {
  const { execSync } = await import("child_process");
  return execSync(command, { encoding: "utf-8", cwd: WORKER_DIR, timeout: 30000 }).trim();
}

async function queryD1(sql) {
  // wrangler 4.110 rejects --database-id; use the binding form from a worker dir.
  // wrangler 4.110 pretty-prints JSON across multiple lines, so parse the whole
  // output block (from first '[' to last ']') rather than line-by-line.
  const cmd = `npx wrangler d1 execute LOVE_DB --remote --command ${shellSql(sql)}`;
  const output = await run(cmd);
  const cleaned = output.replace(/\x1b\[[0-9;]*m/g, "");
  const start = cleaned.indexOf("[");
  const end = cleaned.lastIndexOf("]");
  if (start === -1 || end === -1) return [];
  try {
    const arr = JSON.parse(cleaned.slice(start, end + 1));
    for (const item of arr) {
      if (item && Array.isArray(item.results)) return item.results;
    }
  } catch {}
  return [];
}

async function main() {
  console.log("P31 Pilot Onboarding Tool (CWP-2026-058)\n");

  if (showSummary) {
    const all = await queryD1(
      "SELECT did, family_name, status, onboarded_at FROM pilot_registry ORDER BY did"
    );
    const byStatus = {};
    for (const p of all) {
      const s = p.status || "pending";
      byStatus[s] = (byStatus[s] || 0) + 1;
    }
    console.log("P31 Pilot Summary");
    console.log("─".repeat(40));
    console.log(`  Total pilots:   ${all.length}`);
    for (const [s, n] of Object.entries(byStatus)) {
      const icon = s === "onboarded" ? "✅" : s === "invited" ? "📧" : "⏳";
      console.log(`  ${icon} ${s}: ${n}`);
    }
    console.log("─".repeat(40));
    console.log(`  Portal URL:     ${PORTAL_URL}`);
    console.log(`  Dashboard URL:  ${DASHBOARD_URL}`);
    return;
  }

  if (showTemplate) {
    const pilots = await queryD1(
      "SELECT did, family_name, status FROM pilot_registry WHERE status != 'onboarded' ORDER BY did"
    );
    if (pilots.length === 0) {
      console.log("All pilots are already onboarded.");
      return;
    }
    console.log("═".repeat(60));
    console.log("PILOT OUTREACH EMAIL TEMPLATE");
    console.log("═".repeat(60));
    for (const p of pilots) {
      const onboardUrl = `${PORTAL_URL}/?did=${encodeURIComponent(p.did)}`;
      console.log(`
Subject: Your family's sovereign care identity is ready

Dear ${p.family_name || "Family"},

P31 Labs has selected your family as one of 18 pilot families to test our
sovereign, post-quantum-secure care attestation system.

Your onboarding link:
  ${onboardUrl}

Steps:
  1. Open the link above in Chrome or Firefox
  2. Create your DID (decentralised identifier)
  3. Generate post-quantum keys (ML-DSA-65)
  4. Register your DID on Base Sepolia (testnet — no real money)
  5. Submit your first care proof
  6. Mint your Care SBT

Support: Reply to this email or join our Discord.

— The P31 Team
  https://p31ca.org
`.trim());
      console.log("\n" + "─".repeat(60) + "\n");
    }
    return;
  }

  if (exportLinks) {
    const pilots = await queryD1(
      "SELECT did, family_name, status FROM pilot_registry ORDER BY did"
    );
    try { mkdirSync("out", { recursive: true }); } catch {}
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `out/pilot-links-${ts}.txt`;
    const lines = pilots.map(p => {
      const url = `${PORTAL_URL}/?did=${encodeURIComponent(p.did)}`;
      return `${p.family_name || "Unknown"}\t${p.did}\t${p.status || "pending"}\t${url}`;
    });
    writeFileSync(filename, ["name\tdid\tstatus\tonboard-url", ...lines].join("\n"));
    console.log(`Exported ${pilots.length} pilot onboarding links to ${filename}`);
    return;
  }

  if (exportCsv) {
    const pilots = await queryD1(
      "SELECT did, family_name, status, onboarded_at FROM pilot_registry ORDER BY did"
    );
    try { mkdirSync("out", { recursive: true }); } catch {}
    const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `out/pilot-status-${ts}.csv`;
    const rows = pilots.map(p => {
      const url = `${PORTAL_URL}/?did=${encodeURIComponent(p.did)}`;
      return `"${p.family_name || ""}","${p.did || ""}","${p.status || "pending"}","${p.onboarded_at || ""}","${url}"`;
    });
    writeFileSync(filename, ["Family Name,DID,Status,Onboarded At,Onboarding URL", ...rows].join("\n"));
    console.log(`Exported pilot status CSV to ${filename}`);
    return;
  }

  if (showStatus) {
    const pilots = await queryD1(
      "SELECT did, family_name, status, onboarded_at FROM pilot_registry ORDER BY did"
    );
    console.log(`Found ${pilots.length} pilots:\n`);
    for (const p of pilots) {
      const status = p.status || "pending";
      const icon = status === "onboarded" ? "✅" : status === "invited" ? "📧" : "⏳";
      console.log(`  ${icon} ${p.family_name || "Unknown"} (${p.did?.slice(0, 20)}...) [${status}]`);
    }
    return;
  }

  if (onboardDid) {
    if (dryRun) {
      console.log(`[DRY RUN] Would mark ${onboardDid} as onboarded`);
      return;
    }
    await queryD1(
      `UPDATE pilot_registry SET status = 'onboarded', onboarded_at = ${Date.now()} WHERE did = '${onboardDid}'`
    );
    console.log(`✅ Marked ${onboardDid} as onboarded`);
    return;
  }

  // Default: show onboarding links for pending pilots.
  const pilots = await queryD1(
      "SELECT did, family_name, status FROM pilot_registry WHERE status != 'onboarded' ORDER BY did"
  );

  if (pilots.length === 0) {
    console.log("All pilots are already onboarded! 🎉");
    return;
  }

  console.log(`Found ${pilots.length} pilots pending onboarding:\n`);
  for (const p of pilots) {
    const onboardUrl = `${PHOS_URL}?did=${encodeURIComponent(p.did)}`;
    console.log(`  📋 ${p.family_name || "Unknown"}`);
    console.log(`     DID: ${p.did}`);
    console.log(`     Onboarding link: ${onboardUrl}`);
    console.log(`     Dashboard: ${DASHBOARD_URL}`);
    console.log();
  }

  console.log("To mark a pilot onboarded (real D1 write), run:");
  console.log("  node scripts/pilot-onboard.js --onboard <did>");
  console.log("\nSending invitations is manual outreach — this tool does not send email.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
