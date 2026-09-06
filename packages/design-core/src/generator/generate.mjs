#!/usr/bin/env node
/**
 * @file Design-Core Generator CLI
 *
 * Generates components from cli/tokens/components.yml into the chosen adapter format.
 *
 * Usage:
 *   node packages/design-core/src/generator/generate.mjs [adapter] [--component ComponentName] [--force]
 *
 * Adapters:
 *   react       → .tsx + .test.tsx + .stories.tsx
 *   astro       → .astro
 *   webcomponent → .wc.js + p31-tokens.css
 *   html        → standalone .html previews
 *   all         → all adapters
 */

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..', '..');

const ADAPTERS = ['react', 'astro', 'webcomponent', 'html', 'all'];

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { adapter?: string; component?: string; force: boolean } = {
    force: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--force') {
      opts.force = true;
    } else if (args[i] === '--component' && args[i + 1]) {
      opts.component = args[++i];
    } else if (args[i]?.startsWith('--')) {
      // ignore unknown flags
    } else {
      opts.adapter = args[i];
    }
  }

  return opts;
}

async function main() {
  const opts = parseArgs();

  if (!opts.adapter || !ADAPTERS.includes(opts.adapter)) {
    console.log(`
Design-Core Generator — YAML → Multi-format components

Usage:
  node generate.mjs <adapter> [options]

Adapters:
  react          React/TSX (.tsx + .test + .stories)
  astro          Astro components (.astro)
  webcomponent   Shadow DOM custom elements (.wc.js + CSS)
  html           Standalone HTML previews (.html)
  all            All adapters at once

Options:
  --component <name>   Generate only this component
  --force              Regenerate even if cache is fresh

Examples:
  node generate.mjs react
  node generate.mjs astro --component GlassCard --force
  node generate.mjs all
`);
    process.exit(1);
  }

  // Dynamic import so Node can resolve TypeScript via bundled tsx, or .mjs compiled output
  const generatorDir = resolve(ROOT, 'packages', 'design-core', 'src', 'generator');
  const paths = {
    react: resolve(generatorDir, 'adapters', 'react.ts'),
    astro: resolve(generatorDir, 'adapters', 'astro.ts'),
    webcomponent: resolve(generatorDir, 'adapters', 'webcomponent.ts'),
    html: resolve(generatorDir, 'adapters', 'html.ts'),
  };

  if (opts.adapter === 'all') {
    for (const adapter of ADAPTERS) {
      if (adapter === 'all') continue;
      console.log(`\n\x1b[36m── ${adapter} adapter ──\x1b[0m`);
      await runAdapter(adapter, paths[adapter as keyof typeof paths], opts);
    }
    return;
  }

  const path = paths[opts.adapter as keyof typeof paths];
  await runAdapter(opts.adapter, path, opts);
}

async function runAdapter(adapter: string, path: string, opts: { component?: string; force: boolean }) {
  try {
    const mod = await import(path);
    const writeFn = mod[`write${adapter.charAt(0).toUpperCase()}${adapter.slice(1)}`] || mod[`write${adapter === 'webcomponent' ? 'WebComponents' : adapter.charAt(0).toUpperCase() + adapter.slice(1)}`];
    if (typeof writeFn !== 'function') {
      throw new Error(`Adapter ${adapter} does not export a write function.`);
    }
    writeFn({ component: opts.component, force: opts.force });
  } catch (err) {
    console.error(`\x1b[31mFailed to run ${adapter} adapter:\x1b[0m`, err);
    process.exit(1);
  }
}

main();
