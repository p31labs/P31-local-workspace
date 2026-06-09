#!/usr/bin/env node
/**
 * Fast post-quantum supply-chain + install sanity for @p31/quantum-core.
 * - Confirms @noble/post-quantum is present and at least MIN_NOBLE (NIST ML-KEM / ML-DSA)
 * - Confirms the package exposes ml-kem / ml-dsa entry files (import map stability)
 * Run: node scripts/pqc-audit.mjs [--quiet]
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const quiet = process.argv.includes("--quiet");
const NOBLE = join(root, "node_modules", "@noble", "post-quantum");
const MIN_NOBLE = "0.6.0";

function parseSemver(s) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(s);
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function gte(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) return false;
  if (pa.major !== pb.major) return pa.major > pb.major;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor;
  return pa.patch >= pb.patch;
}

const noblePkg = join(NOBLE, "package.json");
if (!existsSync(noblePkg)) {
  console.error("[FAIL] pqc-audit: @noble/post-quantum not installed (run npm ci in packages/quantum-core)");
  process.exit(1);
}

const { version, name } = JSON.parse(readFileSync(noblePkg, "utf8"));
if (name !== "@noble/post-quantum" || !version) {
  console.error("[FAIL] pqc-audit: unexpected package at @noble/post-quantum");
  process.exit(1);
}

if (!gte(version, MIN_NOBLE)) {
  console.error(`[FAIL] pqc-audit: @noble/post-quantum ${version} < required ${MIN_NOBLE}`);
  process.exit(1);
}

const kem = join(NOBLE, "ml-kem.js");
const dsa = join(NOBLE, "ml-dsa.js");
if (!existsSync(kem) || !existsSync(dsa)) {
  console.error("[FAIL] pqc-audit: missing ml-kem.js or ml-dsa.js (check @noble/post-quantum package layout)");
  process.exit(1);
}

const corePkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const dep = corePkg.dependencies?.["@noble/post-quantum"] ?? "";
if (!dep) {
  console.error("[FAIL] pqc-audit: @noble/post-quantum missing from package.json dependencies");
  process.exit(1);
}

if (!quiet) {
  console.log(
    `[ OK ] pqc-audit: @noble/post-quantum ${version} (min ${MIN_NOBLE}); ML-KEM + ML-DSA surface OK; dep=${dep.trim()}`
  );
}
process.exit(0);
