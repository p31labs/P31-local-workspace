#!/usr/bin/env node
/**
 * deploy-a2ui-catalog.mjs
 *
 * Ensures `/.well-known/a2ui-catalog.json` is served correctly for all 5 P31
 * frontend apps. Detects deployment type (Pages vs Workers-with-assets) from
 * wrangler.toml and applies the appropriate fix.
 *
 * Usage:
 *   node scripts/deploy-a2ui-catalog.mjs          # audit mode
 *   node scripts/deploy-a2ui-catalog.mjs --fix    # apply fixes + rebuild
 *   node scripts/deploy-a2ui-catalog.mjs --help   # usage
 */

import { existsSync, readFileSync, writeFileSync, cpSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const APPS = ['phos', 'p31ca', 'willow', 'bonding', 'phosphorus31'];

const WELL_KNOWN_FILE = '.well-known/a2ui-catalog.json';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function readToml(filePath) {
  if (!existsSync(filePath)) return null;
  const raw = readFileSync(filePath, 'utf-8');
  const result = { raw, lines: raw.split('\n'), entries: {} };

  let currentSection = null;
  for (const line of result.lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    // Section header
    const sectionMatch = trimmed.match(/^\[(\w+(?:\.\w+)*)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    // Array-of-tables header
    const arrayMatch = trimmed.match(/^\[\[(\w+(?:\.\w+)*)\]\]$/);
    if (arrayMatch) {
      currentSection = arrayMatch[1];
      continue;
    }

    // Key = value
    const kvMatch = trimmed.match(/^(\w+)\s*=\s*"(.*)"$/);
    if (kvMatch && !currentSection) {
      result.entries[kvMatch[1]] = kvMatch[2];
    } else if (kvMatch && currentSection) {
      if (!result.entries[currentSection]) result.entries[currentSection] = {};
      result.entries[currentSection][kvMatch[1]] = kvMatch[2];
    }
  }

  return result;
}

function detectDeploymentType(toml) {
  if (!toml) return 'unknown';
  const entries = toml.entries;

  if (entries.pages_build_output_dir) return 'pages';
  if (entries.main) return 'worker';
  return 'static';
}

function headersEntry(path) {
  return [
    `# A2UI catalog — design system component metadata for AI agents`,
    `${path}`,
    `  Access-Control-Allow-Origin: *`,
    `  Content-Type: application/json; charset=utf-8`,
    `  Cache-Control: public, max-age=3600`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Fix functions
// ---------------------------------------------------------------------------

/**
 * Pages app: ensure `_headers` file has an entry for `/.well-known/a2ui-catalog.json`.
 */
function ensurePagesHeaders(appDir, appName) {
  const headersPath = join(appDir, 'public', '_headers');
  const entryPattern = `/.well-known/a2ui-catalog.json`;
  let changed = false;

  if (!existsSync(headersPath)) {
    // Create new _headers file
    const content = [
      `# ${appName} — Cloudflare Pages Headers`,
      `/*`,
      `  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
      `  X-Frame-Options: DENY`,
      `  X-Content-Type-Options: nosniff`,
      `  Referrer-Policy: strict-origin-when-cross-origin`,
      ``,
      headersEntry(entryPattern),
      '',
    ].join('\n');
    writeFileSync(headersPath, content, 'utf-8');
    console.log(`  ✓ Created public/_headers with A2UI entry`);
    changed = true;
  } else {
    const existing = readFileSync(headersPath, 'utf-8');
    if (!existing.includes(entryPattern)) {
      const updated = existing.trimEnd() + '\n\n' + headersEntry(entryPattern) + '\n';
      writeFileSync(headersPath, updated, 'utf-8');
      console.log(`  ✓ Added A2UI entry to public/_headers`);
      changed = true;
    } else {
      console.log(`  ✓ public/_headers already has A2UI entry`);
    }
  }
  return changed;
}

/**
 * Astro app: add `routes.extend.exclude` to astro.config.* for safety.
 */
function ensureAstroRoutesExclude(appDir) {
  const configFiles = ['astro.config.mjs', 'astro.config.ts', 'astro.config.js'];
  let configFile = null;
  for (const f of configFiles) {
    const p = join(appDir, f);
    if (existsSync(p)) { configFile = p; break; }
  }
  if (!configFile) {
    console.log(`  ⚠ No Astro config found (non-Astro app?)`);
    return false;
  }

  const content = readFileSync(configFile, 'utf-8');

  // Check if routes.extend.exclude already has .well-known
  if (content.includes('.well-known') || content.includes('routes')) {
    // Check if .well-known is in an exclude pattern
    if (content.includes('/.well-known/*') || content.includes('/.well-known/')) {
      console.log(`  ✓ Astro config already excludes .well-known routes`);
      return false;
    }
  }

  // We need to add routes.extend.exclude to the cloudflare() call
  // Pattern: adapter: cloudflare({ ... }) or adapter: cloudflare()
  // We need to find the cloudflare() call and add routes.extend.exclude

  // Check if cloudflare() already has arguments
  const hasArgs = /cloudflare\(\s*\{/.test(content);
  const excludeStr = `routes: { extend: { exclude: [{ pattern: '/.well-known/*' }] } }`;

  if (!hasArgs) {
    // Simple case: adapter: cloudflare() -> adapter: cloudflare({ routes: { ... } })
    const updated = content.replace(
      /cloudflare\s*\(\s*\)/,
      `cloudflare({ ${excludeStr} })`
    );
    if (updated !== content) {
      writeFileSync(configFile, updated, 'utf-8');
      console.log(`  ✓ Added routes.extend.exclude to cloudflare() adapter`);
      return true;
    }
  } else {
    // Already has args, try to add to existing object
    // Match: cloudflare({ ... })
    const match = content.match(/(cloudflare\s*\([\s\S]*?\{)([\s\S]*?)(\}\))/);
    if (match) {
      // Check if routes already exists
      if (match[2].includes('routes')) {
        // routes exists, but doesn't have .well-known (already checked above)
        // Try to add exclude pattern to existing routes
        const inner = match[2].replace(
          /(routes\s*:\s*\{[\s\S]*?)(\})\s*,?/,
          `$1, extend: { exclude: [{ pattern: '/.well-known/*' }] }$2,`
        );
        if (inner !== match[2]) {
          const updated = content.replace(match[0], match[1] + inner + match[3]);
          writeFileSync(configFile, updated, 'utf-8');
          console.log(`  ✓ Added .well-known exclude to existing routes config`);
          return true;
        }
      } else {
        // No routes key yet, add it
        const inner = match[2].trimEnd() + `,\n    ${excludeStr}\n  `;
        const updated = content.replace(match[0], match[1] + inner + match[3]);
        writeFileSync(configFile, updated, 'utf-8');
        console.log(`  ✓ Added routes.extend.exclude to cloudflare() adapter`);
        return true;
      }
    }
  }

  console.log(`  ⚠ Could not modify Astro config automatically`);
  return false;
}

/**
 * Worker-with-assets app: add `[assets]` directory config.
 * (None of the 5 apps currently use this pattern, but handle it.)
 */
function ensureWorkerAssetsException(toml, appDir) {
  // For Workers-with-assets, we need to add `[assets]` config with directory
  // pointing to the build output, so the Worker can serve static files.
  // Also need to ensure the Worker code calls env.ASSETS.fetch() for .well-known paths.

  const tomlPath = join(appDir, 'wrangler.toml');
  let content = readFileSync(tomlPath, 'utf-8');

  // Check if [assets] already exists
  if (content.includes('[assets]')) {
    console.log(`  ✓ Worker wrangler.toml already has [assets] section`);
  } else {
    // Add [assets] section pointing to build output
    const buildDir = toml.entries.pages_build_output_dir || 'dist';
    const assetsSection = `\n[assets]\ndirectory = "${buildDir}"\nbinding = "ASSETS"\n`;
    content += assetsSection;
    writeFileSync(tomlPath, content, 'utf-8');
    console.log(`  ✓ Added [assets] section pointing to ${buildDir}/`);
  }

  // Check for _routes.json in dist to add exclusion
  const routesJsonPath = join(appDir, 'dist', '_routes.json');
  if (existsSync(routesJsonPath)) {
    const routesJson = JSON.parse(readFileSync(routesJsonPath, 'utf-8'));
    if (!routesJson.exclude?.some(e => e.includes('.well-known'))) {
      routesJson.exclude = routesJson.exclude || [];
      routesJson.exclude.push('/.well-known/*');
      writeFileSync(routesJsonPath, JSON.stringify(routesJson, null, 2), 'utf-8');
      console.log(`  ✓ Added /.well-known/* to _routes.json exclude`);
    } else {
      console.log(`  ✓ _routes.json already excludes .well-known`);
    }
  }
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------
function verifyBuildOutput(appDir, appName, deployType, toml) {
  // Determine build output directory from wrangler.toml
  let buildDir = null;
  if (toml?.entries?.pages_build_output_dir) {
    buildDir = toml.entries.pages_build_output_dir;
  } else if (toml?.entries?.main && deployType === 'worker') {
    // Worker with assets — build dir might be configured in [assets]
    buildDir = 'dist';
  } else {
    buildDir = 'dist'; // convention
  }

  const wellKnownPath = join(appDir, buildDir, WELL_KNOWN_FILE);
  if (existsSync(wellKnownPath)) {
    const stats = readFileSync(wellKnownPath, 'utf-8');
    try {
      JSON.parse(stats);
      console.log(`  ✓ ${buildDir}/${WELL_KNOWN_FILE} — valid JSON`);
      return true;
    } catch {
      console.log(`  ✗ ${buildDir}/${WELL_KNOWN_FILE} exists but is invalid JSON`);
      return false;
    }
  }
  console.log(`  ✗ ${buildDir}/${WELL_KNOWN_FILE} not found in build output`);
  return false;
}

function rebuildApp(appDir, appName) {
  console.log(`  → Rebuilding ${appName}...`);
  try {
    execSync('npm run build 2>&1', { cwd: appDir, stdio: 'pipe', timeout: 120000 });
    console.log(`  ✓ Build succeeded`);
    return true;
  } catch (err) {
    const msg = err.stderr?.toString() || err.message || 'unknown error';
    console.error(`  ✗ Build failed: ${msg.slice(0, 200)}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const isFix = args.includes('--fix');
  const isHelp = args.includes('--help');

  if (isHelp) {
    console.log(`
Usage: node scripts/deploy-a2ui-catalog.mjs [--fix]

Audits all 5 frontend apps for A2UI catalog serving readiness.
With --fix, applies changes and rebuilds.

Commands:
  --fix   Apply fixes (add _headers entries, update configs, rebuild)
  --help  Show this help
`);
    return;
  }

  console.log('━━━ A2UI Catalog Deployment Audit ━━━\n');

  const results = [];

  for (const appName of APPS) {
    const appDir = join(ROOT, 'apps', appName);
    const tomlPath = join(appDir, 'wrangler.toml');

    console.log(`── ${appName} ──`);

    // 1. Read wrangler.toml
    const toml = readToml(tomlPath);
    if (!toml) {
      console.log(`  ⚠ No wrangler.toml found`);
      results.push({ app: appName, type: 'unknown', status: 'no wrangler.toml' });
      continue;
    }

    // 2. Detect deployment type
    const deployType = detectDeploymentType(toml);
    console.log(`  Type: ${deployType}`);

    // 3. Check if source file exists
    const sourcePath = join(appDir, 'public', WELL_KNOWN_FILE);
    const sourceExists = existsSync(sourcePath);
    console.log(`  Source: ${sourceExists ? '✅' : '❌'} public/${WELL_KNOWN_FILE}`);

    if (!sourceExists) {
      console.log(`  ✗ Source file missing — create it first`);
      results.push({ app: appName, type: deployType, status: 'source missing' });
      continue;
    }

    // 4. Apply fixes
    let changes = [];

    if (deployType === 'pages') {
      if (isFix) {
        const hChanged = ensurePagesHeaders(appDir, appName);
        if (hChanged) changes.push('_headers');

        // For Astro-based Pages apps, add routes.extend.exclude
        const hasAstro = existsSync(join(appDir, 'astro.config.mjs')) ||
                         existsSync(join(appDir, 'astro.config.ts'));
        if (hasAstro) {
          const aChanged = ensureAstroRoutesExclude(appDir);
          if (aChanged) changes.push('astro config');
        }
      }
    } else if (deployType === 'worker') {
      if (isFix) {
        ensureWorkerAssetsException(toml, appDir);
        changes.push('worker assets config');
      }
    }

    // 5. Verify build output (exists now or after fix)
    const outputOk = verifyBuildOutput(appDir, appName, deployType, toml);

    // 6. Rebuild if --fix and output missing
    if (isFix && !outputOk) {
      const rebuilt = rebuildApp(appDir, appName);
      if (rebuilt) changes.push('rebuild');
    }

    // Re-check after rebuild
    const finalOk = isFix ? verifyBuildOutput(appDir, appName, deployType, toml) : outputOk;

    const status = finalOk ? 'ready' : 'needs rebuild';
    console.log(`  Status: ${status === 'ready' ? '✅ ready' : '⚠ needs rebuild'}`);
    if (changes.length) console.log(`  Changes: ${changes.join(', ')}`);
    console.log();

    results.push({ app: appName, type: deployType, status, changes });
  }

  // Summary
  console.log('━━━ Summary ━━━\n');
  for (const r of results) {
    const icon = r.status === 'ready' ? '✅' : r.status === 'needs rebuild' ? '⚠' : '❌';
    console.log(`  ${icon} ${r.app} (${r.type}): ${r.status}${r.changes?.length ? ' [' + r.changes.join(', ') + ']' : ''}`);
  }
  console.log();

  const ready = results.filter(r => r.status === 'ready').length;
  const needsBuild = results.filter(r => r.status === 'needs rebuild').length;
  console.log(`${results.length} apps — ${ready} ready, ${needsBuild} need rebuild`);
  console.log(isFix ? 'Fixes applied.' : 'Run with --fix to apply changes and rebuild.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
