#!/usr/bin/env node
/**
 * One command: open/update PR + auto-merge (merge commit).
 *   pnpm pr
 * Defaults: --base main, --title = last commit subject. Add flags after --.
 *   pnpm pr -- --body "note" --base master
 * Help: pnpm pr -- -h
 */
import { existsSync } from "node:fs";
import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const child = path.join(__dirname, "gh-pr-automerge.mjs");
const extra = process.argv.slice(2).filter((x) => x !== "--");

function hasValue(flag) {
  const i = extra.indexOf(flag);
  return i >= 0 && extra[i + 1] && !String(extra[i + 1]).startsWith("-");
}
if (extra[0] === "-h" || extra[0] === "--help") {
  console.log(`P31 — less friction
  pnpm pr
    → same as: push + PR to main + auto-merge, title = last commit

  pnpm pr -- --body "…" --base master
    → pass through to the full automerge script

  pnpm run fix:gh
    → run gh auth setup-git (fix bad credential.helper / "gitci" typo noise)

  pnpm run prepush:check
    → only scrub the "gitci" typo before a manual "git push" (avoids gh auth noise)
`);
  process.exit(0);
}

if (!existsSync(path.join(root, ".git"))) {
  console.error("pr: not a git repository at", root);
  process.exit(1);
}

const argv = [child];
if (!hasValue("--base")) {
  argv.push("--base", "main");
}
if (!hasValue("--title")) {
  const t = execSync("git log -1 --pretty=%s", { cwd: root, encoding: "utf8" }).trim() || "chore: ship";
  argv.push("--title", t);
}
argv.push(...extra);

execFileSync(process.execPath, argv, { stdio: "inherit", cwd: root });
