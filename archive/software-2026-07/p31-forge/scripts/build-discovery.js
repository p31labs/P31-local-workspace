#!/usr/bin/env node
/**
 * BUILD: CWP-041 Discovery Payload (April 14, 2026)
 * =================================================
 * Compiles all three April-14 discovery documents from content packs
 * into ../out/ in one shot. Run docx_to_pdf.py after to get PDFs.
 *
 * Usage:
 *   node scripts/build-discovery.js
 *
 * Outputs (to ../out/):
 *   Supplemental_Discovery_Notice.docx
 *   P31_Labs_Business_Documentation.docx
 *   Response_Good_Faith_Letter_FINAL.docx
 */

const path = require('path');
const { compileFile } = require('../forge');

const PACKS = [
  'content/legal/2025CV936/supplemental_notice.json',
  'content/legal/2025CV936/business_documentation.json',
  'content/legal/2025CV936/response_good_faith.json'
];

async function main() {
  const root = path.resolve(__dirname, '..');
  console.log('P31 FORGE \u2014 Building CWP-041 discovery payload');
  console.log('\u2550'.repeat(60));

  const results = [];
  for (const rel of PACKS) {
    const abs = path.join(root, rel);
    try {
      const out = await compileFile(abs);
      console.log(`  \u2713 ${path.basename(out)}`);
      results.push(out);
    } catch (e) {
      console.error(`  \u2717 ${rel}: ${e.message}`);
      process.exitCode = 1;
    }
  }

  console.log('\nBuilt', results.length, 'document(s).');
  console.log('Next: python scripts/docx_to_pdf.py   (to render PDFs)');
}

main().catch(e => { console.error(e); process.exit(1); });
