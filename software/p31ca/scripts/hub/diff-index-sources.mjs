#!/usr/bin/env node
/**
 * diff-index-sources.mjs
 *
 * Compares hub "index" sources to reduce drift (CWP WBS 0.1 / 5.1).
 * Run **after** verify-ground-truth in CI (`prebuild` runs GT → hub:build → hub:verify → this).
 *
 * 1) Ensures src/data/hub-landing.json coreProducts id order === HUB_COCKPIT_ORDER in hub-app-ids.mjs
 * 2) If public/legacy-mvp-hub.html exists and has mvpData, extracts ids; optional strict-mvp for registry match;
 *    compares mvp set to HUB_ALL_CARD_ORDER (legacy file may be absent — retired, see ADR)
 * 3) Warns if index.astro still has inline const coreProducts
 *
 * Usage: node scripts/hub/diff-index-sources.mjs
 *   --with-verify  run verify-ground-truth.mjs first (for standalone: npm run hub:diff)
 *   --strict       exit 1 on any warning
 *   --strict-mvp   exit 1 if any mvpData id missing from registry
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, "..", "..");
const strict = process.argv.includes("--strict");
const strictMvp = process.argv.includes("--strict-mvp");
const withVerify = process.argv.includes("--with-verify");

function err(msg) {
  console.error("diff-index-sources:", msg);
}

function runVerifyGroundTruth() {
  const script = path.join(P31CA, "scripts", "verify-ground-truth.mjs");
  const r = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    cwd: P31CA,
  });
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  if (r.status !== 0) {
    err("verify-ground-truth failed — fix ground truth / _redirects / registry / pins first");
    process.exit(1);
  }
}

/**
 * @returns {string[]}
 */
function parseHubLandingIds() {
  const fp = path.join(P31CA, "src", "data", "hub-landing.json");
  if (!fs.existsSync(fp)) {
    return [];
  }
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  const list = j.coreProducts;
  if (!Array.isArray(list)) return [];
  return list.map((p) => p.id).filter(Boolean);
}

/**
 * @returns {string[]}
 */
function parseMvpDataIds() {
  const legacy = path.join(P31CA, "public", "legacy-mvp-hub.html");
  if (!fs.existsSync(legacy)) {
    return [];
  }
  const m = fs.readFileSync(legacy, "utf8");
  const start = m.indexOf("const mvpData =");
  if (start < 0) {
    return [];
  }
  const end = m.indexOf("];", start);
  if (end < 0) {
    return [];
  }
  const block = m.slice(start, end + 2);
  const ids = [];
  for (const r of block.matchAll(/id:\s*['"]([a-z0-9-]+)['"]/gi)) {
    ids.push(r[1]);
  }
  return ids;
}

async function loadRegistry() {
  const regPath = path.join(P31CA, "scripts", "hub", "registry.mjs");
  const { registry } = await import(pathToFileURL(regPath).href);
  return registry;
}

function indexAstroHasInlineCoreProducts() {
  const fp = path.join(P31CA, "src", "pages", "index.astro");
  if (!fs.existsSync(fp)) return false;
  return fs.readFileSync(fp, "utf8").includes("const coreProducts = [");
}

async function main() {
  console.log("diff-index-sources: hub-landing + optional mvpData index\n");

  if (withVerify) {
    runVerifyGroundTruth();
  }

  const hubAppIdsUrl = pathToFileURL(
    path.join(P31CA, "scripts", "hub", "hub-app-ids.mjs")
  ).href;
  const hubApp = await import(hubAppIdsUrl);
  const cockpitIds = hubApp.HUB_COCKPIT_ORDER;
  const homeIndexIds = hubApp.HUB_ALL_CARD_ORDER;
  if (!Array.isArray(cockpitIds) || !Array.isArray(homeIndexIds)) {
    err("hub-app-ids.mjs must export HUB_COCKPIT_ORDER and HUB_ALL_CARD_ORDER");
    process.exit(1);
  }

  const hubIds = parseHubLandingIds();
  const mvpIds = parseMvpDataIds();
  if (mvpIds.length === 0) {
    console.log(
      "[info] public/legacy-mvp-hub.html absent — mvpData parse skipped (expected). Normative ADR: P31 home docs/ADR-ECO-HUB-SINGLE-SOURCE.md"
    );
  }
  const registry = await loadRegistry();
  const byId = new Set(registry.map((r) => r.id));
  const registryById = new Map(registry.map((r) => [r.id, r]));

  // Filter concept/draft products from cockpitIds for comparison
  const liveCockpitIds = cockpitIds.filter((id) => {
    const r = registryById.get(id);
    return r && r.status !== 'concept' && r.status !== 'draft';
  });

  let failed = 0;
  let warned = 0;

  if (hubIds.length === 0) {
    err("src/data/hub-landing.json missing or empty — run npm run hub:build");
    failed = 1;
  } else {
    if (hubIds.length !== liveCockpitIds.length) {
      err(
        `hub-landing coreProducts count (${hubIds.length}) != live COCKPIT_PRODUCT_IDS (${liveCockpitIds.length})`
      );
      failed = 1;
    }
    for (let i = 0; i < Math.min(hubIds.length, liveCockpitIds.length); i++) {
      if (hubIds[i] !== liveCockpitIds[i]) {
        err(
          `order/id mismatch at [${i}]: hub-landing ${hubIds[i]} vs COCKPIT ${liveCockpitIds[i]}`
        );
        failed = 1;
        break;
      }
    }
  }

  for (const id of mvpIds) {
    if (!byId.has(id)) {
      const msg = `mvpData id "${id}" not in registry.mjs — fix mvpData or add registry row`;
      if (strictMvp) {
        err(msg);
        failed = 1;
      } else {
        console.warn("WARNING:", msg);
        warned = 1;
      }
    }
  }

  if (mvpIds.length > 0) {
    const mvpSet = new Set(mvpIds);
    const homeIndexSet = new Set(homeIndexIds);
    const onlyMvp = [...mvpSet].filter((id) => !homeIndexSet.has(id));
    const onlyHome = [...homeIndexSet].filter((id) => !mvpSet.has(id));
    if (onlyMvp.length) {
      console.warn(
        "\n[warn] mvpData lists id(s) not on hub home index (cockpit+prototypes):",
        onlyMvp.join(", ")
      );
      warned = 1;
    }
    if (onlyHome.length) {
      console.log(
        "\n[info] Legacy mvpData omits " +
          onlyHome.length +
          " hub index card(s). Dual-track is retired — remove or align legacy file (P31 home docs/ADR-ECO-HUB-SINGLE-SOURCE.md)"
      );
    }
  }

  if (indexAstroHasInlineCoreProducts()) {
    console.warn(
      "\n[warn] src/pages/index.astro still has inline const coreProducts — migrate to hub-landing.json import (CWP D2)"
    );
    warned = 1;
  }

  if (failed) {
    process.exit(1);
  }
  if (strict && warned) {
    err("--strict: warnings treated as failure");
    process.exit(1);
  }
  if (warned) {
    console.log(
      "\ndiff-index-sources: OK (hard checks passed); see warnings above — use --strict-mvp if legacy mvpData exists and must match registry"
    );
  } else {
    console.log("diff-index-sources: OK (ground truth + hub-landing alignment)");
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
