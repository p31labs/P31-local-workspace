#!/usr/bin/env node
/**
 * @file Design-Core Generator CLI
 * Usage:
 *   node scripts/generate-components.mjs --all
 *   node scripts/generate-components.mjs --adapter astro
 *   node scripts/generate-components.mjs --adapter react --component GlassCard
 */

import { writeReact, writeAstro, writeWebComponents, writeHtml } from '../src/generator/index.ts';

const args = process.argv.slice(2);
const opts = {};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--adapter' && args[i + 1]) {
    opts.adapter = args[++i];
  } else if (args[i] === '--component' && args[i + 1]) {
    opts.component = args[++i];
  } else if (args[i] === '--all') {
    opts.adapter = 'all';
  }
}

const adapters = opts.adapter === 'all' ? ['react', 'astro', 'webcomponent', 'html'] : opts.adapter ? [opts.adapter] : ['react'];

for (const adapter of adapters) {
  console.log(`\n── ${adapter} adapter ──`);
  switch (adapter) {
    case 'react':
      writeReact({ component: opts.component });
      break;
    case 'astro':
      writeAstro({ component: opts.component });
      break;
    case 'webcomponent':
      writeWebComponents({ component: opts.component });
      break;
    case 'html':
      writeHtml({ component: opts.component });
      break;
  }
}

if (adapters.length > 1) {
  console.log('\n✅ All adapters generated.');
}
