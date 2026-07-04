#!/usr/bin/env node
/**
 * Fails if ground-truth/p31.ground-truth.json does not match public/_redirects,
 * registry invariants, Three.js version pins, and optional fileSnippets. Run:
 * npm run verify:ground-truth
 * (and via prebuild from this package).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");

const gtPath = path.join(p31ca, "ground-truth", "p31.ground-truth.json");
if (!fs.existsSync(gtPath)) {
  console.error("verify-ground-truth: missing", gtPath);
  process.exit(1);
}

const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
let failed = 0;
function err(msg) {
  console.error("verify-ground-truth:", msg);
  failed = 1;
}

const redirectsPath = path.join(p31ca, "public", "_redirects");
if (!fs.existsSync(redirectsPath)) {
  err("missing public/_redirects");
} else {
  const text = fs.readFileSync(redirectsPath, "utf8");
  const parsed = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      const code = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(code)) {
        const to = parts[parts.length - 2];
        const from = parts.slice(0, -2).join(" ");
        parsed.push({ from, to, status: code });
      }
    }
  }
  const expected = gt.edgeRedirects || [];
  for (const e of expected) {
    const found = parsed.some(
      (p) => p.from === e.from && p.to === e.to && p.status === e.status
    );
    if (!found) {
      err(
        `redirect contract missing: ${e.from} -> ${e.to} ${e.status} (see ground-truth and _redirects)`
      );
    }
  }
  for (const p of parsed) {
    const ok = expected.some(
      (e) => e.from === p.from && e.to === p.to && e.status === p.status
    );
    if (!ok) {
      err(
        `unexpected _redirects rule (add to ground-truth or remove): ${p.from} -> ${p.to} ${p.status}`
      );
    }
  }
}

const regPath = path.join(p31ca, "scripts", "hub", "registry.mjs");
if (!fs.existsSync(regPath)) {
  err("missing scripts/hub/registry.mjs");
} else {
  const { registry } = await import(pathToFileURL(regPath).href);
  for (const inv of gt.registryAppUrlInvariants || []) {
    const item = registry.find((r) => r.id === inv.id);
    if (!item) {
      err(`registry has no id '${inv.id}' (invariant)`);
    } else if (item.appUrl !== inv.appUrl) {
      err(
        `registry appUrl for '${inv.id}': got '${item.appUrl}', ground-truth expects '${inv.appUrl}'`
      );
    }
  }
}

for (const [key, spec] of Object.entries(gt.threejs || {})) {
  if (!spec.path || !spec.mustIncludeSubstring) continue;
  const fp = path.join(p31ca, spec.path);
  if (!fs.existsSync(fp)) {
    err(`threejs pin: missing file ${spec.path} (${key})`);
    continue;
  }
  const body = fs.readFileSync(fp, "utf8");
  if (!body.includes(spec.mustIncludeSubstring)) {
    err(
      `threejs pin: ${key} (${spec.path}) must include '${spec.mustIncludeSubstring}' — update file or ground-truth`
    );
  }
}

for (const spec of gt.fileSnippets || []) {
  if (!spec.path || !spec.mustIncludeSubstring) continue;
  const fp = path.join(p31ca, spec.path);
  const id = spec.id || spec.path;
  if (!fs.existsSync(fp)) {
    err(`fileSnippets: missing file ${spec.path} (${id})`);
    continue;
  }
  const body = fs.readFileSync(fp, "utf8");
  if (!body.includes(spec.mustIncludeSubstring)) {
    err(
      `fileSnippets (${id}): ${spec.path} must include '${spec.mustIncludeSubstring}'`
    );
  }
}

if (!failed) {
  console.log("verify-ground-truth: OK");
}
process.exit(failed);
