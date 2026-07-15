#!/usr/bin/env node
const WORKER_DIR = "software/workers/federation-bridge";
const PHOS_PORTAL = "https://phos.p31ca.org/portal";
const DASHBOARD = "https://pilot.p31ca.org";
const STATE_FILE = ".sent-invites.json";

const args = process.argv.slice(2);
const dryRun = !args.includes("--send");
const force = args.includes("--force");
const PHOS_HOOK = process.env.DISCORD_WEBHOOK_PHOS;
const WILLOW_HOOK = process.env.DISCORD_WEBHOOK_WILLOW;

function shellSql(sql) {
  return `'${sql.replace(/'/g, `'\\''`)}'`;
}
async function run(command) {
  const { execSync } = await import("child_process");
  return execSync(command, { encoding: "utf8", cwd: WORKER_DIR, timeout: 60000 }).trim();
}
async function queryD1(sql) {
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
async function loadState() {
  const { readFileSync } = await import("node:fs");
  try { return new Set(JSON.parse(readFileSync(STATE_FILE, "utf8"))); } catch { return new Set(); }
}
async function saveState(set) {
  const { writeFileSync } = await import("node:fs");
  writeFileSync(STATE_FILE, JSON.stringify([...set], null, 2));
}
function routeTarget(p) {
  try {
    const m = JSON.parse(p.metadata || "{}");
    if (m.discord_target === "willow") return "willow";
  } catch {}
  return "phos";
}
async function postHook(url, text) {
  if (!url) { console.log("    (no webhook set for this route — skipped)"); return false; }
  if (dryRun) { console.log(`    [dry-run] POST discord (${text.length} chars)`); return true; }
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: text }) });
  return r.ok;
}
async function main() {
  console.log(dryRun ? "send-invites (DRY-RUN — use --send to post)\n" : "send-invites (SEND mode)\n");
  if (!PHOS_HOOK && !WILLOW_HOOK) {
    console.log("! No Discord webhooks in env (DISCORD_WEBHOOK_PHOS / _WILLOW). Set them to actually send.\n");
  }
  const pilots = await queryD1(
    "SELECT did, family_name, status, metadata FROM pilot_registry WHERE status = 'active' ORDER BY did"
  );
  const sent = await loadState();
  let posted = 0;
  for (const p of pilots) {
    const did = p.did;
    if (/^(ztest|system:|test:)/i.test(did)) {
      console.log(`• ${p.family_name || did} [test/seed DID] skip`);
      continue;
    }
    const name = p.family_name || "Unknown";
    const target = routeTarget(p);
    const link = `${PHOS_PORTAL}/?did=${encodeURIComponent(did)}`;
    const text =
      `📋 **P31 Pilot Onboarding — ${name}**\n` +
      `Onboard here: ${link}\n` +
      `Dashboard: ${DASHBOARD}\n` +
      `\`\`\`\nDID: ${did}\n\`\`\``;
    console.log(`• ${name} [${target}] ${dryRun ? "(dry)" : "->"} ${link}`);
    if (!force && sent.has(did)) { console.log("    already sent — skip"); continue; }
    const hook = target === "willow" ? WILLOW_HOOK : PHOS_HOOK;
    const ok = await postHook(hook, text);
    if (ok && !dryRun) { sent.add(did); posted++; }
  }
  if (!dryRun) await saveState(sent);
  console.log(`\nDone. posted=${posted} total=${pilots.length}`);
}
main().catch((e) => { console.error("Error:", e.message); process.exit(1); });
