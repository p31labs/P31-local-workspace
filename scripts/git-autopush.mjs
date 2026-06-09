#!/usr/bin/env node
/**
 * Andromeda: local opt-in for .githooks/post-commit auto-push (marker file, gitignored).
 *   npm run git:autopush:on  |  off  |  status
 * Or: export P31_AUTO_PUSH=1
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const p31 = path.join(root, ".p31");
const marker = path.join(p31, "auto-push");

const cmd = process.argv[2] || "status";

if (cmd === "on") {
  fs.mkdirSync(p31, { recursive: true });
  fs.writeFileSync(
    marker,
    "# P31: presence enables post-commit git push. Remove or run: npm run git:autopush:off\n",
    "utf8"
  );
  console.log("git-autopush: ON  (.p31/auto-push created — use npm run git:autopush:off to disable)");
  process.exit(0);
}

if (cmd === "off") {
  try {
    fs.unlinkSync(marker);
  } catch {
    /* */
  }
  console.log("git-autopush: OFF  (removed .p31/auto-push if present)");
  process.exit(0);
}

if (cmd === "status" || cmd === "-h" || cmd === "--help") {
  const env = process.env.P31_AUTO_PUSH === "1";
  const file = fs.existsSync(marker);
  console.log(
    "P31 post-commit auto-push: " +
      (env || file ? "enabled" : "off") +
      (env ? " (P31_AUTO_PUSH=1)" : "") +
      (file ? " (.p31/auto-push)" : "")
  );
  if (!env && !file) {
    console.log("  Enable:  npm run git:autopush:on   or   export P31_AUTO_PUSH=1");
  }
  process.exit(0);
}

console.error("Usage: npm run git:autopush:on | git:autopush:off | git:autopush:status");
process.exit(1);
