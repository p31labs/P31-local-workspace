#!/usr/bin/env node
/**
 * Idempotent: add <link rel="manifest" href="/p31-mesh.webmanifest"> to public .html
 * (after the first theme-color meta, else right after <head>).
 * Run: node scripts/ensure-pwa-manifest-link-p31ca-public.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "..", "public");
const HREF = "/p31-mesh.webmanifest";

const SKIP_DIR = new Set(["node_modules", "dist", ".git"]);

function walkHtml(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    if (name.isDirectory() && SKIP_DIR.has(name.name)) continue;
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkHtml(p, out);
    else if (name.name.endsWith(".html")) out.push(p);
  }
}

/** @param {string} html */
function ensureLink(html) {
  if (/\brel=["']manifest["']/.test(html)) return html;
  const line = `  <link rel="manifest" href="${HREF}" crossorigin="anonymous" />\n`;
  const theme = html.match(/<meta[^>]*\bname=["']theme-color["'][^>]*>/i);
  if (theme) {
    return html.replace(theme[0], `${theme[0]}\n${line.trimEnd()}`);
  }
  const i = html.indexOf("<head");
  if (i === -1) return html;
  const j = html.indexOf(">", i);
  if (j === -1) return html;
  return html.slice(0, j + 1) + "\n" + line + html.slice(j + 1);
}

let changed = 0;
const files = [];
walkHtml(PUBLIC, files);
for (const file of files) {
  const before = fs.readFileSync(file, "utf8");
  const after = ensureLink(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    changed += 1;
    console.log("pwa-manifest-link:", path.relative(PUBLIC, file));
  }
}
console.log(
  `ensure-pwa-manifest-link-p31ca-public: ${files.length} html, ${changed} updated`,
);
