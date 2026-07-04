#!/usr/bin/env node
/**
 * Fails if synergetic-manifest.json drifts from Three pins on disk or from
 * ground-truth threejs keys. Run: npm run verify:synergetic (via prebuild).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");
const manPath = path.join(p31ca, "ground-truth", "synergetic-manifest.json");
const gtPath = path.join(p31ca, "ground-truth", "p31.ground-truth.json");

let failed = 0;
function err(msg) {
  console.error("verify-synergetic:", msg);
  failed = 1;
}

if (!fs.existsSync(manPath)) {
  err(`missing ${manPath}`);
  process.exit(1);
}
if (!fs.existsSync(gtPath)) {
  err(`missing ${gtPath}`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manPath, "utf8"));
const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
const entries = manifest.entries || [];

const ids = new Set();
const gtKeyToEntryId = new Map();

for (const e of entries) {
  if (!e.id || !e.type) {
    err(`entry missing id or type: ${JSON.stringify(e)}`);
    continue;
  }
  if (ids.has(e.id)) err(`duplicate manifest id: ${e.id}`);
  ids.add(e.id);

  const rel = e.path;
  if (!rel) {
    err(`entry ${e.id}: missing path`);
    continue;
  }
  const fp = path.resolve(p31ca, rel);
  if (!fs.existsSync(fp)) {
    err(`entry ${e.id}: missing file ${rel} (resolved ${fp})`);
    continue;
  }

  if (e.groundTruthThreejsKey) {
    if (gtKeyToEntryId.has(e.groundTruthThreejsKey)) {
      err(
        `groundTruthThreejsKey '${e.groundTruthThreejsKey}' claimed by both '${gtKeyToEntryId.get(e.groundTruthThreejsKey)}' and '${e.id}'`
      );
    }
    gtKeyToEntryId.set(e.groundTruthThreejsKey, e.id);
  }

  if (e.type === "pwa") {
    let pkg;
    try {
      pkg = JSON.parse(fs.readFileSync(fp, "utf8"));
    } catch {
      err(`entry ${e.id}: invalid JSON at ${rel}`);
      continue;
    }
    const dep = pkg.dependencies?.three;
    if (e.threeDependency == null) {
      err(`entry ${e.id}: pwa entries need threeDependency`);
    } else if (dep !== e.threeDependency) {
      err(
        `entry ${e.id}: package.json dependencies.three is '${dep}', manifest expects '${e.threeDependency}'`
      );
    }
  } else if (e.type === "astro" || e.type === "static") {
    if (!e.threeRevision) {
      err(`entry ${e.id}: astro/static entries need threeRevision`);
      continue;
    }
    const body = fs.readFileSync(fp, "utf8");
    const needle = `three@${e.threeRevision}`;
    if (!body.includes(needle)) {
      err(`entry ${e.id}: ${rel} must include '${needle}'`);
    }
    if (e.groundTruthThreejsKey) {
      const spec = gt.threejs?.[e.groundTruthThreejsKey];
      if (!spec) {
        err(
          `entry ${e.id}: groundTruthThreejsKey '${e.groundTruthThreejsKey}' not in p31.ground-truth.json threejs`
        );
      } else {
        const gtp = spec.path?.replace(/\\/g, "/");
        const ep = rel.replace(/\\/g, "/");
        if (spec.path && gtp !== ep) {
          err(
            `entry ${e.id}: path '${rel}' != ground-truth threejs.${e.groundTruthThreejsKey}.path '${spec.path}'`
          );
        }
        if (
          spec.mustIncludeSubstring &&
          !spec.mustIncludeSubstring.includes(e.threeRevision)
        ) {
          err(
            `entry ${e.id}: threeRevision ${e.threeRevision} inconsistent with ground-truth mustIncludeSubstring '${spec.mustIncludeSubstring}'`
          );
        }
      }
    }
  } else {
    err(`entry ${e.id}: unknown type '${e.type}' (use astro|static|pwa)`);
  }
}

for (const key of Object.keys(gt.threejs || {})) {
  if (!gtKeyToEntryId.has(key)) {
    err(
      `ground-truth threejs.'${key}' has no manifest entry (set groundTruthThreejsKey on an entry in synergetic-manifest.json)`
    );
  }
}

process.exit(failed);
