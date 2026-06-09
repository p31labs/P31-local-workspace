#!/usr/bin/env node
/**
 * Production bundle gate for the Vite SPA mirrored at public/delta-hiring/.
 * Pairs with verify-public-app-shell (registry shell) + ground-truth fileSnippets.
 *
 * Run: npm run verify:delta-hiring
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, "..");

// Check registry status — skip verification if concept/draft
const regPath = path.join(P31CA, "scripts", "hub", "registry.mjs");
const { registry } = await import(pathToFileURL(regPath).href);
const dhEntry = registry.find(r => r.id === 'p31-delta-hiring');
if (dhEntry && (dhEntry.status === 'concept' || dhEntry.status === 'draft')) {
  console.log("[ OK ] verify-delta-hiring: p31-delta-hiring is " + dhEntry.status + " — skipping file check");
  process.exit(0);
}

const DH = path.join(P31CA, "public", "delta-hiring");

let failed = 0;
function die(msg) {
  console.error("verify-delta-hiring:", msg);
  failed++;
}

const idx = path.join(DH, "index.html");
if (!fs.existsSync(idx)) {
  die(
    "missing public/delta-hiring/index.html — build p31-delta-hiring and run: pnpm --filter p31-delta-hiring run sync:p31ca"
  );
} else {
  const html = fs.readFileSync(idx, "utf8");
  if (!html.includes("P31 Delta · Proof-based hiring")) {
    die("index.html missing title anchor (ground-truth p31DeltaHiring.index)");
  }
  if (!/href\s*=\s*["']\/p31-style\.css["']/i.test(html)) {
    die("index.html missing <link href=\"/p31-style.css\"> (hub canon)");
  }

  const refs = [];
  for (const m of html.matchAll(/\s(?:src|href)=["'](\.\/assets\/[^"']+)["']/gi)) {
    refs.push(m[1]);
  }
  if (refs.length === 0) {
    die("index.html has no ./assets/* script or stylesheet references");
  }
  for (const rel of refs) {
    const clean = rel.replace(/^\.\//, "");
    const fp = path.join(DH, clean);
    if (!fs.existsSync(fp)) {
      die(`missing bundled file referenced by index: ${rel}`);
    }
  }

  const assetsDir = path.join(DH, "assets");
  if (!fs.existsSync(assetsDir)) {
    die("missing public/delta-hiring/assets/");
  } else {
    const js = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
    if (js.length === 0) die("no .js chunks under public/delta-hiring/assets/");
  }
}

/** Optional: source package present in monorepo — JSON schemas must stay parseable */
const srcRoot = path.join(P31CA, "..", "p31-delta-hiring");
const rolePackets = path.join(srcRoot, "src", "data", "role-packets.json");
const workSamples = path.join(srcRoot, "src", "data", "work-samples.json");
if (fs.existsSync(rolePackets)) {
  try {
    const j = JSON.parse(fs.readFileSync(rolePackets, "utf8"));
    if (j.schema !== "p31.rolePackets/1.0.0") {
      die(`role-packets.json schema expected p31.rolePackets/1.0.0, got ${j.schema}`);
    }
    if (!Array.isArray(j.roles) || j.roles.length < 1) {
      die("role-packets.json must declare at least one role");
    }
  } catch (e) {
    die(`role-packets.json: ${e instanceof Error ? e.message : e}`);
  }
}
if (fs.existsSync(workSamples)) {
  try {
    const j = JSON.parse(fs.readFileSync(workSamples, "utf8"));
    if (j.schema !== "p31.workSamples/1.0.0") {
      die(`work-samples.json schema expected p31.workSamples/1.0.0, got ${j.schema}`);
    }
  } catch (e) {
    die(`work-samples.json: ${e instanceof Error ? e.message : e}`);
  }
}

if (failed > 0) {
  console.error(`verify-delta-hiring: ${failed} failure(s)`);
  process.exit(1);
}
console.log("[ OK ] verify-delta-hiring: bundle + canon link + assets ✓");
