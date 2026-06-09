#!/usr/bin/env node
/**
 * Repairs <a href="#" class="cta-btn"> in MVP-enriched about pages:
 * resolves launch URL from the nav-cta or first hero cta-btn (href before class).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');

function readLaunchHref(html) {
  const patterns = [
    /<a\s+href="([^"]+)"[^>]*class="nav-cta"/,
    /class="nav-cta"[^>]*href="([^"]+)"/,
    /<a\s+href="([^"]+)"[^>]*class="cta-btn"/,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m) return m[1];
  }
  return null;
}

function fixEntitiesInEnriched(html) {
  /* Un-double-escape common hub entities in MVP paragraphs */
  return html.replace(/K&amp;#x2084;/g, 'K&#x2084;').replace(/&amp;mdash;/g, '&mdash;').replace(/&amp;middot;/g, '&middot;');
}

function main() {
  const files = fs.readdirSync(PUBLIC).filter((f) => f.endsWith('-about.html'));
  let n = 0;
  for (const f of files) {
    const fp = path.join(PUBLIC, f);
    let html = fs.readFileSync(fp, 'utf8');
    if (!html.includes('id="mvp-enriched"') || !html.includes('href="#" class="cta-btn"')) continue;
    const href = readLaunchHref(html);
    if (!href || href === '#') {
      console.warn('No nav href for', f);
      continue;
    }
    const parts = html.split('<p class="callout-p31"');
    if (parts.length < 2) continue;
    const idx = parts[1].indexOf('<a href="#" class="cta-btn"');
    if (idx === -1) continue;
    parts[1] =
      parts[1].slice(0, idx) +
      `<a href="${href}" class="cta-btn"` +
      parts[1].slice(idx + '<a href="#" class="cta-btn"'.length);
    html = parts.join('<p class="callout-p31"');
    html = fixEntitiesInEnriched(html);
    fs.writeFileSync(fp, html, 'utf8');
    console.log('Fixed href:', f);
    n++;
  }
  console.log('Done, repaired', n, 'files');
}

main();
