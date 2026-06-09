#!/usr/bin/env node
/**
 * Verifies p31.gardenZone/1.0.0 contract invariants.
 * Fails (exit 1) if any version-1 constraint is violated, the public mirror
 * is out of sync, or the manifest is missing.
 *
 * The garden manifest is the household plant + structure plan for the
 * S.J. / W.J. Camden County physical garden. Treated as canon (like the
 * creator-economy contract): edits require a passing verify run + commit.
 *
 * Run: npm run verify:garden-zone-8b
 * Also called from prebuild via verify:p31ca-contracts (root) and prebuild
 * (p31ca).
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { isDeepStrictEqual } from "util";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "..");
const PATH = resolve(ROOT, "ground-truth/garden-zone-8b.json");
const PUBLIC = resolve(ROOT, "public/garden-zone-8b.json");

let failed = false;
function fail(msg) {
  console.error("[FAIL] verify-garden-zone-8b:", msg);
  failed = true;
}
function ok(msg) {
  console.log("[ OK ] verify-garden-zone-8b:", msg);
}

if (!existsSync(PATH)) {
  fail("ground-truth/garden-zone-8b.json missing");
  process.exit(1);
}

let doc;
try {
  doc = JSON.parse(readFileSync(PATH, "utf8"));
} catch (e) {
  fail("JSON parse error: " + e.message);
  process.exit(1);
}

/* Public deploy mirror must match ground truth.
 * Same rule as creator-economy: edit ground-truth, copy → public/, verify. */
if (!existsSync(PUBLIC)) {
  fail(
    `public/garden-zone-8b.json missing — copy ground-truth → public/ for Pages deploy`
  );
} else {
  let pubDoc;
  try {
    pubDoc = JSON.parse(readFileSync(PUBLIC, "utf8"));
  } catch (e) {
    fail("public/garden-zone-8b.json parse error: " + e.message);
    pubDoc = null;
  }
  if (pubDoc && !isDeepStrictEqual(doc, pubDoc)) {
    fail(
      "public/garden-zone-8b.json out of sync with ground-truth/garden-zone-8b.json — copy ground-truth → public/ then re-run verify:garden-zone-8b"
    );
  } else if (pubDoc) {
    ok("public/garden-zone-8b.json matches ground truth ✓");
  }
}

/* Schema guard */
if (doc.schema !== "p31.gardenZone/1.0.0") {
  fail(
    `unexpected schema "${doc.schema}" — expected "p31.gardenZone/1.0.0"`
  );
}

/* Hardiness pin — Camden County is 8b/9a; if this changes, the household
 * moved or the plant list needs revisiting. */
if (doc.zone?.usdaHardiness !== "8b/9a") {
  fail(
    `zone.usdaHardiness must be "8b/9a" in v1.0.0 (got "${doc.zone?.usdaHardiness}")`
  );
} else {
  ok(`zone.usdaHardiness = "${doc.zone.usdaHardiness}" ✓`);
}

/* Tier-classified plants and structures.
 * Tier A = "this season"; B = "this year"; C = "later". */
const ALLOWED_TIERS = new Set(["A", "B", "C"]);

const plants = Array.isArray(doc.plants) ? doc.plants : [];
if (plants.length === 0) {
  fail("plants[] is empty");
} else {
  let plantErrors = 0;
  for (const p of plants) {
    if (!p.id || typeof p.id !== "string") {
      fail(`plant missing id: ${JSON.stringify(p).slice(0, 80)}`);
      plantErrors++;
      continue;
    }
    if (!ALLOWED_TIERS.has(p.tier)) {
      fail(`plant ${p.id}: tier must be A/B/C (got "${p.tier}")`);
      plantErrors++;
    }
    if (!p.scientific || typeof p.scientific !== "string") {
      fail(`plant ${p.id}: missing scientific name`);
      plantErrors++;
    }
  }
  if (plantErrors === 0) {
    ok(`plants: ${plants.length} entries, all tiered + named ✓`);
  }
}

const structures = Array.isArray(doc.structures) ? doc.structures : [];
if (structures.length === 0) {
  fail("structures[] is empty");
} else {
  let structErrors = 0;
  for (const s of structures) {
    if (!s.id || typeof s.id !== "string") {
      fail(`structure missing id: ${JSON.stringify(s).slice(0, 80)}`);
      structErrors++;
      continue;
    }
    if (!ALLOWED_TIERS.has(s.tier)) {
      fail(`structure ${s.id}: tier must be A/B/C (got "${s.tier}")`);
      structErrors++;
    }
  }
  if (structErrors === 0) {
    ok(`structures: ${structures.length} entries, all tiered ✓`);
  }
}

/* Native milkweed only — tropical milkweed (A. curassavica) disrupts
 * monarch migration timing in southern zones. This is operationally critical
 * for the pollinator-flyway promise. */
const milkweedIds = plants
  .filter((p) => /milkweed/i.test(p.common ?? ""))
  .map((p) => ({ id: p.id, scientific: p.scientific }));

if (milkweedIds.length === 0) {
  fail("no milkweed in plants[] — pollinator flyway requires monarch host");
} else {
  const allNative = milkweedIds.every((m) =>
    /^Asclepias\s+(incarnata|tuberosa|syriaca)\b/i.test(m.scientific ?? "")
  );
  const hasTropical = milkweedIds.some((m) =>
    /curassavica/i.test(m.scientific ?? "")
  );
  if (hasTropical) {
    fail(
      "tropical milkweed (Asclepias curassavica) is forbidden in zone 8b — disrupts monarch migration"
    );
  } else if (!allNative) {
    fail(
      `milkweed entries must be native (incarnata/tuberosa/syriaca); got: ${milkweedIds
        .map((m) => m.scientific)
        .join(", ")}`
    );
  } else {
    ok(
      `milkweed: ${milkweedIds.length} native entries, no curassavica ✓`
    );
  }
}

/* Required design principles — these are the kid-perfect-garden axioms.
 * If any of these drop, the design has lost its spine. */
const REQUIRED_PRINCIPLES = [
  "enclosure",
  "tasteable-by-month",
  "ownership-square",
  "yes-zone",
];
const principleNames = (doc.designPrinciples ?? []).map((p) => p.name);
for (const required of REQUIRED_PRINCIPLES) {
  if (!principleNames.includes(required)) {
    fail(`designPrinciples missing required entry: "${required}"`);
  }
}
if (
  REQUIRED_PRINCIPLES.every((r) => principleNames.includes(r))
) {
  ok(
    `designPrinciples: ${REQUIRED_PRINCIPLES.length} required axioms present ✓`
  );
}

/* Each kid gets a square. The .cursorrules family-vertex canon is
 * will / S.J. / W.J. / christyn. The two children must have a square. */
const structureIds = new Set(structures.map((s) => s.id));
for (const required of ["sj-square", "wj-square"]) {
  if (!structureIds.has(required)) {
    fail(
      `structures missing "${required}" — every child needs a marked plot`
    );
  }
}
if (
  structureIds.has("sj-square") &&
  structureIds.has("wj-square")
) {
  ok("each child has a named square (sj-square, wj-square) ✓");
}

/* Phos bridge schema compatibility — the manifest claims to feed
 * simplex-v7/src/skills/phos-handler.ts. The handler accepts a `garden_state`
 * with at least molecules_today / current_action / sensory_profile. We don't
 * hard-link to the handler from here (cross-tree drift), but we DO pin the
 * schema id so a Phos schema bump shows up in this verify. */
if (doc.phosBridge?.schemaCompatibility !== "p31.phos.gardenState/1.0.0") {
  fail(
    `phosBridge.schemaCompatibility must be "p31.phos.gardenState/1.0.0" (got "${doc.phosBridge?.schemaCompatibility}")`
  );
} else {
  ok(
    `phosBridge.schemaCompatibility = "${doc.phosBridge.schemaCompatibility}" ✓`
  );
}

/* Transparency claims */
if (doc.transparency?.publicEndpoint !== "/garden-zone-8b.json") {
  fail(
    `transparency.publicEndpoint should be "/garden-zone-8b.json", got "${doc.transparency?.publicEndpoint}"`
  );
} else {
  ok(`transparency.publicEndpoint = "${doc.transparency.publicEndpoint}" ✓`);
}

if (failed) {
  process.exit(1);
} else {
  console.log(
    `[ OK ] verify-garden-zone-8b: all v1.0.0 constraints satisfied (${plants.length} plants, ${structures.length} structures)`
  );
}
