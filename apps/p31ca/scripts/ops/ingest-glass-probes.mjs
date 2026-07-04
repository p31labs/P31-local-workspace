#!/usr/bin/env node
/**
 * Resolves p31-ecosystem.json glassProbes (home) + mesh/bonding into src/data/ops-glass-probes.json.
 * Run: node scripts/ops/ingest-glass-probes.mjs (from p31ca)
 * CWP-P31-UI-2026-01 Phase B. Home↔p31ca coupling is listed in p31-alignment.json (sources/derivations).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "../..");
const home = path.join(p31ca, "../../..");
const meshPath = path.join(p31ca, "src/data/p31-mesh-constants.json");
const outPath = path.join(p31ca, "src/data/ops-glass-probes.json");
const ecosystemPath = path.join(home, "p31-ecosystem.json");
const constantsPath = path.join(home, "p31-constants.json");

function getNested(obj, dotted) {
  return dotted.split(".").reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj);
}

function expand(template, constMap) {
  return String(template).replace(/\{\{([^}]+)\}\}/g, (_, key) => {
    const v = getNested(constMap, key.trim());
    return v !== undefined && v !== null ? String(v) : "";
  });
}

const defaultBonding = { publicUrl: "https://bonding.p31ca.org" };

const fallbackEcosystem = {
  glassProbes: [
    {
      id: "k4-personal-api-health",
      url: "{{mesh.k4PersonalWorkerUrl}}/api/health",
      group: "mesh",
      note: "Canonical k4-personal liveness",
    },
    {
      id: "orchestrator-status",
      url: "{{mesh.orchestratorWorkerUrl}}/api/orchestrator/status",
      group: "orchestrator",
      note: "May return 401/403",
    },
    {
      id: "command-center-health",
      url: "https://command-center.trimtab-signal.workers.dev/api/health",
      group: "command-center",
      note: "EPCP",
    },
  ],
};

function main() {
  if (!fs.existsSync(ecosystemPath) && fs.existsSync(outPath)) {
    console.log("ingest-glass-probes: skip (no home p31-ecosystem.json — using committed", outPath + ")");
    process.exit(0);
  }
  if (!fs.existsSync(meshPath)) {
    console.error("ingest-glass-probes: missing", meshPath, "— run: npm run apply:constants from home");
    process.exit(1);
  }
  const mesh = JSON.parse(fs.readFileSync(meshPath, "utf8"));
  let bonding = defaultBonding;
  /** @type {Record<string, unknown>} */
  const payment = {};
  /** @type {Record<string, unknown>} */
  let integrations = {};
  if (fs.existsSync(constantsPath)) {
    const c = JSON.parse(fs.readFileSync(constantsPath, "utf8"));
    if (c.bonding?.publicUrl) {
      bonding = { publicUrl: c.bonding.publicUrl };
    }
    if (c.payment && typeof c.payment === "object") {
      Object.assign(payment, c.payment);
    }
    if (c.integrations && typeof c.integrations === "object") {
      integrations = c.integrations;
    }
  }
  const constMap = { mesh, bonding, payment, integrations };
  let source = "inline-fallback";
  let glass = fallbackEcosystem.glassProbes;
  if (fs.existsSync(ecosystemPath)) {
    const eco = JSON.parse(fs.readFileSync(ecosystemPath, "utf8"));
    if (Array.isArray(eco.glassProbes) && eco.glassProbes.length) {
      glass = eco.glassProbes;
      source = "p31-ecosystem.json";
    }
  }
  const probes = [];
  for (const p of glass) {
    const url = expand(p.url, constMap);
    if (p.skipIfEmpty && (!url || !/^https?:/i.test(String(url)))) {
      continue;
    }
    if (!url.startsWith("http")) {
      console.error("ingest-glass-probes: bad url for", p.id, url);
      process.exit(1);
    }
    /** @type {Record<string, unknown>} */
    const row = {
      id: p.id,
      group: p.group || "other",
      note: p.note || "",
      url,
    };
    if (p.method && String(p.method).toUpperCase() !== "GET") {
      row.method = p.method;
    }
    if (p.body !== undefined) row.body = p.body;
    if (p.expectJsonKey) row.expectJsonKey = p.expectJsonKey;
    probes.push(row);
  }
  const out = {
    schema: "p31.opsGlassProbes/1.0.0",
    // No `ingested` timestamp: deterministic build for drift detection.
    // Git log on this mirror is the audit trail. (Same pattern as
    // home repo scripts/build-phos-voice-json.mjs line 205.)
    source,
    probes,
  };
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  const serialized = JSON.stringify(out, null, 2) + "\n";
  fs.writeFileSync(outPath, serialized, "utf8");
  console.log("ingest-glass-probes: wrote", path.relative(p31ca, outPath), `(${probes.length} probes, ${source})`);
  // Public mirror so /status.html (CWP-PEER-1I) can fetch the registry from the same origin
  // without auth. Same payload as src/data/ — committed; verifier in repo CI will catch drift.
  const publicMirror = path.join(p31ca, "public/ops-glass-probes.json");
  fs.mkdirSync(path.dirname(publicMirror), { recursive: true });
  fs.writeFileSync(publicMirror, serialized, "utf8");
  console.log("ingest-glass-probes: wrote", path.relative(p31ca, publicMirror), "(public mirror for /status.html)");
}

main();
