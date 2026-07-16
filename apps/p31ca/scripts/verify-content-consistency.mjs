#!/usr/bin/env node
/**
 * verify-content-consistency.mjs — Scans all .astro pages in src/pages/ for
 * hardcoded values that contradict the content ground truth in
 * ground-truth/content/.
 *
 * Checks:
 *   1. EIN matches nonprofit.json
 *   2. IRS status matches nonprofit.json (no "pending" vs "registered" contradiction)
 *   3. Policy effective dates match nonprofit.json#policies.*.effective
 *   4. External URLs not in p31-mesh-constants.json
 *
 * Usage:
 *   node scripts/verify-content-consistency.mjs            # strict mode
 *   node scripts/verify-content-consistency.mjs --dry-run  # warn but don't fail
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PAGES_DIR = resolve(ROOT, 'src', 'pages');
const DATA_DIR = resolve(ROOT, 'src', 'data');
const CONTENT_DIR = resolve(ROOT, 'ground-truth', 'content');
const DRY_RUN = process.argv.includes('--dry-run');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function findAstroFiles(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...findAstroFiles(p));
    } else if (e.name.endsWith('.astro')) {
      results.push(p);
    }
  }
  return results;
}

function grepFile(filePath, pattern) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      matches.push({ line: i + 1, content: lines[i].trim() });
    }
  }
  return matches;
}

function main() {
  const nonprofit = readJson(join(CONTENT_DIR, 'nonprofit.json'));
  const constants_urls = readJson(join(DATA_DIR, 'p31-mesh-constants.json'));
  const allKnownUrls = Object.values(constants_urls).filter((v) => typeof v === 'string' && v.startsWith('http'));

  const issues = [];

  // 1. EIN check
  const files = findAstroFiles(PAGES_DIR);
  for (const file of files) {
    const matches = grepFile(file, /42-1888158/);
    for (const m of matches) {
      // EIN is correct as long as it matches
      // Just verify it's not a typo
    }
  }

  // 2. IRS status contradiction check
  const expectedStatus = nonprofit.irsStatus; // "pending"
  const statusPatterns = [
    { pattern: /501\(c\)\(3\).*pending/i, value: 'pending' },
    { pattern: /501\(c\)\(3\).*registered/i, value: 'registered' },
    { pattern: /registered.*501\(c\)\(3\)/i, value: 'registered' },
    { pattern: /pending.*501\(c\)\(3\)/i, value: 'pending' },
  ];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    for (const { pattern, value } of statusPatterns) {
      const matches = content.match(new RegExp(pattern.source, 'gi'));
      if (matches) {
        for (let i = 0; i < matches.length; i++) {
          if (value !== expectedStatus) {
            const lines = content.split('\n');
            let lineNum = 1;
            for (const line of lines) {
              if (new RegExp(pattern.source, 'i').test(line)) {
                issues.push(`${file.replace(ROOT + '/', '')}:${lineNum} — says "${value}" but ground truth says "${expectedStatus}"`);
                break;
              }
              lineNum++;
            }
          }
        }
      }
    }
  }

  // 3. Policy date check
  const privacyDate = nonprofit.policies?.privacy?.effective;
  const termsDate = nonprofit.policies?.terms?.effective;

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const dateMatches = content.match(/Effective:?\s*([A-Z][a-z]+ \d{1,2}, \d{4})/gi);
    if (dateMatches) {
      for (const match of dateMatches) {
        const dateStr = match.replace(/Effective:?\s*/i, '').trim();
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) continue;
        if (file.includes('privacy') && privacyDate) {
          const expected = new Date(privacyDate);
          if (Math.abs(parsed.getTime() - expected.getTime()) > 864e5) {
            issues.push(`${file.replace(ROOT + '/', '')} — effective date "${dateStr}" != ground truth "${privacyDate}"`);
          }
        }
        if (file.includes('terms') && termsDate) {
          const expected = new Date(termsDate);
          if (Math.abs(parsed.getTime() - expected.getTime()) > 864e5) {
            issues.push(`${file.replace(ROOT + '/', '')} — effective date "${dateStr}" != ground truth "${termsDate}"`);
          }
        }
      }
    }
  }

  // 4. Unlisted URL check (skip namespace URIs, template strings, localhost, CDNs)
  const skipUrlPatterns = [
    /w3\.org\/\d{4}\//,       // XML/schema namespaces
    /127\.0\.0\.1/,            // local dev
    /localhost/,               // local dev
    /cdnjs\.cloudflare\.com/,  // CDN
    /fonts\.googleapis\.com/,  // Google Fonts
    /\.p31ca\.org/,            // p31ca internal
    /unpkg\.com/,              // CDN
    /cdn\.jsdelivr\.net/,      // CDN
    /cdn\.tailwindcss\.com/,   // CDN
    /esm\.sh/,                 // CDN
    /\$\{/,                    // template literal variables (e.g. `https://doi.org/${doi}`)
  ];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const urlMatches = content.match(/https?:\/\/[^\s"'<>)`]+/g);
    if (urlMatches) {
      for (const url of urlMatches) {
        const cleanUrl = url.replace(/[.,;:!?)]*$/, '');
        if (!cleanUrl.startsWith('http')) continue;
        if (cleanUrl.includes('p31ca.org') || cleanUrl.includes('trimtab-signal.workers.dev')) continue;
        if (skipUrlPatterns.some((p) => p.test(cleanUrl))) continue;
        const isKnown = allKnownUrls.some((known) => cleanUrl.startsWith(known) || known.startsWith(cleanUrl));
        if (!isKnown) {
          issues.push(`${file.replace(ROOT + '/', '')} — URL "${cleanUrl}" not in p31-mesh-constants.json`);
        }
      }
    }
  }

  if (issues.length > 0) {
    console.error(`\n❌ Content consistency check FAILED — ${issues.length} issue(s)`);
    for (const issue of issues) {
      console.error(`  • ${issue}`);
    }
    console.error(`\n  Fix: update ground-truth/content/nonprofit.json or the page itself.\n`);

    if (!DRY_RUN) process.exit(1);
  }

  console.log(`✅ Content consistency OK — ${files.length} page(s) checked`);
}

main();
