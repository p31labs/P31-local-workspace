/**
 * One-shot: redirect URI reminder → preflight (no live deploy) → wrangler --dry-run.
 * Run from repo: pnpm -C 04_SOFTWARE/p31-google-bridge run verify
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const childEnv = { ...process.env, VERIFY_CHAIN: "1" };

function run(cmd, title) {
  console.log(`\n── ${title} ──\n`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: childEnv });
}

try {
  run("node scripts/print-redirect.mjs", "Redirect URI + quick links (paste into Google Cloud)");
  run("node scripts/preflight.mjs --no-wrangler", "Preflight (config files only)");
  run("npx wrangler deploy --dry-run", "Bundle / deploy dry-run (no push)");
  console.log("\n  OK — `npm run dev` or `npm run deploy` when ready.\n");
} catch (e) {
  process.exit(e.status ?? 1);
}
