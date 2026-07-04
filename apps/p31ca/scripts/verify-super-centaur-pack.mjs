#!/usr/bin/env node
/**
 * Validates public/p31-super-centaur-pack.json shape and syncs meshFleet.{MESH,FLEET_HEALTH_PATHS}
 * with integration-handoff/CWP-30/mesh-bridge.ts (single source for SUPER-CENTAUR proxy fleet table).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31caRoot = path.join(__dirname, "..");
const packPath = path.join(p31caRoot, "public", "p31-super-centaur-pack.json");
const bridgePath = path.join(
  p31caRoot,
  "..",
  "integration-handoff",
  "CWP-30",
  "mesh-bridge.ts",
);

let failed = 0;
function err(msg) {
  console.error("verify-super-centaur-pack:", msg);
  failed = 1;
}

function extractBracedObject(source, anchor) {
  const i = source.indexOf(anchor);
  if (i === -1) return null;
  const start = source.indexOf("{", i);
  if (start === -1) return null;
  let depth = 0;
  for (let j = start; j < source.length; j++) {
    const c = source[j];
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        return source.slice(start + 1, j);
      }
    }
  }
  return null;
}

function parseTsStringRecord(block) {
  if (!block) return null;
  const out = {};
  const re = /(\w+)\s*:\s*['"]([^'"]*)['"]/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    out[m[1]] = m[2];
  }
  return Object.keys(out).length ? out : null;
}

if (!fs.existsSync(packPath)) {
  err(`missing ${path.relative(p31caRoot, packPath)}`);
  process.exit(1);
}

let pack;
try {
  pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
} catch (e) {
  err(`JSON parse: ${e.message}`);
  process.exit(1);
}

if (pack.schema !== "p31.superCentaurStarterPack/1.0.0") {
  err(`expected schema p31.superCentaurStarterPack/1.0.0, got ${JSON.stringify(pack.schema)}`);
}

const requiredTop = [
  "version",
  "title",
  "summary",
  "controlledWorkPackages",
  "meshFleet",
  "humanPage",
  "humanPageAliases",
];
for (const k of requiredTop) {
  if (pack[k] == null || pack[k] === "") err(`missing or empty top-level key: ${k}`);
}

if (!Array.isArray(pack.humanPageAliases) || pack.humanPageAliases.length < 1) {
  err("humanPageAliases must be a non-empty array of URLs");
}

if (!Array.isArray(pack.controlledWorkPackages) || pack.controlledWorkPackages.length < 1) {
  err("controlledWorkPackages must be a non-empty array");
}

const meshKeys = ["agentHub", "cage", "personal", "hubs", "bouncer", "chamber"];
const mf = pack.meshFleet;
if (!mf || typeof mf !== "object") {
  err("meshFleet must be an object");
} else {
  for (const k of meshKeys) {
    if (!mf.MESH?.[k]) err(`meshFleet.MESH.${k} missing`);
    if (!mf.FLEET_HEALTH_PATHS?.[k]) err(`meshFleet.FLEET_HEALTH_PATHS.${k} missing`);
  }
}

if (!fs.existsSync(bridgePath)) {
  console.warn(
    "verify-super-centaur-pack: mesh-bridge.ts missing — skip MESH sync (partial clone)",
  );
} else {
  const bridge = fs.readFileSync(bridgePath, "utf8");
  const meshBlock = extractBracedObject(bridge, "export const MESH");
  const healthBlock = extractBracedObject(bridge, "FLEET_HEALTH_PATHS");
  const bMesh = parseTsStringRecord(meshBlock);
  const bHealth = parseTsStringRecord(healthBlock);
  if (!bMesh || !bHealth) {
    err("could not parse MESH / FLEET_HEALTH_PATHS from mesh-bridge.ts");
  } else {
    for (const k of meshKeys) {
      if (pack.meshFleet.MESH[k] !== bMesh[k]) {
        err(`meshFleet.MESH.${k}: pack has ${pack.meshFleet.MESH[k]}, mesh-bridge has ${bMesh[k]}`);
      }
      if (pack.meshFleet.FLEET_HEALTH_PATHS[k] !== bHealth[k]) {
        err(
          `meshFleet.FLEET_HEALTH_PATHS.${k}: pack has ${pack.meshFleet.FLEET_HEALTH_PATHS[k]}, mesh-bridge has ${bHealth[k]}`,
        );
      }
    }
  }
}

if (!failed) {
  console.log("verify-super-centaur-pack: OK");
}
process.exit(failed);
