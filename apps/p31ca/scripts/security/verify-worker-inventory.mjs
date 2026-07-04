#!/usr/bin/env node
/**
 * Phase A (extension): Worker inventory + CORS scan
 * - Walks all wrangler.toml files under the monorepo root
 * - Extracts: name, main, routes, vars (names only), KV/D1/DO bindings
 * - Flags workers not in security/worker-allowlist.json (P1)
 * - Flags source files with wildcard CORS where credentials may be present (P1)
 * - Writes build/security-inventory.json
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dir, "../..");
// two levels up from p31ca → andromeda/ (entire monorepo tree for wrangler discovery)
const MONO_ROOT = resolve(ROOT, "../..");
const ALLOWLIST_PATH = resolve(ROOT, "security/worker-allowlist.json");
const INVENTORY_PATH = resolve(ROOT, "build/security-inventory.json");

function log(level, msg) {
  const prefix = { P0: "[FAIL]", P1: "[WARN]", P2: "[INFO]", OK: "[ OK ]" }[level] ?? "[    ]";
  console.log(`${prefix} ${msg}`);
}

function findWranglerTomls(root) {
  try {
    const out = execSync(
      `find "${root}" -name "wrangler.toml" ` +
        `-not -path "*/node_modules/*" -not -path "*/.git/*" ` +
        `-not -path "*/docs/files/*"`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    return out.trim().split("\n").filter(Boolean);
  } catch { return []; }
}

// Minimal TOML value extractor — handles string/array fields without a full TOML parser
function extractToml(content) {
  const result = { name: null, main: null, vars: [], bindings: [], routes: [] };

  // name = "..."
  const nameMatch = content.match(/^name\s*=\s*["']([^"']+)["']/m);
  if (nameMatch) result.name = nameMatch[1];

  // main = "..."
  const mainMatch = content.match(/^main\s*=\s*["']([^"']+)["']/m);
  if (mainMatch) result.main = mainMatch[1];

  // [vars] section keys (names only, not values)
  const varsSection = content.match(/^\[vars\]([\s\S]*?)(?=^\[|\z)/m);
  if (varsSection) {
    const keys = [...varsSection[1].matchAll(/^(\w+)\s*=/mg)].map(m => m[1]);
    result.vars = keys;
  }

  // [[kv_namespaces]] bindings
  const kvMatches = [...content.matchAll(/binding\s*=\s*["']([^"']+)["']/g)];
  for (const m of kvMatches) result.bindings.push(m[1]);

  // routes
  const routeMatches = [...content.matchAll(/^pattern\s*=\s*["']([^"']+)["']/mg)];
  for (const m of routeMatches) result.routes.push(m[1]);

  return result;
}

function findCorsWildcards(workerDir) {
  const findings = [];
  try {
    // Only scan source files — exclude node_modules, dist, and playwright bundles
    const out = execSync(
      `grep -rn "Access-Control-Allow-Origin.*\\*" "${workerDir}" \
        --include="*.ts" --include="*.js" \
        --exclude-dir=node_modules \
        --exclude-dir=dist \
        --exclude-dir=.wrangler \
        --exclude="*.bundle.js" \
        --exclude="*.min.js" \
        2>/dev/null || true`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    for (const line of out.trim().split("\n").filter(Boolean)) {
      // Skip if path contains node_modules (belt-and-suspenders for non-GNU grep)
      if (!line.includes("node_modules")) findings.push(line);
    }
  } catch {}
  return findings;
}

function loadAllowlist() {
  if (!existsSync(ALLOWLIST_PATH)) return [];
  return JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8")).workers ?? [];
}

export function runWorkerInventory() {
  const allowlist = loadAllowlist();
  const allowedNames = new Set(allowlist.map(w => w.name));
  const tomls = findWranglerTomls(MONO_ROOT);

  let p1 = 0;
  const inventory = { generatedAt: new Date().toISOString(), workers: [] };

  for (const tomlPath of tomls) {
    const content = readFileSync(tomlPath, "utf8");
    const parsed = extractToml(content);
    if (!parsed.name) continue; // skip nameless / template tomls

    const relPath = relative(MONO_ROOT, tomlPath);
    const workerDir = dirname(tomlPath);
    const corsFindings = findCorsWildcards(workerDir);

    const entry = {
      name: parsed.name,
      toml: relPath,
      main: parsed.main,
      vars: parsed.vars,
      bindings: parsed.bindings,
      routes: parsed.routes,
      corsWildcards: corsFindings,
      inAllowlist: allowedNames.has(parsed.name),
    };
    inventory.workers.push(entry);

    if (!allowedNames.has(parsed.name)) {
      log("P1", `Worker not in allowlist: ${parsed.name} (${relPath}) — add to security/worker-allowlist.json if approved`);
      p1++;
    }

    if (corsFindings.length > 0) {
      log("P1", `Wildcard CORS in ${parsed.name}: ${corsFindings.length} match(es) — review if credentials are passed`);
      for (const hit of corsFindings) log("P2", `  ${hit.trim()}`);
      p1++;
    }
  }

  // Write inventory (ensure build/ exists — clean checkouts may omit it)
  mkdirSync(dirname(INVENTORY_PATH), { recursive: true });
  writeFileSync(INVENTORY_PATH, JSON.stringify(inventory, null, 2));

  const known = inventory.workers.filter(w => w.inAllowlist).length;
  const total = inventory.workers.length;
  log("OK", `Worker inventory: ${total} workers found, ${known} in allowlist, ${total - known} new — see build/security-inventory.json`);

  return { ok: true, p1, inventory }; // worker gaps are P1, not P0
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { p1 } = runWorkerInventory();
  // P1 = warning, don't exit non-zero (per policy)
}
