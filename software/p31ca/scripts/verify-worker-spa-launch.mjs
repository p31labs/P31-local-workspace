#!/usr/bin/env node
/**
 * Ensures worker-spa-launches.mjs, registry appUrls, _redirects, and ground-truth agree.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  WORKER_SPA_LAUNCHES,
  appUrlForWorkerSpa,
} from "./hub/worker-spa-launches.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, "..");

const redirectsPath = path.join(P31CA, "public", "_redirects");
const gtPath = path.join(P31CA, "ground-truth", "p31.ground-truth.json");
const regPath = path.join(P31CA, "scripts", "hub", "registry.mjs");

function parseRedirects(raw) {
  const out = [];
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const parts = t.split(/\s+/).filter(Boolean);
    if (parts.length >= 3) {
      const code = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(code)) {
        const to = parts[parts.length - 2];
        const from = parts.slice(0, -2).join(" ");
        out.push({ from, to, status: code });
      }
    }
  }
  return out;
}

let errs = 0;
function fail(m) {
  errs++;
  console.error("[FAIL] verify-worker-spa-launch:", m);
}

const { registry } = await import(pathToFileURL(regPath).href);

const parsed = parseRedirects(fs.readFileSync(redirectsPath, "utf8"));
const gt = JSON.parse(fs.readFileSync(gtPath, "utf8"));

for (const row of WORKER_SPA_LAUNCHES) {
  const expectedApp = appUrlForWorkerSpa(row.id);
  const entry = registry.find((r) => r.id === row.id);
  if (!entry) {
    fail(`registry missing id "${row.id}"`);
    continue;
  }
  if (entry.appUrl !== expectedApp) {
    fail(`registry.${row.id} appUrl: want "${expectedApp}", got "${entry.appUrl}"`);
  }
  const pr = parsed.find((p) => p.from === row.pathname && p.status === 302);
  if (
    !pr ||
    pr.to !== row.workersDevUrl ||
    pr.from !== row.pathname ||
    pr.status !== 302
  ) {
    fail(
      `public/_redirects missing or wrong "${row.pathname} → ${row.workersDevUrl} 302" — npm run sync:worker-spa-launch`
    );
  }
  const ge = (gt.edgeRedirects || []).find(
    (e) => e.from === row.pathname && e.status === 302
  );
  if (!ge || ge.to !== row.workersDevUrl || ge.from !== row.pathname) {
    fail(
      `ground-truth edgeRedirects missing "${row.pathname}" Spa row — npm run sync:worker-spa-launch`
    );
  }
}

if (errs > 0) {
  process.exit(1);
}
console.log(
  `[ OK ] verify-worker-spa-launch: ${WORKER_SPA_LAUNCHES.length} Worker SPA launches (registry + _redirects + ground-truth) ✓`
);
