#!/usr/bin/env node
/**
 * pilot-onboard.js — CWP-2026-046 (wrangler 4.110 compatible)
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
 */

// Worker dir that owns the LOVE_DB binding (shared love-ledger D1).
const WORKER_DIR = "software/workers/federation-bridge";
const PHOS_URL = "https://phos.p31ca.org";
const DASHBOARD_URL = "https://pilot.p31ca.org";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const showStatus = args.includes("--status");
const onboardDid = args.includes("--onboard") ? args[args.indexOf("--onboard") + 1] : null;

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
  console.log("P31 Pilot Onboarding Tool (CWP-2026-046)\n");

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
