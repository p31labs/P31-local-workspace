#!/usr/bin/env node
/**
 * apply-canonical-chrome — Complete chrome rewrite for all non-about public pages.
 *
 * STRIPS from every page (Step A — runs on all pages including about):
 *   - <canvas id="starfield-canvas"> + Starfield ambient layer comment
 *   - <a class="p31-skip-link"> injected skip link
 *   - <!-- Top app bar --> comment + <header class="...p31-top-bar"...> block
 *   - Old skip-to-main <a href="#main" style="position:absolute;left:-9999px;...>
 *   - Starfield init <!-- comment --> + <script> block
 *
 * STRIPS original bespoke navs (Step B — non-about pages only):
 *   - <header class="w-full border-b...backdrop-blur-sm sticky top-0...">
 *   - <header class="shrink-0 border-b...backdrop-blur-sm">
 *   - <nav class="sticky top-0 z-50 border-b...backdrop-blur-sm">
 *   - <nav id="navbar"> containing class="nav-logo"
 *   - <header> containing class="logo" (plain logo nav pattern)
 *
 * INJECTS after <body>:
 *   <div class="ambient-radial-fixed" aria-hidden="true"></div>
 *   <nav class="nav"> canonical P31 brand + Hub + GitHub + Connect </nav>
 *
 * ENSURES before </body>:
 *   P31:mission-ebc footer · atmosphere client · return ribbon
 *
 * FIXES: /public/lib/ paths → /lib/
 *
 * Run: node scripts/apply-canonical-chrome.mjs
 *      DRY=1 node scripts/apply-canonical-chrome.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const DRY = process.env.DRY === "1";

// Pages that are skipped for chrome injection (Step B only — Step A runs on ALL)
const SKIP_CHROME = new Set([
  "passport-generator.html",
  "404.html",
]);

// ── Canonical starfield block ──────────────────────────────────────────────────
const STARFIELD_BLOCK = `<canvas id="p31-star-plate" width="4" height="4" aria-hidden="true" style="position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;display:block"></canvas>
<script type="module">
  const cv = document.getElementById("p31-star-plate");
  if (cv instanceof HTMLCanvasElement) {
    try {
      const mod = await import("/lib/p31-starfield-live.js");
      mod.initLiveStarfield(cv, { preset: "hub" });
    } catch (_e) { /* offline-friendly */ }
  }
</script>`;

// ── Canonical nav HTML ─────────────────────────────────────────────────────────
const CANONICAL_NAV = `<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="nav-brand" title="P31 Labs hub">
      <span class="nav-mark" aria-hidden="true">P31</span>
      <span class="nav-brand-label">P31 Labs</span>
    </a>
    <div class="nav-links">
      <span class="nav-prompt" aria-hidden="true">..</span>
      <a href="/" class="nav-link">Hub</a>
      <a href="https://github.com/p31labs/andromeda" target="_blank" rel="noopener" class="nav-link">GitHub</a>
      <a href="/connect.html" class="nav-link">Connect</a>
    </div>
  </div>
</nav>`;

// ── EBC Footer (from generate-about-pages.mjs) ────────────────────────────────
const EBC_FOOTER = `<!-- P31:mission-ebc:start -->
<footer id="ebc" class="p31-mission-trio p31-mission-trio--ebc" role="contentinfo" aria-label="Mission — build, create, connect">
  <a class="p31-mission-trio__link p31-mission-trio__link--build p31-mesh-tap" id="ebc-build" href="/build" title="Initial Build — intake, subject scope, verify-gated bake">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Build</span>
    </span>
    <span class="p31-mission-trio__desc">Intake and bake on the same verify chain—not a decoupled mock.</span>
  </a>
  <a class="p31-mission-trio__link p31-mission-trio__link--create p31-mesh-tap" id="ebc-create" href="/geodesic.html" title="GEODESIC — snap grid, Maxwell rigidity, scene export">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Create</span>
    </span>
    <span class="p31-mission-trio__desc">One lab surface, honest rigidity—generate or prove; don't fork the same truth twice (ephemeralization).</span>
  </a>
  <a class="p31-mission-trio__link p31-mission-trio__link--connect p31-mesh-tap" id="ebc-connect" href="/mesh" title="Mesh navigator — K₄ cage and product graph">
    <span class="p31-mission-trio__head">
      <span class="p31-mission-trio__dot" aria-hidden="true"></span>
      <span class="p31-mission-trio__verb">Connect</span>
    </span>
    <span class="p31-mission-trio__desc"><span class="p31-mission-trio__now">Now</span> — live cage and edges: mesh, hubs, and money follow the same published contracts (ethical monetization).</span>
  </a>
</footer>
<!-- P31:mission-ebc:end -->`;

// ── Step A: Removal helpers ────────────────────────────────────────────────────

/**
 * Remove the injected top-bar header block.
 * Matches: <header class="p31-q-surface p31-top-bar" ...>...</header>
 * This is a multiline greedy match — we find the opening tag and then
 * scan forward for the matching </header>.
 */
function removeTopBar(html) {
  // Find the injected header. It always starts with this pattern.
  const startMarker = '<header class="p31-q-surface p31-top-bar"';
  let idx = html.indexOf(startMarker);
  while (idx !== -1) {
    // Find the closing </header>
    const closeTag = "</header>";
    const closeIdx = html.indexOf(closeTag, idx);
    if (closeIdx === -1) break;
    const end = closeIdx + closeTag.length;
    // Also eat any trailing newlines
    let afterEnd = end;
    while (afterEnd < html.length && (html[afterEnd] === "\n" || html[afterEnd] === "\r")) {
      afterEnd++;
    }
    html = html.slice(0, idx) + html.slice(afterEnd);
    idx = html.indexOf(startMarker);
  }
  return html;
}

/**
 * Remove the injected canvas + its leading comment.
 * Patterns:
 *   <!-- Starfield ambient layer (Gray Rock until interaction) -->\n
 *   <canvas id="starfield-canvas" …></canvas>\n
 */
function removeStarfieldCanvas(html) {
  // Remove the comment line
  html = html.replace(/[ \t]*<!-- Starfield ambient layer[^\n]*-->\n?/g, "");
  // Remove self-closing single-line canvas
  html = html.replace(/[ \t]*<canvas id="starfield-canvas"[^>]*><\/canvas>\n?/g, "");
  // Remove multi-line canvas: <canvas id="starfield-canvas" ...>\n  </canvas>
  html = html.replace(/[ \t]*<canvas id="starfield-canvas"[^>]*>\s*<\/canvas>\n?/g, "");
  return html;
}

/**
 * Remove injected <!-- ── Top app bar … --> comment lines.
 */
function removeTopBarComment(html) {
  html = html.replace(/[ \t]*<!-- ── Top app bar[^\n]*-->\n?/g, "");
  return html;
}

/**
 * Remove injected <!-- Starfield init --> comment lines.
 */
function removeStarfieldInitComment(html) {
  html = html.replace(/[ \t]*<!-- Starfield init -->\n?/g, "");
  return html;
}

/**
 * Remove the starfield init <script type="module"> block.
 * This block contains "starfield-canvas" and "initStaticStarPlate".
 * It may span multiple lines.
 */
function removeStarfieldInit(html) {
  // Match: optional whitespace + <!-- Starfield init --> comment + newline + <script ...>...</script>
  // The script block has type="module" and contains starfield-canvas
  const scriptOpenRe = /<script type="module">/g;
  let match;
  while ((match = scriptOpenRe.exec(html)) !== null) {
    const start = match.index;
    const closeTag = "</script>";
    const closeIdx = html.indexOf(closeTag, start);
    if (closeIdx === -1) continue;
    const block = html.slice(start, closeIdx + closeTag.length);
    if (block.includes("starfield-canvas") && (block.includes("initStaticStarPlate") || block.includes("initLiveStarfield"))) {
      // Eat leading whitespace/newlines and trailing newline
      let realStart = start;
      // eat leading whitespace on that line
      while (realStart > 0 && html[realStart - 1] === " ") realStart--;
      if (realStart > 0 && html[realStart - 1] === "\n") realStart--;
      let realEnd = closeIdx + closeTag.length;
      while (realEnd < html.length && (html[realEnd] === "\n" || html[realEnd] === "\r")) realEnd++;
      html = html.slice(0, realStart) + html.slice(realEnd);
      // Reset regex since string changed
      scriptOpenRe.lastIndex = 0;
    }
  }
  return html;
}

/**
 * Remove injected <a class="p31-skip-link" href="#main">Skip to content</a>.
 * Only removes the EXACT injected form (class="p31-skip-link").
 * Does NOT remove other skip links that pages may have.
 */
function removeInjectedSkipLink(html) {
  html = html.replace(/[ \t]*<a class="p31-skip-link" href="#main">Skip to content<\/a>\n?/g, "");
  return html;
}

/**
 * Remove the old pre-injection skip-to-main link.
 * Pattern: <a href="#main" style="position:absolute;left:-9999px;...>Skip to main content</a>
 */
function removeOldSkipLink(html) {
  html = html.replace(/[ \t]*<a [^>]*left:-9999px[^>]*>Skip to main content<\/a>\n?/g, "");
  return html;
}

/**
 * Fix wrong /public/lib/ path references → /lib/
 * These appear in agents.html and similar pages that used wrong paths.
 */
function fixPublicLibPaths(html) {
  return html.replace(/\/public\/lib\//g, "/lib/");
}

/**
 * Fix broken starfield import paths.
 * /design-assets/starfield/p31-starfield-static-plate.js → /lib/p31-starfield-static-plate.js
 * ./design-assets/starfield/p31-starfield-static-plate.js → /lib/p31-starfield-static-plate.js
 */
function fixStarfieldPaths(html) {
  return html
    .replace(/\.?\/design-assets\/starfield\/p31-starfield-static-plate\.js/g, "/lib/p31-starfield-static-plate.js");
}

/**
 * Remove depth-aware HTML block starting at startIndex.
 * tagName: 'header' | 'nav'
 * Returns modified html.
 */
function stripBlock(html, startIndex, tagName) {
  const closeTag = `</${tagName}>`;
  const openTagEnd = html.indexOf(">", startIndex);
  if (openTagEnd === -1) return html;
  let pos = openTagEnd + 1;
  let depth = 1;

  while (pos < html.length && depth > 0) {
    const nextOpen = html.indexOf(`<${tagName}`, pos);
    const nextClose = html.indexOf(closeTag, pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Verify it's actually an opening tag (not e.g. <headers>)
      const charAfter = html[nextOpen + tagName.length + 1];
      if (charAfter === " " || charAfter === "\t" || charAfter === "\n" || charAfter === ">" || charAfter === "/") {
        depth++;
      }
      pos = nextOpen + 1;
    } else {
      depth--;
      pos = nextClose + closeTag.length;
    }
  }
  const endIndex = pos;

  // Find line start for clean removal
  let lineStart = startIndex;
  while (lineStart > 0 && html[lineStart - 1] !== "\n") lineStart--;

  const beforeStrip = html.slice(0, lineStart).replace(/\s+$/, "");
  const afterStrip  = html.slice(endIndex).replace(/^\s*\n/, "");
  return (beforeStrip ? beforeStrip + "\n" : "") + afterStrip;
}

/**
 * Remove bespoke original nav/header patterns from non-about pages.
 * These were present before the bad injections and need to be replaced
 * with the canonical .nav.
 */
function removeBespokeNav(html) {
  // Pattern A: Tailwind sticky header (alchemy, attractor, buffer, family, ...)
  let idx = html.indexOf('<header class="w-full border-b border-white/[0.07] bg-surface/90 backdrop-blur-sm sticky top-0 z-50">');
  if (idx !== -1) html = stripBlock(html, idx, "header");

  // Pattern B: Tailwind shrink-0 header (initial-build, mesh-start, ...)
  idx = html.indexOf('<header class="shrink-0 border-b border-white/[0.07] bg-surface/90 backdrop-blur-sm">');
  if (idx !== -1) html = stripBlock(html, idx, "header");

  // Pattern C: Tailwind sticky nav (bonding, book, cortex, discord-bot, ...)
  idx = html.indexOf('<nav class="sticky top-0 z-50 border-b border-white/[0.07] bg-surface/90 backdrop-blur-sm">');
  if (idx !== -1) html = stripBlock(html, idx, "nav");

  // Pattern D: <nav id="navbar"> containing class="nav-logo" (lattice, attractor-sim)
  idx = html.indexOf('<nav id="navbar">');
  if (idx !== -1) {
    const peek = html.slice(idx, idx + 600);
    if (peek.includes('class="nav-logo"') || peek.includes("class='nav-logo'")) {
      html = stripBlock(html, idx, "nav");
    }
  }

  // Pattern E: plain <header> containing class="logo" (axiom, bridge, connect, echo, forge, ...)
  // Find all plain <header> tags and check content within 800 chars
  let searchFrom = 0;
  while (true) {
    const hi = html.indexOf("<header>", searchFrom);
    if (hi === -1) break;
    const peek = html.slice(hi, hi + 800);
    if (peek.includes('class="logo"') || peek.includes("class='logo'") ||
        peek.includes('class="nav-logo"') || peek.includes("class='nav-logo'")) {
      html = stripBlock(html, hi, "header");
      searchFrom = 0; // restart from beginning after modification
    } else {
      searchFrom = hi + 1;
    }
  }

  return html;
}

/**
 * Collapse runs of 3+ blank lines down to 2 (cosmetic cleanup after removals).
 */
function collapseBlankLines(html) {
  return html.replace(/\n{3,}/g, "\n\n");
}

// ── Step B: Injection helpers ──────────────────────────────────────────────────

/** Insert text immediately after the <body…> open tag. */
function insertAfterBodyOpen(html, text) {
  const bodyMatch = html.match(/<body[^>]*>/);
  if (!bodyMatch) return html;
  const end = bodyMatch.index + bodyMatch[0].length;
  return html.slice(0, end) + "\n" + text + html.slice(end);
}

/** Insert text immediately before </body>. */
function insertBeforeBodyClose(html, text) {
  const idx = html.lastIndexOf("</body>");
  if (idx === -1) return html;
  return html.slice(0, idx) + text + "\n" + html.slice(idx);
}

/**
 * Remove the first Tailwind-style nav or header from a page.
 * Targets:
 *   <nav class="sticky …   (Tailwind nav)
 *   <nav class="flex …     (Tailwind nav)
 *   <header class="w-full … (Tailwind header)
 *   <header class="sticky … (Tailwind header)
 */
function removeTailwindNav(html) {
  // Patterns for opening tags of Tailwind navs/headers to replace
  const patterns = [
    /<nav class="sticky[^"]*"/,
    /<nav class="flex[^"]*"/,
    /<header class="w-full[^"]*"/,
    /<header class="sticky[^"]*"/,
    /<header class="border-b[^"]*"/,
  ];

  for (const pat of patterns) {
    const m = pat.exec(html);
    if (!m) continue;

    const tagStart = m.index;
    // Determine the tag name (nav or header)
    const tagName = html.slice(tagStart + 1, tagStart + 7).startsWith("header") ? "header" : "nav";
    const closeTag = `</${tagName}>`;

    // Find the matching closing tag (handle nesting)
    const openTagRe = new RegExp(`<${tagName}[\\s>]`, "g");
    openTagRe.lastIndex = tagStart + 1;
    let depth = 1;
    let pos = tagStart + 1;
    while (depth > 0 && pos < html.length) {
      const nextOpen = html.indexOf(`<${tagName}`, pos);
      const nextClose = html.indexOf(closeTag, pos);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Check it's actually a new opening tag (not self-closing)
        const tagSnippet = html.slice(nextOpen, nextOpen + 10);
        if (!tagSnippet.includes("/>")) depth++;
        pos = nextOpen + tagName.length + 1;
      } else {
        depth--;
        if (depth === 0) {
          const end = nextClose + closeTag.length;
          // eat trailing newline
          let realEnd = end;
          while (realEnd < html.length && (html[realEnd] === "\n" || html[realEnd] === "\r")) realEnd++;
          // eat leading whitespace on the same line
          let realStart = tagStart;
          while (realStart > 0 && (html[realStart - 1] === " " || html[realStart - 1] === "\t")) realStart--;
          if (realStart > 0 && html[realStart - 1] === "\n") realStart--;
          html = html.slice(0, realStart) + html.slice(realEnd);
        } else {
          pos = nextClose + closeTag.length;
        }
      }
    }
    break; // Only remove the first matching nav/header
  }
  return html;
}

// ── Main ───────────────────────────────────────────────────────────────────────

const htmlFiles = fs.readdirSync(publicDir)
  .filter((f) => f.endsWith(".html"))
  .sort();

let changed = 0;
let skipped = 0;

for (const file of htmlFiles) {
  const filePath = path.join(publicDir, file);
  const original = fs.readFileSync(filePath, "utf8");
  let html = original;

  // ════════════════════════════════════════════════════════════════════════════
  // STEP A — Remove bad injections from ALL pages
  // ════════════════════════════════════════════════════════════════════════════

  html = fixPublicLibPaths(html);
  html = fixStarfieldPaths(html);
  // Replace old static-plate import with live module in the STARFIELD_BLOCK script
  html = html.replace(
    /import\("\/lib\/p31-starfield-static-plate\.js"\);\s*\n(\s*)mod\.initStaticStarPlate\(/g,
    'import("/lib/p31-starfield-live.js");\n$1mod.initLiveStarfield('
  );
  html = removeTopBarComment(html);
  html = removeTopBar(html);
  html = removeStarfieldCanvas(html);
  html = removeStarfieldInitComment(html);
  html = removeStarfieldInit(html);
  html = removeInjectedSkipLink(html);
  html = removeOldSkipLink(html);
  html = collapseBlankLines(html);

  // ════════════════════════════════════════════════════════════════════════════
  // STEP B — Apply canonical chrome to non-about, non-special pages
  // ════════════════════════════════════════════════════════════════════════════

  const isAbout = file.endsWith("-about.html");
  const isSpecial = SKIP_CHROME.has(file);

  if (!isAbout && !isSpecial) {
    // 1. Add ambient-radial-fixed div if absent
    if (!html.includes("ambient-radial-fixed")) {
      html = insertAfterBodyOpen(html, '<div class="ambient-radial-fixed" aria-hidden="true"></div>');
    }

    // 2. Remove all bespoke original navs, then inject canonical .nav
    // Strip any remaining bespoke navs (Tailwind headers, logo headers, navbar id)
    html = removeBespokeNav(html);

    if (!html.includes('class="nav"')) {
      // Inject canonical nav after ambient div, or after body open
      if (html.includes("ambient-radial-fixed")) {
        const ambientDiv = '<div class="ambient-radial-fixed" aria-hidden="true"></div>';
        const idx = html.indexOf(ambientDiv);
        if (idx !== -1) {
          const after = idx + ambientDiv.length;
          html = html.slice(0, after) + "\n\n" + CANONICAL_NAV + "\n" + html.slice(after);
        }
      } else {
        html = insertAfterBodyOpen(html, CANONICAL_NAV);
      }
    }

    // 3. Add EBC footer if absent
    if (!html.includes("p31-mission-trio--ebc")) {
      const ribbonScript = '<script src="/lib/p31-return-ribbon.js"';
      if (html.includes(ribbonScript)) {
        const idx = html.indexOf(ribbonScript);
        let lineStart = idx;
        while (lineStart > 0 && html[lineStart - 1] !== "\n") lineStart--;
        html = html.slice(0, lineStart) + EBC_FOOTER + "\n" + html.slice(lineStart);
      } else {
        html = insertBeforeBodyClose(html, EBC_FOOTER);
      }
    }

    // 4. Ensure atmosphere client
    if (!html.includes("p31-atmosphere-client")) {
      html = insertBeforeBodyClose(html, '  <script src="/lib/atmosphere/p31-atmosphere-client.js" defer></script>\n');
    }

    // 5. Ensure return ribbon
    if (!html.includes("p31-return-ribbon")) {
      html = insertBeforeBodyClose(html, '  <script src="/lib/p31-return-ribbon.js" defer></script>\n');
    }

    // 6. Ensure molecular field CSS in <head>
    if (!html.includes("p31-molecular-field.css")) {
      // Insert before first </head>
      const headClose = html.indexOf("</head>");
      if (headClose !== -1) {
        html = html.slice(0, headClose)
          + '  <link rel="stylesheet" href="/lib/p31-molecular-field.css">\n'
          + html.slice(headClose);
      }
    }

    // 7. Ensure molecular field JS module before </body>
    if (!html.includes("p31-molecular-field.js")) {
      html = insertBeforeBodyClose(
        html,
        '  <script type="module" src="/lib/p31-molecular-field.js"></script>\n'
      );
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // STEP C — Inject starfield on ALL pages that have canonical nav
  // ════════════════════════════════════════════════════════════════════════════

  if (!html.includes("p31-starfield-live")) {
    const navClassIdx = html.indexOf('class="nav"');
    if (navClassIdx !== -1) {
      const navCloseIdx = html.indexOf("</nav>", navClassIdx);
      if (navCloseIdx !== -1) {
        const insertAt = navCloseIdx + "</nav>".length;
        html = html.slice(0, insertAt) + "\n" + STARFIELD_BLOCK + html.slice(insertAt);
      }
    }
  }

  // ── Write (or dry-run) ──────────────────────────────────────────────────────
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

console.log(`\napply-canonical-chrome: ${changed} modified · ${skipped} already compliant`);
if (DRY) console.log("DRY RUN — no files written. Remove DRY=1 to apply.");
