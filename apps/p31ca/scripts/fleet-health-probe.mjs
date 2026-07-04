#!/usr/bin/env node
/**
 * Live GET to each Worker in public/p31-super-centaur-pack.json meshFleet (MESH + FLEET_HEALTH_PATHS).
 * Default: exit 0 with a report (CI visibility). Set P31_FLEET_STRICT=1 to exit 1 if any worker !ok.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const packPath = path.join(root, "public", "p31-super-centaur-pack.json");
const strict = process.env.P31_FLEET_STRICT === "1";
const timeoutMs = parseInt(process.env.P31_FLEET_TIMEOUT_MS || "8000", 10);

if (!fs.existsSync(packPath)) {
  console.error("fleet-health-probe: missing", packPath);
  process.exit(1);
}

const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const mesh = pack.meshFleet?.MESH;
const paths = pack.meshFleet?.FLEET_HEALTH_PATHS;
if (!mesh || !paths) {
  console.error("fleet-health-probe: meshFleet missing in pack");
  process.exit(1);
}

const results = [];
for (const name of Object.keys(mesh)) {
  const base = mesh[name].replace(/\/$/, "");
  const p = paths[name] || "/health";
  const url = `${base}${p.startsWith("/") ? p : "/" + p}`;
  const start = Date.now();
  let status = "down";
  let http = 0;
  let err = "";
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const r = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    http = r.status;
    status = r.ok ? "up" : "down";
  } catch (e) {
    err = e instanceof Error ? e.message : String(e);
  }
  results.push({ name, url, status, http, ms: Date.now() - start, err });
}

console.log("fleet-health-probe: mesh from p31-super-centaur-pack.json");
for (const r of results) {
  const line = `${r.status.toUpperCase().padEnd(4)} ${r.name.padEnd(12)} ${r.http || "-"} ${r.ms}ms ${r.url}`;
  console.log(r.status === "up" ? line : `\x1b[33m${line}\x1b[0m${r.err ? " — " + r.err : ""}`);
}

const allUp = results.every((r) => r.status === "up");
const anyUp = results.some((r) => r.status === "up");

if (strict && !allUp) {
  console.error("fleet-health-probe: STRICT — not all workers up");
  process.exit(1);
}
if (!strict && !anyUp) {
  console.warn("fleet-health-probe: no workers reachable (network or fleet down) — non-strict exit 0");
}
process.exit(0);
