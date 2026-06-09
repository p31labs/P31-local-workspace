#!/usr/bin/env node
/**
 * Andromeda: point this repo at .githooks/ (pre-commit: MAP monetary surface; post-commit: opt-in auto-push).
 * No-op if not a git work tree. chmod +x for hooks on *nix.
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const hooksDir = path.join(root, ".githooks");

if (!fs.existsSync(hooksDir)) {
  console.log("git-hooks-config: no .githooks/ — skip");
  process.exit(0);
}

const hasHook = fs.readdirSync(hooksDir).some((n) => !n.startsWith(".") && fs.statSync(path.join(hooksDir, n)).isFile());
if (!hasHook) {
  console.log("git-hooks-config: .githooks/ empty — skip");
  process.exit(0);
}

try {
  execSync("git rev-parse --is-inside-work-tree", { cwd: root, stdio: "pipe" });
} catch {
  console.log("git-hooks-config: not a git work tree — skip");
  process.exit(0);
}

try {
  execSync("git config core.hooksPath .githooks", { cwd: root, stdio: "inherit" });
} catch (e) {
  console.error("git-hooks-config: failed to set core.hooksPath", e);
  process.exit(1);
}

try {
  for (const name of fs.readdirSync(hooksDir)) {
    const p = path.join(hooksDir, name);
    if (fs.statSync(p).isFile() && !name.startsWith(".")) {
      try {
        fs.chmodSync(p, 0o755);
      } catch {
        /* */
      }
    }
  }
} catch {
  /* */
}

console.log(
  "git-hooks-config: core.hooksPath = .githooks\n" +
    "  pre-commit: verify:monetary (MAP) when donate/creator-economy paths staged (P31_SKIP_MONETARY_HOOK=1 to bypass)\n" +
    "  post-commit: auto-push when P31_AUTO_PUSH=1 or .p31/auto-push (npm run git:autopush:on) — P31_NO_AUTO_PUSH=1 off"
);
process.exit(0);
