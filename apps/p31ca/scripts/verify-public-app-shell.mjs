#!/usr/bin/env node
/**
 * Production shell: every hub registry static app (relative appUrl) must ship a consistent
 * document head so tokens, a11y baselines, and hub integration stay uniform.
 *
 * Requires: DOCTYPE, html[lang], UTF-8, viewport, non-empty <title>, /p31-style.css
 * Skips: external https appUrl, integrations (Astro route only in dist)
 *
 * Run: node scripts/verify-public-app-shell.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const P31CA = path.join(__dirname, "..");
const PUBLIC = path.join(P31CA, "public");

const regPath = path.join(P31CA, "scripts", "hub", "registry.mjs");
const { registry } = await import(pathToFileURL(regPath).href);

const SKIP_STATUSES = new Set(["concept", "draft"]);

let errs = 0;
function fail(m) {
  console.error("[FAIL] verify-public-app-shell:", m);
  errs++;
}

function verifyShell(relPath, id) {
  const target = path.join(PUBLIC, relPath);
  const s = fs.readFileSync(target, "utf8");
  const head = s.slice(0, 24000);
  if (!/<!DOCTYPE\s+html/i.test(head)) fail(`${id}: missing <!DOCTYPE html>`);
  if (!/<html[^>]*\blang\s*=\s*["'][^"']+["']/i.test(head)) {
    fail(`${id}: missing html lang`);
  }
  if (!/charset\s*=\s*["']?utf-8/i.test(head)) fail(`${id}: missing UTF-8 charset`);
  if (!/name\s*=\s*["']viewport["']/i.test(head)) fail(`${id}: missing viewport meta`);
  if (!/<title>\s*[^<\s][\s\S]*?<\/title>/i.test(head)) fail(`${id}: missing or empty <title>`);
  if (!/href\s*=\s*["']\/p31-style\.css["']/i.test(head)) {
    fail(`${id}: missing <link href="/p31-style.css"> (universal canon)`);
  }
}

for (const item of registry) {
  if (SKIP_STATUSES.has(item.status)) continue;
  const u = String(item.appUrl ?? "").trim();
  // External URLs — skip
  if (/^https?:\/\//i.test(u)) continue;
  // Absolute paths starting with '/' — Astro routes; head checks run via verify-surface-canon
  if (u.startsWith("/")) continue;
  const target = path.join(PUBLIC, u);
  if (!fs.existsSync(target)) {
    fail(`${item.id}: appUrl "${item.appUrl}" — file missing (also caught by verify-registry-app-urls)`);
    continue;
  }
  try {
    verifyShell(u, item.id);
  } catch (e) {
    fail(`${item.id}: ${e instanceof Error ? e.message : e}`);
  }
}

if (errs > 0) {
  console.error(`verify-public-app-shell: ${errs} failure(s)`);
  process.exit(1);
}
console.log(
  `[ OK ] verify-public-app-shell: static registry Launch targets carry /p31-style.css + baseline head ✓`
);
