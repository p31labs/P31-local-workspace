#!/usr/bin/env node
/**
 * ESM bundle for static *-about.html: ambient K₄ mesh (mesh-living-background).
 * Three.js is external — about pages ship an import map (r183, same as hub).
 */
import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "js");
const outfile = path.join(outDir, "p31-mesh-living-about.mjs");

fs.mkdirSync(outDir, { recursive: true });

await esbuild.build({
  entryPoints: [path.join(root, "src/scripts/mesh-about-bootstrap.ts")],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  outfile,
  packages: "external",
  legalComments: "none",
  logLevel: "info",
});

console.log("bundle-mesh-about-bg: OK → public/js/p31-mesh-living-about.mjs");
