#!/usr/bin/env node
/**
 * Ensures public/passport-generator.html matches transform(canonical source) when present.
 * Set P31_STRICT_PASSPORT=1 to fail if no cognitive-passport source (e.g. CI with full tree).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { toP31caMirror } from "./passport-p31ca-transform.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31caRoot = path.join(__dirname, "..");
const dest = path.join(p31caRoot, "public", "passport-generator.html");
const strict = process.env.P31_STRICT_PASSPORT === "1";

const explicitRoot = process.env.P31_WORKSPACE_ROOT?.trim();
const candidates = [
  explicitRoot
    ? path.join(explicitRoot, "cognitive-passport", "index.html")
    : null,
  path.join(p31caRoot, "../../../cognitive-passport/index.html"),
  path.join(p31caRoot, "../../cognitive-passport/index.html"),
].filter(Boolean);

let src = null;
for (const p of candidates) {
  if (fs.existsSync(p)) {
    src = p;
    break;
  }
}

if (!src) {
  if (strict) {
    console.error(
      "passport:verify: STRICT — no cognitive-passport/index.html (set P31_WORKSPACE_ROOT or checkout full P31 home)"
    );
    process.exit(1);
  }
  console.log(
    "passport:verify: skip — no cognitive-passport/index.html (set P31_WORKSPACE_ROOT for custom root; P31_STRICT_PASSPORT=1 to fail)"
  );
  process.exit(0);
}

if (!fs.existsSync(dest)) {
  console.error("passport:verify: missing mirror — run: npm run sync:passport (P31 home root)");
  process.exit(1);
}

let expected;
try {
  expected = toP31caMirror(fs.readFileSync(src, "utf8"));
} catch (e) {
  console.error("passport:verify:", e instanceof Error ? e.message : e);
  process.exit(1);
}

const actual = fs.readFileSync(dest, "utf8");
if (actual !== expected) {
  console.error(
    "passport:verify: mirror stale or hand-edited. From P31 home: npm run sync:passport"
  );
  process.exit(1);
}

console.log("passport:verify: OK (matches", path.relative(p31caRoot, src) + ")");
