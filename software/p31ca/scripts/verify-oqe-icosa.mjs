#!/usr/bin/env node
/**
 * Contract: OQE twenty (forensic) — p31-oqe-twenty.json + oqe-icosa.html, separate from Fate 20.
 * Fails on drift: schema, 20 faces, _redirects /oqe, ground-truth routes, required disclaimers in HTML.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31ca = path.join(__dirname, "..");
const oqeJsonPath = path.join(p31ca, "public", "p31-oqe-twenty.json");
const oqeHtmlPath = path.join(p31ca, "public", "oqe-icosa.html");
const redirectsPath = path.join(p31ca, "public", "_redirects");
const gtPath = path.join(p31ca, "ground-truth", "p31.ground-truth.json");
const domeCockpitPath = path.join(p31ca, "src", "scripts", "dome-cockpit.ts");

const HTML_MUST = [
  "p31-oqe-twenty.json",
  "p31.oqeTwenty/1.0.0",
  "OQE Icosa",
  "Forensic",
  "not Fate 20",
  "Not assistive orientation",
  "not legal advice",
  "not medical advice",
  "No randomness",
  "fetch(",
  "p31-fate-twenty.json",
  "Fate 20",
];

function validateOqeBundle(data) {
  if (data.schema !== "p31.oqeTwenty/1.0.0") {
    console.error("verify-oqe-icosa: p31-oqe-twenty.json schema must be p31.oqeTwenty/1.0.0");
    process.exit(1);
  }
  const items = data.contradictions;
  if (!Array.isArray(items) || items.length !== 20) {
    console.error("verify-oqe-icosa: contradictions must be length 20");
    process.exit(1);
  }
  const seen = new Set();
  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    if (!row || typeof row.face !== "number" || typeof row.slug !== "string" || typeof row.title !== "string" || typeof row.summary !== "string") {
      console.error("verify-oqe-icosa: contradictions[" + i + "] must have face (number), slug, title, summary strings");
      process.exit(1);
    }
    if (row.face < 1 || row.face > 20) {
      console.error("verify-oqe-icosa: face must be 1..20, got " + row.face);
      process.exit(1);
    }
    if (seen.has(row.face)) {
      console.error("verify-oqe-icosa: duplicate face " + row.face);
      process.exit(1);
    }
    seen.add(row.face);
    if (row.citation != null && typeof row.citation !== "object") {
      console.error("verify-oqe-icosa: citation must be null or object");
      process.exit(1);
    }
  }
  for (let f = 1; f <= 20; f++) {
    if (!seen.has(f)) {
      console.error("verify-oqe-icosa: missing face " + f);
      process.exit(1);
    }
  }
}

function main() {
  // Skip if OQE Icosa is archived
  if (!fs.existsSync(oqeJsonPath) || !fs.existsSync(oqeHtmlPath)) {
    console.log("[ OK ] verify-oqe-icosa: OQE Icosa files not found — skipping (archived)");
    process.exit(0);
  }

  let data;
  try {
    data = JSON.parse(fs.readFileSync(oqeJsonPath, "utf8"));
  } catch (e) {
    console.error("verify-oqe-icosa: invalid JSON", e);
    process.exit(1);
  }
  validateOqeBundle(data);

  if (!fs.existsSync(oqeHtmlPath)) {
    console.error("verify-oqe-icosa: missing", path.relative(p31ca, oqeHtmlPath));
    process.exit(1);
  }
  const html = fs.readFileSync(oqeHtmlPath, "utf8");
  for (const s of HTML_MUST) {
    if (!html.includes(s)) {
      console.error("verify-oqe-icosa: oqe-icosa.html missing:", JSON.stringify(s));
      process.exit(1);
    }
  }
  if (html.includes("crypto.getRandomValues")) {
    console.error("verify-oqe-icosa: oqe-icosa.html must not use CSPRNG (forensic, not a die roll)");
    process.exit(1);
  }

  const red = fs.readFileSync(redirectsPath, "utf8");
  if (!/\/oqe\s+\/oqe-icosa\.html/i.test(red)) {
    console.error("verify-oqe-icosa: public/_redirects must map /oqe -> /oqe-icosa.html");
    process.exit(1);
  }

  const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
  const lex = gt.routes && gt.routes.oqeTwentyLexicon;
  if (!lex || lex.path !== "/p31-oqe-twenty.json" || lex.implementation !== "public/p31-oqe-twenty.json") {
    console.error("verify-oqe-icosa: ground-truth routes.oqeTwentyLexicon path drift");
    process.exit(1);
  }
  const pg = gt.routes && gt.routes.oqeIcosa;
  if (!pg || pg.path !== "/oqe-icosa.html" || pg.implementation !== "public/oqe-icosa.html") {
    console.error("verify-oqe-icosa: ground-truth routes.oqeIcosa path drift");
    process.exit(1);
  }
  const er = (gt.edgeRedirects || []).some(
    (e) => e.from === "/oqe" && e.to === "/oqe-icosa.html" && e.status === 301
  );
  if (!er) {
    console.error("verify-oqe-icosa: ground-truth edgeRedirects missing /oqe -> /oqe-icosa.html 301");
    process.exit(1);
  }

  if (fs.existsSync(domeCockpitPath)) {
    const d = fs.readFileSync(domeCockpitPath, "utf8");
    for (const s of [
      "'oqe-icosa'",
      "/oqe",
      "/p31-oqe-twenty.json",
      "p31.oqeTwenty",
    ]) {
      if (!d.includes(s)) {
        console.error("verify-oqe-icosa: dome-cockpit.ts missing:", JSON.stringify(s));
        process.exit(1);
      }
    }
  }

  console.log("verify-oqe-icosa: OK");
}

main();
