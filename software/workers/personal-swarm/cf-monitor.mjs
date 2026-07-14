#!/usr/bin/env node
/**
 * cf-monitor — auto-diagnostic layer for P31 Cloudflare Workers.
 *
 * Streams `wrangler tail --format json` for a worker, fingerprints every
 * exception/error-level log, and opens a GitHub issue per NEW error signature
 * (deduped across restarts via a state file). This closes the loop between
 * production telemetry and swarm remediation (CWP-2026-041 §1).
 *
 * Usage:
 *   WORKER_NAME=personal-swarm GH_REPO=p31labs/P31-local-workspace \
 *     node cf-monitor.mjs
 *
 * Requirements:
 *   - `wrangler` on PATH (or via npx) with deploy creds.
 *   - `gh` CLI authenticated (uses GH_TOKEN / gh auth). Issues are created
 *     with the `cf-monitor` + `bug` labels.
 *
 * Env:
 *   WORKER_NAME   worker to tail (default: personal-swarm)
 *   GH_REPO       owner/repo for issues (default: p31labs/P31-local-workspace)
 *   MIN_ISSUE_GAP seconds between any two issue creations (default: 300)
 *   STATE_FILE    fingerprint store (default: .cf-monitor-state.json)
 */

import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";

const WORKER_NAME = process.env.WORKER_NAME || "personal-swarm";
const GH_REPO = process.env.GH_REPO || "p31labs/P31-local-workspace";
const MIN_ISSUE_GAP = Number(process.env.MIN_ISSUE_GAP || "300");
const STATE_FILE = process.env.STATE_FILE || ".cf-monitor-state.json";
const LABELS = ["cf-monitor", "bug"];

function loadState() {
  try {
    return new Set(JSON.parse(readFileSync(STATE_FILE, "utf8")));
  } catch {
    return new Set();
  }
}
function saveState(set) {
  writeFileSync(STATE_FILE, JSON.stringify([...set], null, 2));
}

function fingerprint(msg) {
  // Normalize volatile parts (ids, timestamps, URLs) so the same bug collapses.
  const norm = msg
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<uuid>")
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/g, "<ts>")
    .replace(/https?:\/\/\S+/g, "<url>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
  let h = 0;
  for (let i = 0; i < norm.length; i++) h = (h * 31 + norm.charCodeAt(i)) >>> 0;
  return `${h.toString(16)}:${norm}`;
}

function extractErrors(ev) {
  const out = [];
  if (Array.isArray(ev.exceptions)) {
    for (const e of ev.exceptions) {
      if (e.message) out.push(e.message.join("\n"));
    }
  }
  for (const l of ev.logs || []) {
    if (l.level === "error" && Array.isArray(l.message)) {
      out.push(l.message.join("\n"));
    }
  }
  return out;
}

async function openIssue(fp, message, raw) {
  const title = `cf-monitor: ${fp.split(":")[1].slice(0, 90)}`;
  const body =
    `Auto-filed by cf-monitor from \`wrangler tail\` on worker \`${WORKER_NAME}\`.\n\n` +
    `**Fingerprint:** \`${fp}\`\n\n` +
    `**Message:**\n\`\`\`\n${message.slice(0, 4000)}\n\`\`\`\n\n` +
    `<details><summary>raw event</summary>\n\n\`\`\`json\n${raw.slice(0, 4000)}\n\`\`\`\n</details>`;
  const args = [
    "issue", "create",
    "--repo", GH_REPO,
    "--title", title,
    "--body", body,
    "--label", LABELS.join(","),
  ];
  const p = spawn("gh", args, { stdio: ["ignore", "pipe", "pipe"] });
  let out = "";
  p.stdout.on("data", (d) => (out += d));
  p.stderr.on("data", (d) => process.stderr.write(d));
  await new Promise((res) => p.on("close", res));
  return out.trim();
}

async function main() {
  const seen = loadState();
  let lastIssue = 0;

  const tail = spawn("npx", ["wrangler", "tail", "--format", "json", WORKER_NAME], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  console.log(`[cf-monitor] tailing ${WORKER_NAME} -> issues in ${GH_REPO}`);

  let buf = "";
  tail.stdout.on("data", (d) => {
    buf += d;
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        continue;
      }
      const errors = extractErrors(ev);
      if (!errors.length) continue;
      for (const msg of errors) {
        const fp = fingerprint(msg);
        if (seen.has(fp)) continue;
        seen.add(fp);
        const now = Date.now();
        if (now - lastIssue < MIN_ISSUE_GAP * 1000) {
          console.log(`[cf-monitor] (throttled) new error: ${fp}`);
          continue;
        }
        lastIssue = now;
        openIssue(fp, msg, line)
          .then((url) => {
            console.log(`[cf-monitor] issue created: ${url || "(none)"} for ${fp}`);
            saveState(seen);
          })
          .catch((e) => console.error(`[cf-monitor] gh error:`, e.message));
        saveState(seen);
      }
    }
  });
  tail.stderr.on("data", (d) => process.stderr.write(`[wrangler] ${d}`));
  tail.on("close", (code) => {
    console.log(`[cf-monitor] tail exited (${code})`);
    saveState(seen);
    process.exit(code ?? 0);
  });
}

main();
