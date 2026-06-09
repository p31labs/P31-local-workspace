#!/usr/bin/env node
/**
 * Andromeda monorepo: push → open PR if needed → enable auto-merge.
 *   pnpm run gh:pr:automerge -- --base main --title "…" [--body "…"]
 * On **main** / **master**: auto-creates **pr/&lt;slug&gt;-&lt;shortsha&gt;** unless **P31_PR_NO_AUTO_BRANCH=1**
 * (align with bonding-soup scripts/gh-pr-automerge.mjs).
 * pnpm may pass a literal "--" — we strip it.
 * Dry run: P31_DRY_RUN=1 pnpm run gh:pr:automerge -- …
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensureCleanCredential } from "./git-scrub-bad-gh-credential.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRoot = path.join(__dirname, "..");

const argv = process.argv.slice(2).filter((x) => x !== "--");
const dry = process.env.P31_DRY_RUN === "1";
let base = "main";
let title = "";
let body = "";
let workdir = defaultRoot;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--base" && argv[i + 1]) {
    base = argv[++i];
  } else if (a === "--title" && argv[i + 1]) {
    title = argv[++i];
  } else if (a === "--body" && argv[i + 1]) {
    body = argv[++i];
  } else if (a === "--dir" && argv[i + 1]) {
    workdir = path.resolve(defaultRoot, argv[++i]);
  } else if (a === "--help" || a === "-h") {
    console.log(
      "Usage: pnpm run gh:pr:automerge -- --base main --title '…' [--body '…'] [--dir <path-from-root>]\n" +
        "  On main/master: auto-creates pr/<slug>-<shortsha> unless P31_PR_NO_AUTO_BRANCH=1\n" +
        "  P31_DRY_RUN=1  print steps only (no branch checkout, no push)"
    );
    process.exit(0);
  }
}

function ghAuthed() {
  try {
    execSync("gh api user --jq .login", { stdio: "pipe", encoding: "utf8" });
    return true;
  } catch {
    return false;
  }
}

function prNumberIfExists(cwd) {
  try {
    return execSync("gh pr view --json number -q .number", {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function getRemoteUrl(cwd, name) {
  try {
    return execSync(`git remote get-url ${name}`, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

function sh(cmd) {
  if (dry) {
    console.log(`[DRY] cd ${workdir} && ${cmd}`);
    return;
  }
  execSync(cmd, { cwd: workdir, stdio: "inherit" });
}

function slugify(s) {
  return (
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "wip"
  );
}

function suggestAutoBranchName() {
  const subj =
    execSync("git log -1 --pretty=%s", { cwd: workdir, encoding: "utf8" }).trim() || "wip";
  const short = execSync("git rev-parse --short HEAD", {
    cwd: workdir,
    encoding: "utf8",
  }).trim();
  let name = `pr/${slugify(subj)}-${short}`.replace(/\/{2,}/g, "/");
  return name.length > 200 ? name.slice(0, 200) : name;
}

function autoBranchFromMain() {
  let name = suggestAutoBranchName();
  try {
    execSync(`git checkout -b ${name}`, { cwd: workdir, stdio: "inherit" });
    return name;
  } catch {
    const short = execSync("git rev-parse --short HEAD", {
      cwd: workdir,
      encoding: "utf8",
    }).trim();
    const fallback = `pr/auto-${short}-${Date.now().toString(36)}`;
    execSync(`git checkout -b ${fallback}`, { cwd: workdir, stdio: "inherit" });
    return fallback;
  }
}

function run() {
  ensureCleanCredential({ cwd: workdir });

  if (!ghAuthed()) {
    console.error("gh-pr-automerge: not logged in — run: gh auth login");
    process.exit(1);
  }

  let branch = execSync("git rev-parse --abbrev-ref HEAD", {
    cwd: workdir,
    encoding: "utf8",
  }).trim();

  if (branch === "main" || branch === "master") {
    if (process.env.P31_PR_NO_AUTO_BRANCH === "1") {
      console.error(
        "gh-pr-automerge: switch to a feature branch first (on " + branch + ")"
      );
      process.exit(1);
    }
    if (dry) {
      branch = suggestAutoBranchName();
      console.log(`[DRY] gh-pr-automerge: would checkout from main → ${branch}`);
    } else {
      console.log(`gh-pr-automerge: on ${branch} — creating feature branch for PR`);
      branch = autoBranchFromMain();
      console.log(`gh-pr-automerge: now on ${branch}`);
    }
  }

  if (!title) {
    title =
      execSync("git log -1 --pretty=%s", { cwd: workdir, encoding: "utf8" }).trim() ||
      `PR: ${branch}`;
  }
  if (!body) {
    body = "Automated PR (pnpm run gh:pr:automerge).";
  }

  const remote = process.env.P31_GIT_REMOTE || "origin";
  if (!getRemoteUrl(workdir, remote)) {
    console.error(`gh-pr-automerge: no git remote "${remote}" in ${workdir}`);
    console.error("  Fix: configure origin or P31_GIT_REMOTE");
    process.exit(1);
  }

  sh(`git push -u ${remote} ${branch}`);

  if (dry) {
    console.log("[DRY] gh pr view|create; gh pr merge --auto");
    return;
  }

  let num = prNumberIfExists(workdir);
  if (num) {
    console.log(`gh-pr-automerge: found existing PR #${num} — skip create`);
  } else {
    const createOut = execSync(
      `gh pr create --base ${base} --head ${branch} --title ${JSON.stringify(title)} --body ${JSON.stringify(body)}`,
      { cwd: workdir, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }
    );
    if ((createOut + "").trim()) {
      console.log((createOut + "").trim());
    }
    num = prNumberIfExists(workdir) || "";
    if (!num) {
      console.error("gh-pr-automerge: could not get PR number after create");
      process.exit(1);
    }
  }

  execSync(`gh pr merge ${num} --auto --merge`, { cwd: workdir, stdio: "inherit" });
  console.log(`gh-pr-automerge: PR #${num} — auto-merge enabled (merge commit)`);
}

run();
