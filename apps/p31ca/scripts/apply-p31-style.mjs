#!/usr/bin/env node
/**
 * p31ca apply-p31-style — writes public/p31-style.css + p31-tailwind-extend.js from design-tokens.
 * Root `npm run apply:p31-style` runs this and mirrors to cognitive-passport/p31-style.css.
 * Alignment: p31-alignment.json (canon-to-style-css); verify: npm run verify:p31-style
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { buildStyleArtifacts } from "./lib/p31-style-generate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const tokenPath = path.join(root, "..", "design-tokens", "p31-universal-canon.json");
const pub = path.join(root, "public");

if (!fs.existsSync(tokenPath)) {
  console.error("apply-p31-style: missing", tokenPath);
  process.exit(1);
}

const doc = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
const { css, js } = buildStyleArtifacts(doc);
fs.writeFileSync(path.join(pub, "p31-style.css"), css, "utf8");
fs.writeFileSync(path.join(pub, "p31-tailwind-extend.js"), js, "utf8");
console.log("apply-p31-style: wrote public/p31-style.css, public/p31-tailwind-extend.js");

execSync("node scripts/sync-tailwind-cdn-pages.mjs", { cwd: root, stdio: "inherit" });

const softwareRoot = path.join(__dirname, "..", "..");
const genRef = path.join(softwareRoot, "design-tokens", "generate-reference.mjs");
if (fs.existsSync(genRef)) {
  execSync(`node ${JSON.stringify(genRef)}`, { cwd: softwareRoot, stdio: "inherit" });
} else {
  console.warn("apply-p31-style: skip design-token reference —", genRef, "missing");
}
