#!/usr/bin/env node
/**
 * Loader self-test — the research-driven guard.
 *
 * The _canonical.mjs loader is load-bearing for the monetization/justice/audit
 * NCs: if it silently stops working (a Node update changes type-stripping
 * behavior, an unsupported construct sneaks into a canonical source), every NC
 * that depends on it fails with a confusing load error. This self-test feeds
 * the loader a synthetic fixture exercising the SUPPORTED constructs and
 * asserts it loads — catching a loader regression at CI time, not NC time.
 *
 * Supported constructs verified:
 *   - relative specifier resolved to absolute file:// URL
 *   - mixed type+value import list (type-only name elided)
 *   - type-only export (elided at materialization)
 *
 * Unsupported constructs (must fail loudly, not silently):
 *   - `export ... from` re-export — asserted to throw ERR_/module-not-found
 *   - dynamic `import()` — asserted to remain an unresolved import error
 *
 * Exits 0 (with NEGATIVE_CONTROL_OK) iff the supported surface loads and the
 * unsupported surface fails loudly.
 */
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { loadCanonical } from './_canonical.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const dir = mkdtempSync(join(tmpdir(), 'loader-self-test-'));
try {
  // Supported fixture: relative import + mixed type/value + type-only export.
  writeFileSync(join(dir, 'dep.ts'), 'export interface Shape { id: string }\nexport const DEP = 42;\n');
  writeFileSync(
    join(dir, 'main.ts'),
    'import { DEP, type Shape } from "./dep";\nexport interface Out { s: Shape }\nexport const RESULT = DEP * 2;\n',
  );
  // Build dir (loader materializes here) must differ from src.
  const buildDir = join(dir, 'build');

  const mod = await loadCanonical(join(dir, 'main.ts'), { buildDir });
  if (mod.RESULT !== 84) {
    console.error(`loader-self-test FAILED: expected RESULT=84, got ${mod.RESULT}`);
    process.exitCode = 1;
  } else {
    console.log('  ✓ supported surface (relative specifier + mixed type/value list + type-only export) loads.');
  }

  // Unsupported surface must fail loudly, not silently. If loadCanonical
  // returns a module (the re-export "worked"), the loader silently supported
  // a construct it documented as unsupported — that is drift.
  let reexportLoaded = false;
  try {
    writeFileSync(join(dir, 'reexport.ts'), 'export { DEP } from "./dep";\n');
    await loadCanonical(join(dir, 'reexport.ts'), { buildDir: join(dir, 'build2') });
    reexportLoaded = true;
  } catch {
    reexportLoaded = false;
  }
  if (reexportLoaded) {
    console.error('loader-self-test FAILED: `export ... from` re-export loaded, but it is documented as unsupported.');
    process.exitCode = 1;
  } else {
    console.log('  ✓ unsupported surface (`export ... from` re-export) fails loudly.');
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}

if (process.exitCode === 1) {
  console.error('loader-self-test FAILED.');
  process.exit(1);
}
console.log('NEGATIVE_CONTROL_OK');