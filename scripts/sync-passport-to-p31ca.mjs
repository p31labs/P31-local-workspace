#!/usr/bin/env node
/**
 * Copy cognitive-passport/index.html through the p31ca mirror transform into
 * 04_SOFTWARE/p31ca/public/passport-generator.html
 *
 * Run from repo root: node scripts/sync-passport-to-p31ca.mjs
 * Or: cd 04_SOFTWARE/p31ca && npm run passport:sync
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const { toP31caMirror } = await import(
  path.join(root, "04_SOFTWARE/p31ca/scripts/passport-p31ca-transform.mjs")
);
const dest = path.join(root, "04_SOFTWARE", "p31ca", "public", "passport-generator.html");

const explicit = process.env.P31_WORKSPACE_ROOT?.trim();
const candidates = [
  explicit ? path.join(explicit, "cognitive-passport", "index.html") : null,
  path.join(root, "cognitive-passport", "index.html"),
  path.join(root, "..", "cognitive-passport", "index.html"),
].filter(Boolean);

let src = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    src = p;
    break;
  }
}

if (!src) {
  console.error(
    "sync-passport: no cognitive-passport/index.html found. Set P31_WORKSPACE_ROOT or place the repo beside cognitive-passport."
  );
  process.exit(1);
}

const out = toP31caMirror(fs.readFileSync(src, "utf8"));
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, out, "utf8");
console.log("sync-passport: wrote", path.relative(root, dest), "from", path.relative(root, src));
