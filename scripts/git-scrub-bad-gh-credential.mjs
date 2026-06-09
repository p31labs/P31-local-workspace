#!/usr/bin/env node
/**
 * If git config still references the typo "gitci" (instead of git-credential), remove
 * [credential] blocks that gh auth setup-git can recreate. Safe to no-op if clean.
 * Opt out: P31_NO_CRED_SCRUB=1
 */
import { execFileSync, execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

function list() {
  try {
    return execSync("git config --list", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return "";
  }
}

export function badCredentialHelperConfigured() {
  if (/\bgitci\b|auth\s+gitci/i.test(list())) {
    return true;
  }
  for (const f of gitconfigCandidateFiles()) {
    if (existsSync(f) && /\bgitci\b|auth\s+gitci/i.test(readFileSync(f, "utf8"))) {
      return true;
    }
  }
  return false;
}

function removeSection(scope, cwd) {
  const args = ["config", "--remove-section", "credential"];
  if (scope === "global") {
    args.splice(1, 0, "--global");
  } else if (scope === "system") {
    args.splice(1, 0, "--system");
  } else {
    args.splice(1, 0, "--local");
  }
  try {
    execFileSync("git", args, { cwd: cwd || undefined, stdio: "pipe" });
  } catch {
    /* no section or denied */
  }
}

/**
 * @param {{ cwd?: string }} [o]
 */
export function ensureCleanCredential({ cwd } = {}) {
  if (process.env.P31_NO_CRED_SCRUB === "1" || !badCredentialHelperConfigured()) {
    return;
  }
  console.warn(
    "P31: git credential config references “gitci” (typo) — cleaning config + re-running gh auth setup-git.\n" +
      "  (set P31_NO_CRED_SCRUB=1 to skip)\n"
  );
  stripGitciLinesFromFiles();
  removeSection("global");
  removeSection("local", cwd || process.cwd());
  removeSection("system");
  try {
    execSync("gh auth setup-git", { stdio: "inherit" });
  } catch (e) {
    console.error(
      "P31: gh auth setup-git failed — run manually:  git config --list --show-origin | grep -i cred\n" +
        "  https://cli.github.com/manual/gh_auth_setup-git"
    );
    throw e;
  }
  if (badCredentialHelperConfigured()) {
    stripGitciLinesFromFiles();
    try {
      execSync("gh auth setup-git", { stdio: "inherit" });
    } catch {
      /* ignore */
    }
  }
  if (badCredentialHelperConfigured()) {
    console.error(
      "P31: “gitci” still present — run:  git config --list --show-origin | grep -iE 'cred|gitci'  and remove the bad line(s)"
    );
  }
}

function gitconfigCandidateFiles() {
  return [path.join(homedir(), ".gitconfig"), path.join(homedir(), ".config", "git", "config")];
}

function stripGitciLinesFromFiles() {
  for (const f of gitconfigCandidateFiles()) {
    if (!existsSync(f)) {
      continue;
    }
    const raw = readFileSync(f, "utf8");
    if (!/\bgitci\b|auth\s+gitci/i.test(raw)) {
      continue;
    }
    const next = raw
      .split("\n")
      .filter((line) => !/\bgitci\b|auth\s+gitci/i.test(line))
      .join("\n");
    writeFileSync(f, next, "utf8");
    console.warn("P31: removed line(s) containing gitci from " + f);
  }
}

const isMain = path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] ?? "");
if (isMain) {
  try {
    ensureCleanCredential();
    process.exit(0);
  } catch (e) {
    process.exit(e?.status ?? 1);
  }
}
