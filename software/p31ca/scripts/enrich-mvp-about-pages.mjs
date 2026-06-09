#!/usr/bin/env node
/**
 * Injects hub "enriched" sections into p31ca/public/*-about.html for every
 * product/prototype in src/data/hub-landing.json with url ending in -about.html
 * (same graph as the Astro home — CWP D5).
 * Idempotent: skips files that already contain id="mvp-enriched".
 * Run after generate-about-pages + hub:build. Alignment: p31-alignment.json; docs/P31-ALIGNMENT-SYSTEM.md
 *
 * Layouts:
 * - Legacy: `<table class="stack">` — full block + callout + CTA row (and removes old stack CTA).
 * - Modern: `.page-body` + `.main-col` — hub `detail-grid` only (page already has callout/CTAs).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const HUB_LANDING = path.join(ROOT, 'src', 'data', 'hub-landing.json');
const PUBLIC = path.join(ROOT, 'public');

const EXTRA_CSS = `
.detail-grid { display: grid; gap: 20px; margin: 28px 0; }
@media (min-width: 640px) { .detail-grid { grid-template-columns: 1fr 1fr; } }
.detail-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 10px; padding: 20px 22px; }
.detail-card h3 { font-family: var(--mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin: 0 0 12px; border: none; padding: 0; }
.detail-card p { font-size: 14px; margin-bottom: 10px; }
.detail-card p:last-child { margin-bottom: 0; }
.detail-card ul { margin: 0; padding-left: 18px; color: rgba(216,214,208,0.88); font-size: 14px; line-height: 1.65; }
.detail-card li { margin-bottom: 8px; }
.callout-p31 { font-size: 13px; color: rgba(216,214,208,0.78); border-left: 3px solid var(--teal); padding: 14px 18px; margin: 28px 0; background: rgba(37,137,125,0.08); border-radius: 0 10px 10px 0; line-height: 1.65; }
.callout-p31 a { color: var(--cyan); }
`;

/** Allow numeric entities (&#x2084;) from hub copy; strip only raw tags. */
function safeBodyText(s) {
  return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @returns {{ id: string, link: string, title: string, tagline: string, statusLabel: string, description: string, tech: string[] }[]}
 */
function loadTargetsFromHubLanding() {
  if (!fs.existsSync(HUB_LANDING)) {
    console.error('Missing', HUB_LANDING, '— run npm run hub:build first');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(HUB_LANDING, 'utf8'));
  const out = [];

  for (const p of data.coreProducts || []) {
    const link = String(p.url || '').replace(/^\//, '');
    if (!link.endsWith('-about.html')) continue;
    out.push({
      id: p.id,
      link,
      title: p.title,
      tagline: p.desc || '',
      statusLabel: p.status || 'LIVE',
      description: p.desc || '',
      tech: Array.isArray(p.tags) ? p.tags : [],
    });
  }
  for (const p of data.prototypes || []) {
    const link = String(p.url || '').replace(/^\//, '');
    if (!link.endsWith('-about.html')) continue;
    out.push({
      id: p.id,
      link,
      title: p.title,
      tagline: p.desc || '',
      statusLabel: 'PROTOTYPE',
      description: p.desc || '',
      tech: [],
    });
  }
  return out;
}

function sentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);
}

function readLaunchHref(aboutHtml) {
  const patterns = [
    /<a\s+href="([^"]+)"[^>]*class="nav-cta"/,
    /class="nav-cta"[^>]*href="([^"]+)"/,
    /<a\s+href="([^"]+)"[^>]*class="cta-btn"/,
  ];
  for (const re of patterns) {
    const m = aboutHtml.match(re);
    if (m) return m[1];
  }
  return '#';
}

function readCtaLabel(aboutHtml) {
  const m = aboutHtml.match(/class="nav-cta"[^>]*>([^<]+)</);
  return m ? m[1].trim() : 'Launch';
}

/** Hub-backed cards (used by legacy + modern). */
function buildDetailGrid({ title, tagline, description, tech, statusLabel }) {
  const sens = sentences(description);
  const lead = sens[0] || description;
  const more = sens.slice(1, 4);
  const techList =
    tech.length > 0
      ? tech
      : statusLabel === 'PROTOTYPE'
        ? ['Prototype — see hub card for route']
        : ['—'];
  const techLis = techList.map((t) => `      <li>${safeBodyText(t)}</li>`).join('\n');
  const moreParas = more.map((p) => `      <p>${safeBodyText(p)}</p>`).join('\n');
  const statusLine =
    statusLabel && statusLabel !== 'LIVE'
      ? ` <span style="opacity:.75">· ${safeBodyText(statusLabel)}</span>`
      : '';

  return `  <div id="mvp-enriched" class="detail-grid">
    <div class="detail-card">
      <h3>What you can do</h3>
      <p>${safeBodyText(lead)}</p>
${moreParas}
    </div>
    <div class="detail-card">
      <h3>Build surface</h3>
      <p>Hub card stack for <strong>${safeBodyText(title)}</strong> (${safeBodyText(tagline)}).${statusLine} Static HTML on <code>p31ca.org</code>; app may be on Pages, Workers, or a sibling route.</p>
      <ul>
${techLis}
      </ul>
    </div>
  </div>
`;
}

function buildInsertLegacy({ title, tagline, description, tech, statusLabel, launchHref, ctaLabel }) {
  const grid = buildDetailGrid({ title, tagline, description, tech, statusLabel });
  return `
${grid}
  <p class="callout-p31"><strong>P31 Labs, Inc.</strong> (Georgia nonprofit, EIN 42-1888158) builds open tools for cognitive load, communication clarity, and family coordination. This page is technical documentation, not medical or legal advice. Mission and donations: <a href="https://phosphorus31.org" target="_blank" rel="noopener">phosphorus31.org</a>.</p>

  <div class="cta-wrap">
    <a href="${safeBodyText(launchHref)}" class="cta-btn">${ctaLabel.replace(/</g, '&lt;')}</a>
    <a href="/" class="cta-secondary">&larr; Back to Hub</a>
  </div>
`;
}

function injectCss(html) {
  if (html.includes('detail-grid')) return html;
  return html.replace('</style>', `${EXTRA_CSS}\n</style>`);
}

function injectAfterTable(html, insert) {
  if (html.includes('id="mvp-enriched"')) return html;
  const needle = '</table>';
  const idx = html.indexOf(needle);
  if (idx === -1) return html;
  const pos = idx + needle.length;
  return html.slice(0, pos) + '\n' + insert + html.slice(pos);
}

function injectAfterMainColOpen(html, insert) {
  if (html.includes('id="mvp-enriched"')) return html;
  const needle = '<div class="main-col">';
  const idx = html.indexOf(needle);
  if (idx === -1) return html;
  const pos = idx + needle.length;
  return html.slice(0, pos) + '\n\n' + insert + html.slice(pos);
}

/** Legacy stack CTA (margin-top:40px) — redundant after enrichment adds launch row. */
function removeOldStackCtaAfterEnriched(html) {
  const enriched = html.indexOf('id="mvp-enriched"');
  if (enriched === -1) return html;
  const needle = '<div class="cta-wrap" style="margin-top:40px">';
  const pos = html.indexOf(needle, enriched);
  if (pos === -1) return html;
  const end = html.indexOf('</div>', pos);
  if (end === -1) return html;
  return html.slice(0, pos) + html.slice(end + 6);
}

function isLegacyStack(html) {
  return html.includes('<table class="stack">');
}

function isModernPageBody(html) {
  return html.includes('class="page-body"') && html.includes('class="main-col"');
}

function main() {
  const products = loadTargetsFromHubLanding();
  console.log(`Parsed ${products.length} about targets from hub-landing.json`);

  for (const p of products) {
    const fp = path.join(PUBLIC, p.link);
    if (!fs.existsSync(fp)) {
      console.warn('Missing file:', p.link);
      continue;
    }
    let html = fs.readFileSync(fp, 'utf8');
    if (html.includes('id="mvp-enriched"')) {
      console.log('Skip (already enriched):', p.link);
      continue;
    }

    let insert;
    if (isLegacyStack(html)) {
      const launchHref = readLaunchHref(html);
      const ctaLabel = readCtaLabel(html);
      insert = buildInsertLegacy({ ...p, launchHref, ctaLabel });
    } else if (isModernPageBody(html)) {
      insert = buildDetailGrid(p);
    } else {
      console.warn('Skip (unknown layout, expected stack table or main-col):', p.link);
      continue;
    }

    html = injectCss(html);
    if (isLegacyStack(html)) {
      html = injectAfterTable(html, insert);
      html = removeOldStackCtaAfterEnriched(html);
    } else {
      html = injectAfterMainColOpen(html, insert);
    }

    if (!html.includes('id="mvp-enriched"')) {
      console.warn('Inject failed:', p.link);
      continue;
    }
    fs.writeFileSync(fp, html, 'utf8');
    console.log('Enriched:', p.link);
  }
}

main();
