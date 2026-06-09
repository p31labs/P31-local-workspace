#!/usr/bin/env node
/**
 * Idempotent: ensure p31ca public/ tree (all .html) has mobile mesh-first viewport + body class.
 * - meta viewport: append `viewport-fit=cover` when missing
 * - first <body ...>: add class `p31-mesh-m-first` (merge with existing class)
 * Run: node scripts/apply-mesh-m-first-p31ca-public.mjs
 * (Optional in prebuild: only writes when content changes.)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

function walkHtml(dir, out = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) walkHtml(p, out);
    else if (name.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** @param {string} html */
function ensureViewportFit(html) {
  return html.replace(
    /(<meta\s+[^>]*\bname=["']viewport["'][^>]*\bcontent=)(["'])([^"']*)\2/gi,
    (full, pfx, q, content) => {
      if (/\bviewport-fit=cover\b/.test(String(content))) return full;
      const c = String(content).trim();
      if (!c) return full;
      return `${pfx}${q}${c}, viewport-fit=cover${q}`;
    },
  );
}

/** @param {string} html */
function ensureBodyClass(html) {
  if (/<body[^>]*\bp31-mesh-m-first\b/i.test(html)) return html;
  return html.replace(/<body(\s+[^>]*?)?\s*>/is, (match, inner) => {
    const s = (inner || '').trim();
    if (!s) return '<body class="p31-mesh-m-first">';
    const m = s.match(/\bclass=(["'])([^"']*)\1/i);
    if (m) {
      if (/\bp31-mesh-m-first\b/.test(m[2])) return match;
      const merged = `${m[2]} p31-mesh-m-first`.replace(/\s+/g, ' ').trim();
      const next = s.replace(/\bclass=(["'])[^"']*\1/i, `class=${m[1]}${merged}${m[1]}`);
      return `<body ${next}>`;
    }
    return `<body class="p31-mesh-m-first" ${s}>`;
  });
}

let changed = 0;
let total = 0;
for (const file of walkHtml(PUBLIC)) {
  total += 1;
  const before = fs.readFileSync(file, 'utf8');
  let after = before;
  after = ensureViewportFit(after);
  after = ensureBodyClass(after);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log('mesh-m-first:', path.relative(PUBLIC, file));
  }
}
console.log(`apply-mesh-m-first-p31ca-public: ${total} html, ${changed} updated`);
