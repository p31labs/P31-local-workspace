#!/usr/bin/env node
/**
 * Local automation: validate wrangler.toml + .dev.vars before deploy.
 * Run: node scripts/preflight.mjs
 *   or npm run preflight
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const issues = [];
const ok = (msg) => console.log("  \x1b[32m✓\x1b[0m", msg);
const warn = (msg) => {
  console.log("  \x1b[33m!\x1b[0m", msg);
  issues.push(msg);
};

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

function parseVarBlock(toml, key) {
  const m = toml.match(new RegExp(`^${key}\\s*=\\s*"([^"]*)"`, "m"));
  return m ? m[1] : (toml.match(new RegExp(`^${key}\\s*=\\s*'([^']*)'`, "m")) || [])[1] || null;
}

function main() {
  const tomlPath = path.join(ROOT, "wrangler.toml");
  const toml = readFileSafe(tomlPath);
  if (!toml) {
    console.error("Missing wrangler.toml");
    process.exit(1);
  }

  const redirect = parseVarBlock(toml, "REDIRECT_URL");
  const clientId = parseVarBlock(toml, "GOOGLE_CLIENT_ID");
  const kvId = toml.match(/id\s*=\s*"([a-f0-9]+)"/i);
  const devVars = readFileSafe(path.join(ROOT, ".dev.vars"));
  const hasSecretInDev = devVars && /GOOGLE_CLIENT_SECRET\s*=/i.test(devVars);

  console.log("\n  \x1b[1mP31 Google Bridge — preflight\x1b[0m\n");

  if (clientId && !/^replace-me$/i.test(clientId) && clientId.length > 20) {
    ok(`GOOGLE_CLIENT_ID is set (length ${clientId.length})`);
  } else {
    warn("Set GOOGLE_CLIENT_ID in wrangler.toml (not replace-me) or Cloudflare env.");
  }

  if (hasSecretInDev) {
    ok(".dev.vars contains GOOGLE_CLIENT_SECRET (local dev only)");
  } else {
    warn("Add .dev.vars with GOOGLE_CLIENT_SECRET for `wrangler dev` (or use wrangler secret only in prod).");
  }

  if (kvId && !/^a1b2c3d4e5f6789012345678abcdef01$/i.test(kvId[1])) {
    ok(`KV namespace id is customized (${kvId[1].slice(0, 8)}…)`);
  } else {
    warn("Replace placeholder KV id in wrangler.toml with: npx wrangler kv namespace create GOOGLE_OAUTH");
  }

  if (redirect) {
    ok(`REDIRECT_URL — paste into Google Console ↓\n      ${redirect}`);
  }

  const dry = process.env.CF_DRY_RUN || process.argv.includes("--no-wrangler");
  if (dry) {
    if (process.env.VERIFY_CHAIN !== "1") {
      console.log("\n  (Skipping wrangler dry-run — run `npm run verify` or full `npm run preflight` without --no-wrangler)\n");
    }
  } else {
    try {
      execSync("npx wrangler deploy --dry-run", { cwd: ROOT, stdio: "inherit" });
      ok("wrangler deploy --dry-run");
    } catch {
      warn("wrangler dry-run failed (auth or config)");
      issues.push("wrangler");
    }
  }

  if (issues.length) {
    console.log("\n  \x1b[33mAddress warnings, then: npm run deploy\x1b[0m\n");
    process.exit(issues.length > 0 && process.argv.includes("--strict") ? 1 : 0);
  } else {
    console.log("\n  \x1b[32mReady to deploy (or: wrangler dev)\x1b[0m\n");
  }
}

main();
