/**
 * One-time / idempotent: migrate standard *-about.html to hub-about-shell.css + hub-about-boot.js
 * Skips quantum-family-about.html (Tailwind layout).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

const SKIP = new Set(["quantum-family-about.html"]);

const LINK_BLOCK = `<link rel="stylesheet" href="/assets/hub-skin.css">
<link rel="stylesheet" href="/assets/hub-about-shell.css">`;

function migrateFile(filePath) {
  const base = path.basename(filePath);
  if (SKIP.has(base)) return { base, status: "skip" };

  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("hub-about-shell.css")) {
    return { base, status: "already" };
  }

  const accentMatch = html.match(/--accent:\s*([^;]+);/);
  if (!accentMatch) {
    return { base, status: "no-accent" };
  }
  const accent = accentMatch[1].trim();

  const styleRe = /<style>[\s\S]*?<\/style>/;
  if (!styleRe.test(html)) {
    return { base, status: "no-style" };
  }

  const replacement = `${LINK_BLOCK}
<style>
:root {
  --accent: ${accent};
}
</style>`;

  html = html.replace(styleRe, replacement);

  if (html.includes("<body class=\"hub-about-page\">")) {
    /* already */
  } else if (/^<body\s+class="/m.test(html)) {
    html = html.replace(/^<body\s+class="/m, '<body class="hub-about-page ');
  } else {
    html = html.replace("<body>", '<body class="hub-about-page">');
  }

  if (!html.includes("hub-about-boot.js")) {
    html = html.replace("</body>", '  <script type="module" src="/assets/hub-about-boot.js"></script>\n</body>');
  }

  fs.writeFileSync(filePath, html, "utf8");
  return { base, status: "ok" };
}

const entries = fs.readdirSync(publicDir).filter((f) => f.endsWith("-about.html"));
const results = [];
for (const f of entries) {
  results.push(migrateFile(path.join(publicDir, f)));
}

const by = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify(by, null, 1));
for (const r of results) {
  if (r.status !== "ok" && r.status !== "already") {
    console.log(`${r.base}: ${r.status}`);
  }
}
