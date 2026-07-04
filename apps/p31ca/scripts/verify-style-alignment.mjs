#!/usr/bin/env node
/**
 * Enforces design-token use on p31ca static HTML (default: *-about.html in public/).
 * - Links /p31-style.css (or relative p31-style.css)
 * - <html data-p31-appearance="hub" | "org" | "auto"> (or skip marker)
 * - No p31.universal-canon color hex after stylesheet removal, except allowed (meta theme-color, CSS custom property declarations in <style>)
 * - No common off-canon display fonts (Inter, Roboto, …) in font-family in <style> / inline style
 *
 * p31-style-alignment: skip  — in first 25 lines, skip file
 * P31_STYLE_ALIGN_GLOB=all   — all public HTML under public/ (uses style-alignment-exclude.json)
 * P31_STYLE_ALIGN_STRICT=0   — print warnings, exit 0
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const p31caRoot = path.join(__dirname, "..");
const publicDir = path.join(p31caRoot, "public");
const canonPath = path.join(p31caRoot, "..", "design-tokens", "p31-universal-canon.json");
if (!fs.existsSync(publicDir)) {
  console.log("verify-style-alignment: skip — no p31ca public");
  process.exit(0);
}
const excludePath = path.join(__dirname, "style-alignment-exclude.json");
// SCOPE: about-only (default) or all public HTML — see style-alignment-exclude.json
const SCOPE = process.env.P31_STYLE_ALIGN_GLOB || "about-only";
const isStrict = process.env.P31_STYLE_ALIGN_STRICT !== "0";
const HEX_RE = /#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})\b/g;

const BANNED_DISPLAY_FONTS =
  /\b(Inter|Roboto|Nunito|Open Sans|Lato|Montserrat|Merriweather|DM Sans|Poppins|Source Sans|Raleway|Ubuntu|Oswald|Noto Sans|Fira Sans|Work Sans|Playfair|Crimson Text)\b/;

function normalizeHex(s) {
  if (!s.startsWith("#")) s = "#" + s;
  const m = s.match(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return h.toLowerCase();
}

function collectHexFromCanon(node, acc = new Set()) {
  if (node == null) return acc;
  if (typeof node === "string" && node.startsWith("#")) {
    const n = normalizeHex(node);
    if (n) acc.add(n);
  } else if (Array.isArray(node)) {
    for (const x of node) collectHexFromCanon(x, acc);
  } else if (typeof node === "object") {
    for (const v of Object.values(node)) collectHexFromCanon(v, acc);
  }
  return acc;
}

function loadExcludes() {
  if (!fs.existsSync(excludePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(excludePath, "utf8")).globs || [];
  } catch {
    return [];
  }
}

function isExcluded(relPosix, globs) {
  for (const g of globs) {
    if (!g || g.startsWith("#")) continue;
    if (g.includes("*")) {
      const re = new RegExp(
        "^" + g.replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\\/g, "\\\\") + "$",
      );
      if (re.test(relPosix)) return true;
    } else if (relPosix === g) return true;
  }
  return false;
}

function listHtmlFiles() {
  if (SCOPE === "all") {
    const out = [];
    const walk = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.isFile() && e.name.endsWith(".html")) out.push(p);
      }
    };
    walk(publicDir);
    return out;
  }
  return fs
    .readdirSync(publicDir)
    .filter((n) => n.endsWith("-about.html"))
    .map((n) => path.join(publicDir, n));
}

/**
 * Build allow-list of hexes that may appear in file (only valid uses).
 */
function collectAllowedHex(html) {
  const allowed = new Set();
  for (const m of html.matchAll(/--[a-zA-Z0-9-]+\s*:\s*#([0-9A-Fa-f]{3,8})/g)) {
    const n = normalizeHex("#" + m[1]);
    if (n) allowed.add(n);
  }
  for (const m of html.matchAll(/<meta\s[^>]*>/gi)) {
    const tag = m[0];
    if (!/name=["']theme-color["']/i.test(tag)) continue;
    const c = tag.match(/content=(["'])(#\S+?)\1/i);
    if (c) {
      const n = normalizeHex(c[2].replace(/["'].*/, ""));
      if (n) allowed.add(n);
    }
  }
  for (const m of html.matchAll(
    /<!--\s*p31-style-alignment:\s*allow-hex\s+(#\S+?)(?:\s*[-—]|$|\s*-->)/g,
  )) {
    const n = normalizeHex(m[1].replace(/[>\s].*/, ""));
    if (n) allowed.add(n);
  }
  return allowed;
}

function scanHexAfterStyleRemoved(html, relPath, canonHex, allowed) {
  const v = [];
  const stripped = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ");
  for (const m of stripped.matchAll(HEX_RE)) {
    const n = normalizeHex(m[0]);
    if (!n || !canonHex.has(n)) continue;
    if (allowed.has(n)) continue;
    v.push({
      file: relPath,
      type: "canon-hex",
      detail: `canon hex ${m[0]} must not appear outside <style> custom props (use var(--p31-*)) — ${stripSnippet(stripped, m.index)}`,
    });
  }
  return v;
}

function stripSnippet(s, i) {
  return s.slice(Math.max(0, i - 24), i + 48).replace(/\s+/g, " ").trim();
}

function hasStylesheetLink(html) {
  return /href=(["'])(?:\/)?p31-style\.css\1/.test(html);
}

function hasAppearanceOnHtml(html) {
  if (!/<\s*html[\s>]/i.test(html)) return false;
  return /data-p31-appearance=(["'])(?:hub|org|auto)\1/i.test(html);
}

function fontScan(html, relPath) {
  const v = [];
  if (BANNED_DISPLAY_FONTS.test(html) && /font-family/i.test(html)) {
    for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) {
      for (const line of m[1].split("\n")) {
        if (!/font-family/i.test(line)) continue;
        if (BANNED_DISPLAY_FONTS.test(line) && !/JetBrains|Atkinson|var\s*\(/.test(line)) {
          v.push({ file: relPath, type: "font", detail: `banned family in <style>: ${line.trim()}` });
        }
      }
    }
    for (const m of html.matchAll(/\bstyle=(["'])([^"']*)\1/gi)) {
      if (BANNED_DISPLAY_FONTS.test(m[2]) && /font-family/i.test(m[2])) {
        v.push({ file: relPath, type: "font", detail: `banned family in inline style` });
      }
    }
  }
  return v;
}

function shouldSkipFile(html) {
  const head = html.split("\n").slice(0, 30).join("\n");
  return head.includes("p31-style-alignment: skip");
}

function relPublic(abs) {
  return path.relative(publicDir, abs).replace(/\\/g, "/");
}

function main() {
  if (!fs.existsSync(canonPath)) {
    console.log("verify-style-alignment: skip — no", canonPath);
    process.exit(0);
  }
  const canonHex = collectHexFromCanon(JSON.parse(fs.readFileSync(canonPath, "utf8")));
  const ex = loadExcludes();
  const allViol = [];
  const files = listHtmlFiles();
  for (const file of files) {
    const rel = relPublic(file);
    if (isExcluded(rel, ex)) continue;
    const html = fs.readFileSync(file, "utf8");
    if (shouldSkipFile(html)) continue;
    if (!hasStylesheetLink(html)) {
      allViol.push({ file: rel, type: "stylesheet", detail: "missing <link> to p31-style.css" });
    }
    if (!hasAppearanceOnHtml(html)) {
      allViol.push({
        file: rel,
        type: "appearance",
        detail: 'add <html lang="en" data-p31-appearance="hub"> (or org) before body content',
      });
    }
    const allowed = collectAllowedHex(html);
    allViol.push(...scanHexAfterStyleRemoved(html, rel, canonHex, allowed));
    allViol.push(...fontScan(html, rel));
  }

  if (allViol.length) {
    console.error("verify-style-alignment: failed —");
    for (const e of allViol) console.error(`  [${e.type}] ${e.file}: ${e.detail}`);
    if (isStrict) process.exit(1);
  }
  console.log(
    `verify-style-alignment: OK — ${files.filter((f) => !isExcluded(relPublic(f), ex)).length} file(s) (scope: ${SCOPE === "all" || process.env.P31_STYLE_ALIGN_GLOB === "all" ? "all public/**/*.html" : "*-about.html"})`,
  );
  process.exit(0);
}

main();
