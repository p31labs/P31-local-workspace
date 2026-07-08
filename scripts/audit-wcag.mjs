// WCAG 2.2 AAA audit via axe-core + Playwright
// Usage: node scripts/audit-wcag.mjs [url]
// Requires: npm install -D playwright @axe-core/playwright && npx playwright install chromium

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const URL = process.argv[2] || 'https://phos.p31ca.org';

async function audit(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag2aaa'])
    .analyze();

  console.log(`\nAudit of ${url}:`);
  console.log(`  Passes:    ${results.passes.length}`);
  console.log(`  Violations: ${results.violations.length}`);
  console.log(`  Incomplete: ${results.incomplete.length}`);

  if (results.violations.length) {
    console.log('\nViolations:');
    for (const v of results.violations) {
      console.log(`  [${v.impact}] ${v.help}`);
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

  await browser.close();
  process.exit(results.violations.length > 0 ? 1 : 0);
}

audit(URL).catch(e => { console.error(e); process.exit(2); });