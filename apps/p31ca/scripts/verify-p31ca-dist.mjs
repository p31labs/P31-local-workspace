#!/usr/bin/env node
/**
 * Fails the build if Cloudflare Pages `dist/` is missing critical assets.
 * Run as npm `postbuild` (after `astro build`). Catches empty/partial output before deploy.
 *
 * Phase 2 (2026-05-05): 105 static HTML pages deleted; Astro routes build to dist/[route]/index.html.
 * Top-level HTML check updated to count Astro route directories instead.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");
const dist = path.join(p31ca, "dist");

const requiredFiles = [
  "_redirects",
  "passport-generator.html",
  "p31-public-surface.json",
  "p31-mesh-constants.json",
  "p31-welcome-packages.json",
  "p31-live-fleet.json",
  "lib/p31-subject-id.js",
  "lib/p31-initial-build-bake.js",
  "lib/p31-passkey-api-base.js",
  ".well-known/security.txt",
  "robots.txt",
  "sitemap.xml",
];

let failed = 0;
function err(msg) {
  console.error("verify-p31ca-dist:", msg);
  failed = 1;
}

if (!fs.existsSync(dist)) {
  err("missing dist/ — run npm run build from p31ca");
  process.exit(1);
}

for (const rel of requiredFiles) {
  const fp = path.join(dist, rel);
  if (!fs.existsSync(fp)) {
    err(`missing dist/${rel}`);
  }
}

const redirects = path.join(dist, "_redirects");
if (fs.existsSync(redirects)) {
  const t = fs.readFileSync(redirects, "utf8");
  if (!t.includes("/build")) {
    err("_redirects must include /build short-path");
  }
  if (!t.includes("/family-pack")) {
    err("_redirects must include /family-pack short-path");
  }
  if (!t.includes("/security")) {
    err("_redirects must include /security short-path");
  }
}

// Phase 2: Astro routes compile to dist/*/index.html — check route count not top-level HTML count
function countAstroRoutes(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter(
      (e) => e.isDirectory() && fs.existsSync(path.join(dir, e.name, "index.html"))
    ).length;
  } catch {
    return 0;
  }
}
const astroRoutes = countAstroRoutes(dist);
if (astroRoutes < 6) {
  err(`expected ≥6 Astro route dirs in dist/ (got ${astroRoutes}) — partial export?`);
}

if (failed) {
  process.exit(1);
}
const topHtml = fs.readdirSync(dist).filter((f) => f.endsWith(".html")).length;
console.log(`verify-p31ca-dist: OK (${topHtml} top-level html, ${astroRoutes} Astro routes, +lib +_redirects)`);
process.exit(0);
