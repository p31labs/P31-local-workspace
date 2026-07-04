#!/usr/bin/env node
/**
 * verify-surface-canon — Phase 2 edition.
 *
 * Validates the 7-route AppShell architecture instead of checking every
 * individual HTML file in public/.
 *
 * CHECKS (in order):
 *   1. src/layouts/AppShell.astro exists and contains required elements.
 *   2. Each of the 7 canonical Astro route files exists.
 *   3. Each route file references AppShell and the correct routeName.
 *   4. public/_redirects covers every *.html still present in public/.
 *      (During the demolition window some files still exist; this ensures
 *       no file can be present without redirect coverage.)
 *
 * ROUTE TABLE (canonical):
 *   home      src/pages/index.astro
 *   dome      src/pages/dome.astro
 *   research  src/pages/research.astro
 *   connect   src/pages/connect.astro
 *   ops       src/pages/ops.astro
 *   garden    src/pages/garden.astro
 *   passport  src/pages/passport.astro
 *
 * EXITS:
 *   0  all checks pass (warns allowed)
 *   1  at least one check fails
 *
 * Run:
 *   node scripts/verify-surface-canon.mjs
 *   SURFACE_CANON_STRICT=1 node scripts/verify-surface-canon.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pagesDir = path.join(root, "src", "pages");
const layoutsDir = path.join(root, "src", "layouts");
const publicDir = path.join(root, "public");
const redirectsPath = path.join(publicDir, "_redirects");

const STRICT = process.env.SURFACE_CANON_STRICT === "1";

// ─── Route table ─────────────────────────────────────────────────────────────
const ROUTES = [
  { id: "home",     file: "index.astro",    routeName: "home"     },
  { id: "dome",     file: "dome.astro",     routeName: "dome"     },
  { id: "research", file: "research.astro", routeName: "research" },
  { id: "connect",  file: "connect.astro",  routeName: "connect"  },
  { id: "ops",      file: "ops.astro",      routeName: "ops"      },
  { id: "garden",   file: "garden.astro",   routeName: "garden"   },
  { id: "passport", file: "passport.astro", routeName: "passport" },
];

// ─── AppShell structural requirements ────────────────────────────────────────
const APPSHELL_REQUIRED = [
  { needle: "routeName",             label: "routeName prop"                     },
  { needle: "ClientRouter",          label: "Astro ClientRouter (view transitions)" },
  { needle: "transition:persist",    label: "transition:persist canvas"          },
  { needle: "data-p31-route",        label: "data-p31-route on <html>"           },
  { needle: 'class="nav',            label: "canonical .nav header"              },
  { needle: "p31-mission-trio--ebc", label: "EBC mission footer"                 },
  { needle: "p31-phos-guide",        label: "PHOS bus bar"                       },
];

const APPSHELL_FORBIDDEN = [
  { needle: "cdn.tailwindcss.com",    label: "Tailwind CDN"                      },
  { needle: 'id="starfield-canvas"',  label: "old starfield-canvas element"      },
  { needle: "p31-top-bar",            label: "p31-top-bar (replaced by .nav)"    },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readFile(p) { return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null; }

let fails = 0;
const okLines = [], warnLines = [], failLines = [];

function pass(msg) { okLines.push(`  ✓  ${msg}`); }
function warn(msg) { warnLines.push(`  ⚠  ${msg}`); }
function fail(msg) { failLines.push(`  ✗  ${msg}`); fails++; }

// ─── Check 1: AppShell.astro ─────────────────────────────────────────────────
const appShell = readFile(path.join(layoutsDir, "AppShell.astro"));
if (!appShell) {
  fail("src/layouts/AppShell.astro missing — rebuild Phase 1 before running Phase 2 checks");
} else {
  const issues = [
    ...APPSHELL_REQUIRED.filter(({ needle }) => !appShell.includes(needle)).map(({ label }) => `missing ${label}`),
    ...APPSHELL_FORBIDDEN.filter(({ needle }) =>  appShell.includes(needle)).map(({ label }) => `forbidden: ${label}`),
  ];
  if (issues.length) {
    issues.forEach((i) => fail(`AppShell.astro: ${i}`));
  } else {
    pass("AppShell.astro structural checks pass");
  }
}

// ─── Check 2 + 3: Route files ────────────────────────────────────────────────
for (const { id, file, routeName } of ROUTES) {
  const content = readFile(path.join(pagesDir, file));
  if (!content) {
    fail(`src/pages/${file} missing (route "${id}" not yet built)`);
    continue;
  }

  const issues = [];
  if (!content.includes("AppShell")) issues.push("does not use AppShell layout");

  // Accept routeName="dome", routeName={'dome'}, routeName={`dome`}
  const rx = new RegExp(`routeName=["'\`{]?${routeName}["'\`}]?`);
  if (!rx.test(content)) issues.push(`routeName="${routeName}" not found`);

  if (issues.length) {
    issues.forEach((i) => fail(`src/pages/${file}: ${i}`));
  } else {
    pass(`/pages/${file} → routeName="${routeName}"`);
  }
}

// ─── Check 4: _redirects coverage ────────────────────────────────────────────
if (!fs.existsSync(redirectsPath)) {
  fail("public/_redirects missing");
} else if (!fs.existsSync(publicDir)) {
  warn("public/ dir missing — skipping redirect coverage");
} else {
  const redirectsContent = fs.readFileSync(redirectsPath, "utf8");
  const htmlFiles = fs.readdirSync(publicDir).filter((f) => f.endsWith(".html")).sort();

  const uncovered = htmlFiles.filter((f) => !redirectsContent.includes(`/${f}`));

  // 404.html, 500.html, maintenance.html etc. intentionally have no redirect
  const TOLERATED = new Set(["404.html", "500.html"]);
  const actionable = uncovered.filter((f) => !TOLERATED.has(f));

  if (actionable.length === 0) {
    pass(`_redirects covers all ${htmlFiles.length} HTML files in public/`);
  } else {
    const verb = STRICT ? fail : warn;
    for (const f of actionable) verb(`public/${f} has no _redirects entry — add redirect or delete file`);
  }
}

// ─── Output ───────────────────────────────────────────────────────────────────
for (const m of okLines)   console.log(m);
for (const m of warnLines) console.warn(m);
for (const m of failLines) console.error(m);

const routesDone = ROUTES.filter(({ file }) => fs.existsSync(path.join(pagesDir, file))).length;
const verb = fails === 0 ? "OK" : "FAIL";
const summary =
  `verify-surface-canon: ${verb} — ${routesDone}/7 routes ` +
  `· ${okLines.length} pass · ${warnLines.length} warn · ${failLines.length} fail`;

console[fails === 0 ? "log" : "error"](summary);
process.exit(fails > 0 ? 1 : 0);
