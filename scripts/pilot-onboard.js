#!/usr/bin/env node
/**
 * pilot-onboard.js — CWP-2026-030 Phase 6
 * Automated pilot family onboarding for the P31 care mesh.
 *
 * Reads pilot_registry from the shared D1, generates onboarding links,
 * and optionally marks pilots as onboarded.
 *
 * Usage:
 *   node scripts/pilot-onboard.js [--dry-run] [--status] [--onboard <did>]
 */

const D1_ID = "592e3e2e-3203-4e0a-8342-9e85215ec8a6";
const PHOS_URL = "https://phos.p31ca.org";
const DASHBOARD_URL = "https://pilot.p31ca.org";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const showStatus = args.includes("--status");
const onboardDid = args.includes("--onboard") ? args[args.indexOf("--onboard") + 1] : null;

async function run(command) {
  const { execSync } = await import("child_process");
  return execSync(command, { encoding: "utf-8", timeout: 30000 }).trim();
}

async function queryD1(sql) {
  const cmd = `npx wrangler d1 execute love-ledger --database-id ${D1_ID} --remote --command "${sql.replace(/"/g, '\\"')}"`;
  const output = await run(cmd);
  // Parse JSON output
  const lines = output.split("\n");
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.results) return parsed.results;
    } catch {}
  }
  return [];
}

async function main() {
  console.log("P31 Pilot Onboarding Tool (CWP-2026-030 Phase 6)\n");

  if (showStatus) {
    const pilots = await queryD1(
      "SELECT did, family_name, status, onboarded_at FROM pilot_registry ORDER BY registered_at DESC"
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

  // Default: show onboarding links for pending pilots
  const pilots = await queryD1(
    "SELECT did, family_name, status FROM pilot_registry WHERE status != 'onboarded' ORDER BY registered_at"
  );

  if (pilots.length === 0) {
    console.log("All pilots are already onboarded! 🎉");
    return;
  }

  console.log(`Found ${pilots.length} pilots pending onboarding:\n`);
  for (const p of pilots) {
    const onboardUrl = `${PHOS_URL}?did=${encodeURIComponent(p.did)}`;
    const dashboardUrl = `${DASHBOARD_URL}`;
    console.log(`  📋 ${p.family_name || "Unknown"}`);
    console.log(`     DID: ${p.did}`);
    console.log(`     Onboarding link: ${onboardUrl}`);
    console.log(`     Dashboard: ${dashboardUrl}`);
    console.log();
  }

  console.log("To onboard a pilot, run:");
  console.log("  node scripts/pilot-onboard.js --onboard <did>");
  console.log("\nUse --dry-run to preview without making changes.");
}

main().catch((e) => {
  console.error("Error:", e.message);
  process.exit(1);
});
