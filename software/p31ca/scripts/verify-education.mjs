#!/usr/bin/env node
/**
 * Verifies p31.labsEducationCurriculum/0.2.0 + catalog.json internal links exist under public/.
 * Run: npm run verify:education
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");

// Check registry status — skip verification if concept/draft
const regPath = path.join(p31ca, "scripts", "hub", "registry.mjs");
const { registry } = await import(pathToFileURL(regPath).href);
const edEntry = registry.find(r => r.id === 'education');
if (edEntry && (edEntry.status === 'concept' || edEntry.status === 'draft')) {
  console.log("[ OK ] verify-education: education is " + edEntry.status + " — skipping file check");
  process.exit(0);
}

const pub = path.join(p31ca, "public");
const ed = path.join(pub, "education");

let failed = 0;
function err(m) {
  console.error("verify-education:", m);
  failed = 1;
}

if (!fs.existsSync(ed)) {
  err("missing public/education/");
  process.exit(1);
}

const curPath = path.join(ed, "curriculum.json");
if (!fs.existsSync(curPath)) {
  err("missing public/education/curriculum.json");
  process.exit(1);
}

const curriculum = JSON.parse(fs.readFileSync(curPath, "utf8"));
if (curriculum.schema !== "p31.labsEducationCurriculum/0.2.0") {
  err(`curriculum.json schema: expected p31.labsEducationCurriculum/0.2.0, got ${curriculum.schema}`);
}

function checkHref(href, label) {
  if (typeof href !== "string") {
    err(`${label}: bad href ${href}`);
    return;
  }
  if (href.startsWith("https://") || href.startsWith("http://")) return;
  if (!href.startsWith("/")) {
    err(`${label}: bad href ${href}`);
    return;
  }
  if (href.startsWith("//")) {
    err(`${label}: double-slash href ${href}`);
    return;
  }
  if (href.startsWith("/api/")) return;
  const rel = href.replace(/^\//, "");
  const fp = path.join(pub, rel);
  if (rel.endsWith("/")) {
    if (!fs.existsSync(fp) && !fs.existsSync(path.join(fp, "index.html"))) {
      err(`${label}: missing file for ${href}`);
    }
  } else {
    if (!fs.existsSync(fp)) err(`${label}: missing file for ${href}`);
  }
}

for (const t of curriculum.tracks || []) {
  checkHref(t.href, `track ${t.id || "?"}`);
}
for (const m of curriculum.modules || []) {
  checkHref(m.href, `module ${m.id || "?"}`);
}
for (const l of curriculum.labs || []) {
  checkHref(l.href, `lab ${l.id || "?"}`);
}

const catPath = path.join(ed, "catalog.json");
if (!fs.existsSync(catPath)) {
  err("missing public/education/catalog.json");
} else {
  const cat = JSON.parse(fs.readFileSync(catPath, "utf8"));
  if (cat.schema !== "p31.labsEducationCatalog/0.2.0") {
    err(`catalog.json schema: expected p31.labsEducationCatalog/0.2.0, got ${cat.schema}`);
  }
  for (const e of cat.entries || []) {
    if (e.href) checkHref(e.href, `catalog entry ${e.id || e.title || "?"}`);
  }
}

if (!fs.readFileSync(path.join(ed, "index.html"), "utf8").includes("p31.labsEducation/0.2.0")) {
  err("public/education/index.html must include p31.labsEducation/0.2.0");
}

if (failed) {
  process.exit(1);
}
console.log("verify-education: OK — curriculum + catalog + index schema");
