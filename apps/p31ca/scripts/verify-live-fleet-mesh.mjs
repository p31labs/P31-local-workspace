#!/usr/bin/env node
/**
 * Ensures public/p31-live-fleet.json mesh block matches public/p31-mesh-constants.json
 * (no drift between shipped bundle and hub mesh constants).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");
const fleetPath = path.join(p31ca, "public", "p31-live-fleet.json");
const meshPath = path.join(p31ca, "public", "p31-mesh-constants.json");

function fail(msg) {
  console.error("verify-live-fleet-mesh:", msg);
  process.exit(1);
}

if (!fs.existsSync(fleetPath)) fail("missing public/p31-live-fleet.json");
if (!fs.existsSync(meshPath)) fail("missing public/p31-mesh-constants.json");

const fleet = JSON.parse(fs.readFileSync(fleetPath, "utf8"));
const mesh = JSON.parse(fs.readFileSync(meshPath, "utf8"));
const fm = fleet.meshAndPayments?.mesh;
if (!fm || typeof fm !== "object") fail("p31-live-fleet.json missing meshAndPayments.mesh");

for (const k of Object.keys(mesh)) {
  if (k.startsWith("_")) continue;
  if (fm[k] !== mesh[k]) {
    fail(
      `mesh.${k}: live-fleet ${JSON.stringify(fm[k])} !== p31-mesh-constants ${JSON.stringify(mesh[k])}`
    );
  }
}

/** Live-fleet bundle may add operator-facing fields not duplicated in the slim client JSON (see p31-constants mesh vs apply:constants output). */
const LIVE_FLEET_MESH_EXTRA = new Set(["note", "passkeySameOriginBase"]);
for (const k of Object.keys(fm)) {
  if (LIVE_FLEET_MESH_EXTRA.has(k)) continue;
  if (!(k in mesh)) {
    fail(
      `mesh.${k}: live-fleet has field not present in p31-mesh-constants (typo or stale mirror — run npm run sync:live-fleet:p31ca from P31 home after apply:constants)`
    );
  }
}

console.log("verify-live-fleet-mesh: OK");
process.exit(0);
