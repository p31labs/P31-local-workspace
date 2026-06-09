#!/usr/bin/env node
/**
 * Writes the Worker SPA block in public/_redirects and merges edgeRedirects in ground-truth
 * from scripts/hub/worker-spa-launches.mjs — edit that file, then run:
 *   npm run sync:worker-spa-launch && npm run hub:diff
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WORKER_SPA_LAUNCHES } from "./hub/worker-spa-launches.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, "..");

const BEGIN =
  "# @generated begin worker-spa-launch — do not edit by hand; npm run sync:worker-spa-launch";
const END = "# @generated end worker-spa-launch";

function buildBlock() {
  const lines = WORKER_SPA_LAUNCHES.map(
    (x) => `${x.pathname}  ${x.workersDevUrl}  302`
  );
  return `${BEGIN}\n${lines.join("\n")}\n${END}`;
}

function stripLegacyWorkerRedirects(text) {
  return text
    .replace(
      /\n# Hub registry — Worker SPAs[^\n]*\n(?:[^\n]+\s+https:\/\/[^\n]+\s+302\n)+/,
      "\n"
    )
    .replace(/\s+$/, "");
}

/** @param {string} text */
function patchRedirects(text) {
  const block = buildBlock();
  if (text.includes(BEGIN) && text.includes(END)) {
    const i0 = text.indexOf(BEGIN);
    const i1 = text.indexOf(END) + END.length;
    return `${text.slice(0, i0)}${block}${text.slice(i1)}`.replace(/\n{4,}/g, "\n\n\n");
  }
  const trimmed = stripLegacyWorkerRedirects(text);
  return `${trimmed}\n\n${block}\n`;
}

/** @param {any} gt */
function mergeGroundTruth(gt) {
  const paths = new Set(WORKER_SPA_LAUNCHES.map((e) => e.pathname));
  const filtered = (gt.edgeRedirects || []).filter((e) => !paths.has(e.from));
  const injected = WORKER_SPA_LAUNCHES.map((x) => ({
    from: x.pathname,
    to: x.workersDevUrl,
    status: 302,
  }));
  return { ...gt, edgeRedirects: [...filtered, ...injected] };
}

const redirectsPath = path.join(P31CA, "public", "_redirects");
const gtPath = path.join(P31CA, "ground-truth", "p31.ground-truth.json");

fs.writeFileSync(redirectsPath, patchRedirects(fs.readFileSync(redirectsPath, "utf8")), "utf8");
console.log("sync-worker-spa-launch: wrote", path.relative(P31CA, redirectsPath));

const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));
const merged = mergeGroundTruth(gt);
fs.writeFileSync(gtPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
console.log("sync-worker-spa-launch: wrote", path.relative(P31CA, gtPath));
