// WCAG 2.2 AAA audit via axe-core + Playwright
// Usage: node scripts/audit-wcag.mjs [url]
// Requires: npm install -D playwright @axe-core/playwright && npx playwright install chromium
//
// Impact filtering: only fails on critical/serious violations.
// Minor/moderate are reported but do not cause a non-zero exit.

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const URL = process.argv[2] || 'https://phos.p31ca.org';
const BLOCKING_IMPACTS = new Set(['critical', 'serious']);

async function audit(url) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
    .analyze();

  console.log(`\nAudit of ${url}:`);
  console.log(`  Passes:    ${results.passes.length}`);
  console.log(`  Violations: ${results.violations.length}`);
  console.log(`  Incomplete: ${results.incomplete.length}`);

  let blockingCount = 0;

  if (results.violations.length) {
    console.log('\nViolations:');
    for (const v of results.violations) {
      const blocking = BLOCKING_IMPACTS.has(v.impact);
      if (blocking) blockingCount++;
      const tag = blocking ? '[BLOCKING]' : '[non-blocking]';
      console.log(`  ${tag} [${v.impact}] ${v.help}`);
      console.log(`    ${v.helpUrl}`);
      for (const n of v.nodes) {
        console.log(`    → ${n.target.join(', ')}`);
        for (const a of n.all) console.log(`       ${a.message}`);
      }
    }
  }

  if (results.incomplete.length) {
    console.log('\nIncomplete (needs manual review):');
    for (const v of results.incomplete) {
      console.log(`  ${v.help} — ${v.helpUrl}`);
    }
  }

  console.log(`\nBlocking violations (critical/serious): ${blockingCount}`);
  await browser.close();
  process.exit(blockingCount > 0 ? 1 : 0);
}

audit(URL).catch(e => { console.error(e); process.exit(2); });
