#!/usr/bin/env node
/**
 * apply-smart-features — injects canonical P31 smart features into all public HTML pages.
 *
 * Features injected (idempotent — skips if already present):
 *   HEAD:
 *     1. /lib/p31-qmu-tokens.css           (before /p31-style.css)
 *     2. /p31-shared-surface.css           (after /p31-style.css)
 *     3. /p31-responsive-surface.css       (after shared-surface)
 *     4. /lib/p31-subject-prefs.js         (before </head>)
 *   BODY START (after <body…>):
 *     5. #starfield-canvas                 (fixed ambient star layer)
 *     6. .p31-skip-link                    (a11y skip-to-main)
 *     7. .p31-top-bar header               (canonical brand strip)
 *   BODY END (before </body>):
 *     8. starfield init module             (pairs with canvas)
 *     9. /lib/atmosphere/p31-atmosphere-client.js
 *    10. /lib/p31-return-ribbon.js
 *
 * Run:  node scripts/apply-smart-features.mjs
 *       DRY=1 node scripts/apply-smart-features.mjs   (print diffs, no writes)
 *
 * After running: npm run verify:surface-canon to confirm 100% compliance.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const DRY = process.env.DRY === "1";

// Pages to skip entirely (have bespoke layouts that need manual migration)
const SKIP = new Set([
  "passport-generator.html",  // has custom starfield, custom atmosphere boot
]);

// ── Snippet library ────────────────────────────────────────────────────────────

const SNIP_QMU_TOKENS = `  <link rel="stylesheet" href="/lib/p31-qmu-tokens.css" />\n`;

const SNIP_SHARED_SURFACE = `  <link rel="stylesheet" href="/p31-shared-surface.css" />\n`;

const SNIP_RESPONSIVE = `  <link rel="stylesheet" href="/p31-responsive-surface.css" />\n`;

const SNIP_SUBJECT_PREFS = `  <script src="/lib/p31-subject-prefs.js"></script>\n`;

const SNIP_STARFIELD_CANVAS = `\n  <!-- Starfield ambient layer (Gray Rock until interaction) -->\n  <canvas id="starfield-canvas" style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:0;pointer-events:none;opacity:0.45;" aria-hidden="true"></canvas>\n`;

const SNIP_SKIP_LINK = `\n  <a class="p31-skip-link" href="#main">Skip to content</a>\n`;

const SNIP_TOP_BAR = `\n  <!-- ── Top app bar ──────────────────────────────────────────────────────── -->\n  <header class="p31-q-surface p31-top-bar" data-p31-elev="2" role="banner">\n    <a href="/" class="p31-top-bar__wordmark" aria-label="P31 Labs home">P31 <span class="p31-top-bar__accent">Labs</span></a>\n    <nav class="p31-top-bar__nav" aria-label="Global">\n      <a href="/hub.html">Hub</a>\n      <a href="/connect.html">Connect</a>\n    </nav>\n  </header>\n`;

const SNIP_STARFIELD_INIT = `\n  <!-- Starfield init -->\n  <script type="module">\n    const cv = document.getElementById("starfield-canvas");\n    if (cv) {\n      import("/lib/p31-starfield-static-plate.js")\n        .then(({ initStaticStarPlate }) => initStaticStarPlate(cv, { preset: "hub" }))\n        .catch(() => {});\n    }\n  </script>\n`;

const SNIP_ATMOSPHERE = `  <script src="/lib/atmosphere/p31-atmosphere-client.js" defer></script>\n`;

const SNIP_RETURN_RIBBON = `  <script src="/lib/p31-return-ribbon.js" defer></script>\n`;

// ── Helpers ────────────────────────────────────────────────────────────────────

function has(html, needle) {
  return html.includes(needle);
}

/** Insert text immediately before the first occurrence of `marker` in html. */
function insertBefore(html, marker, text) {
  const idx = html.indexOf(marker);
  if (idx === -1) return html;
  return html.slice(0, idx) + text + html.slice(idx);
}

/** Insert text immediately after the first occurrence of `marker` in html. */
function insertAfter(html, marker, text) {
  const idx = html.indexOf(marker);
  if (idx === -1) return html;
  const end = idx + marker.length;
  return html.slice(0, end) + text + html.slice(end);
}

/** Find the closing `>` of the opening `<body` tag (handles attributes). */
function insertAfterBodyOpen(html, text) {
  const bodyMatch = html.match(/<body[^>]*>/);
  if (!bodyMatch) return html;
  const end = bodyMatch.index + bodyMatch[0].length;
  return html.slice(0, end) + text + html.slice(end);
}

// ── Main ───────────────────────────────────────────────────────────────────────

const htmlFiles = fs.readdirSync(publicDir)
  .filter(f => f.endsWith(".html") && !SKIP.has(f))
  .sort();

let changed = 0;
let skipped = 0;

for (const file of htmlFiles) {
  const filePath = path.join(publicDir, file);
  const original = fs.readFileSync(filePath, "utf8");
  let html = original;

  // ── 1. QMU tokens ─────────────────────────────────────────────────────────
  if (!has(html, "p31-qmu-tokens.css")) {
    if (has(html, "/p31-style.css")) {
      // Insert before the first p31-style.css link
      html = insertBefore(html, '<link rel="stylesheet" href="/p31-style.css"', SNIP_QMU_TOKENS);
    } else {
      html = insertBefore(html, "</head>", SNIP_QMU_TOKENS);
    }
  }

  // ── 2. Shared surface ─────────────────────────────────────────────────────
  if (!has(html, "p31-shared-surface.css")) {
    // Insert after the p31-style.css link line
    const styleTag = html.match(/<link[^>]*href="\/p31-style\.css"[^>]*>/);
    if (styleTag) {
      html = insertAfter(html, styleTag[0], "\n" + SNIP_SHARED_SURFACE);
    } else {
      html = insertBefore(html, "</head>", SNIP_SHARED_SURFACE);
    }
  }

  // ── 3. Responsive surface ─────────────────────────────────────────────────
  if (!has(html, "p31-responsive-surface.css")) {
    // Insert after shared-surface if present, else before </head>
    if (has(html, "p31-shared-surface.css")) {
      const sharedTag = html.match(/<link[^>]*href="\/p31-shared-surface\.css"[^>]*>/);
      if (sharedTag) {
        html = insertAfter(html, sharedTag[0], "\n" + SNIP_RESPONSIVE);
      } else {
        html = insertBefore(html, "</head>", SNIP_RESPONSIVE);
      }
    } else {
      html = insertBefore(html, "</head>", SNIP_RESPONSIVE);
    }
  }

  // ── 4. Subject prefs ──────────────────────────────────────────────────────
  if (!has(html, "p31-subject-prefs.js")) {
    html = insertBefore(html, "</head>", SNIP_SUBJECT_PREFS);
  }

  // ── 5. Starfield canvas ───────────────────────────────────────────────────
  if (!has(html, "starfield-canvas")) {
    html = insertAfterBodyOpen(html, SNIP_STARFIELD_CANVAS);
  }

  // ── 6. Skip link ──────────────────────────────────────────────────────────
  if (!has(html, "p31-skip-link")) {
    // Insert after starfield canvas (or after body open)
    if (has(html, "starfield-canvas")) {
      // Find canvas line and insert after it
      const canvasMatch = html.match(/<canvas[^>]*id="starfield-canvas"[^>]*><\/canvas>/);
      if (canvasMatch) {
        html = insertAfter(html, canvasMatch[0], SNIP_SKIP_LINK);
      } else {
        html = insertAfterBodyOpen(html, SNIP_SKIP_LINK);
      }
    } else {
      html = insertAfterBodyOpen(html, SNIP_SKIP_LINK);
    }
  }

  // ── 7. Top bar ────────────────────────────────────────────────────────────
  if (!has(html, "p31-top-bar")) {
    if (has(html, "p31-skip-link")) {
      // Insert after skip link
      html = insertAfter(html, 'href="#main">Skip to content</a>', SNIP_TOP_BAR);
    } else {
      html = insertAfterBodyOpen(html, SNIP_TOP_BAR);
    }
  }

  // ── 8. Starfield init script ──────────────────────────────────────────────
  if (!has(html, "p31-starfield") && has(html, "starfield-canvas")) {
    html = insertBefore(html, "</body>", SNIP_STARFIELD_INIT);
  }

  // ── 9. Atmosphere client ──────────────────────────────────────────────────
  if (!has(html, "p31-atmosphere-client")) {
    html = insertBefore(html, "</body>", SNIP_ATMOSPHERE);
  }

  // ── 10. Return ribbon ─────────────────────────────────────────────────────
  if (!has(html, "p31-return-ribbon")) {
    html = insertBefore(html, "</body>", SNIP_RETURN_RIBBON);
  }

  // ── Write (or dry-run) ────────────────────────────────────────────────────
  if (html === original) {
    skipped++;
    continue;
  }

  changed++;
  if (DRY) {
    console.log(`[DRY] ${file} — would modify`);
  } else {
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`  ✓  ${file}`);
  }
}

console.log(`\napply-smart-features: ${changed} modified · ${skipped} already compliant · ${SKIP.size} skipped (manual)`);
if (DRY) console.log("DRY RUN — no files written. Remove DRY=1 to apply.");
