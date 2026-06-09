#!/usr/bin/env node
/**
 * One-shot: fix “gitci” typo in helper lines + `gh auth setup-git`
 *   pnpm run fix:gh
 */
import { execSync } from "node:child_process";
import { badCredentialHelperConfigured, ensureCleanCredential } from "./git-scrub-bad-gh-credential.mjs";
try {
  const hadGitciTypo = badCredentialHelperConfigured();
  ensureCleanCredential();
  if (!hadGitciTypo) {
    execSync("gh auth setup-git", { stdio: "inherit" });
  }
  console.log("fix:gh: done — if issues persist, see: https://cli.github.com/manual/gh_auth_setup-git");
} catch (e) {
  process.exit(e?.status ?? 1);
}
