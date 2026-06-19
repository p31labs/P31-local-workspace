import { readFileSync, existsSync } from 'fs';
import { resolve, relative, dirname, basename, extname, sep } from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const fastGlob = require('fast-glob');
const { glob } = fastGlob;

const MAP_PATH = new URL('./phos-file-map.json', import.meta.url).pathname;

let _map = null;

export function loadMap(mapPath = MAP_PATH) {
  if (_map) return _map;
  const raw = readFileSync(mapPath, 'utf-8');
  _map = JSON.parse(raw);
  return _map;
}

export function resolveMapPath(groupName, pattern, filePath) {
  const map = loadMap();
  const group = map.pattern_groups[groupName];
  if (!group) return null;

  const base = group.base || '';
  const parsed = pattern.dest;
  const baseAbs = resolve(map.repo_root, base);

  const baseName = basename(filePath, extname(filePath));
  const ext = extname(filePath).slice(1);

  // Extract the directory prefix from the glob pattern
  // e.g., "src/components/**/*.tsx" → "src/components"
  const globStr = pattern.glob;
  const starIndex = globStr.search(/[*{]/);
  const globPrefix = starIndex >= 0 ? globStr.slice(0, starIndex - 1) : dirname(globStr);

  const relToBase = relative(baseAbs, filePath);
  const subpath = relToBase.startsWith(globPrefix)
    ? relToBase.slice(globPrefix.length + 1)
    : relToBase;
  const subDir = dirname(subpath);

  let relValue = subDir === '.' ? '' : subDir;

  let dest = parsed
    .replace('{base}', base)
    .replace('{relative}', relValue)
    .replace('{basename}', baseName)
    .replace('{ext}', ext)
    .replace(/(\/)+/g, '/')
    .replace(/\/$/, '');

  // Pattern-specific interpolation
  if (pattern.dest.includes('{source_dir}')) {
    const parts = relative(map.repo_root, filePath).split(sep);
    const srcIndex = parts.indexOf('src');
    if (srcIndex !== -1 && parts[srcIndex + 1]) {
      dest = parsed
        .replace('{base}', base)
        .replace('{source_dir}', parts[srcIndex + 1])
        .replace('{basename}', baseName)
        .replace('{ext}', ext);
    }
  }

  if (pattern.dest.includes('{project}')) {
    const parts = relative(map.repo_root, filePath).split(sep);
    const groupBaseIndex = parts.indexOf(base);
    if (groupBaseIndex !== -1 && parts[groupBaseIndex + 1]) {
      dest = parsed
        .replace('{base}', base)
        .replace('{project}', parts[groupBaseIndex + 1])
        .replace('{relative}', '')
        .replace('{basename}', baseName)
        .replace('{ext}', ext);
    }
  }

  if (pattern.dest.includes('{parent}')) {
    const parentDir = basename(dirname(filePath));
    dest = parsed
      .replace('{base}', base)
      .replace('{parent}', parentDir)
      .replace('{basename}', baseName)
      .replace('{ext}', ext);
  }

  if (pattern.dest.includes('{package}')) {
    const parts = relative(map.repo_root, filePath).split(sep);
    const pkgIndex = parts.indexOf('packages');
    if (pkgIndex !== -1 && parts[pkgIndex + 1]) {
      const pkgRel = parts.slice(pkgIndex + 2).join('/');
      dest = parsed
        .replace('{base}', base)
        .replace('{package}', parts[pkgIndex + 1])
        .replace('{relative}', dirname(pkgRel))
        .replace('{basename}', baseName)
        .replace('{ext}', ext);
    }
  }

  return resolve(map.repo_root, dest);
}

let _patternIndex = null;

async function buildPatternIndex() {
  if (_patternIndex) return _patternIndex;
  const map = loadMap();
  const index = [];

  for (const [groupName, group] of Object.entries(map.pattern_groups)) {
    for (const pattern of group.patterns) {
      const cwd = resolve(map.repo_root, group.base || '');
      const matches = await glob(pattern.glob, {
        cwd,
        absolute: false,
        ignore: pattern.exclude || [],
      });
      for (const match of matches) {
        index.push({
          absPath: resolve(cwd, match),
          relPath: match,
          group: groupName,
          type: pattern.type,
          pattern,
        });
      }
    }
  }

  _patternIndex = index;
  return index;
}

export function clearIndex() {
  _patternIndex = null;
}

export async function classifyFile(filePath) {
  const map = loadMap();
  const absPath = resolve(filePath);
  const relPath = relative(map.repo_root, absPath);

  // Check if this file is in a drop zone (outside repo root)
  const isInDropZone = map.drop_zones?.some(
    (dz) => absPath.startsWith(resolve(dz.replace(/^~/, process.env.HOME || '/home/p31')))
  );

  // For files within the repo, skip hidden/config/build dirs
  if (!isInDropZone) {
    if (
      relPath.startsWith('.') ||
      relPath.includes('node_modules') ||
      relPath.includes('.git') ||
      relPath.startsWith('dist') ||
      relPath.startsWith('target') ||
      relPath.includes('.wrangler')
    ) {
      return { classified: false, reason: 'ignored_path' };
    }
  }

  const index = await buildPatternIndex();
  const match = index.find((e) => e.absPath === absPath);
  if (match) {
    const dest = resolveMapPath(match.group, match.pattern, absPath);
    if (dest && dest !== absPath) {
      return {
        classified: true,
        oldPath: absPath,
        newPath: dest,
        group: match.group,
        type: match.type,
        reason: 'matched_pattern',
      };
    }
    return {
      classified: true,
      oldPath: absPath,
      newPath: absPath,
      group: match.group,
      type: match.type,
      reason: 'already_canonical',
    };
  }

  // For files outside the repo (drop zones), try to classify by extension
  if (isInDropZone) {
    const ext = extname(filePath);
    const baseName = basename(filePath, ext);

    // Determine likely destination based on name conventions
    if (ext === '.tsx') {
      if (baseName.endsWith('.test') || baseName.endsWith('.spec')) {
        // Test file — needs more context to determine which __tests__ dir
        return { classified: false, reason: 'drop_zone_test', oldPath: absPath };
      }
      if (baseName.endsWith('Surface') || baseName.endsWith('Ingest') || baseName.endsWith('Stream')) {
        const dest = resolve(map.repo_root, `phos/src/surfaces/${baseName}${ext}`);
        return { classified: true, oldPath: absPath, newPath: dest, group: 'phos_frontend', type: 'surface', reason: 'drop_zone_by_name' };
      }
      // Default: component
      const dest = resolve(map.repo_root, `phos/src/components/${baseName}${ext}`);
      return { classified: true, oldPath: absPath, newPath: dest, group: 'phos_frontend', type: 'component', reason: 'drop_zone_by_name' };
    }

    if (ext === '.ts') {
      if (baseName.endsWith('.test') || baseName.endsWith('.spec')) {
        return { classified: false, reason: 'drop_zone_test', oldPath: absPath };
      }
      if (baseName.startsWith('use')) {
        const dest = resolve(map.repo_root, `phos/src/hooks/${baseName}${ext}`);
        return { classified: true, oldPath: absPath, newPath: dest, group: 'phos_frontend', type: 'hook', reason: 'drop_zone_by_name' };
      }
      const dest = resolve(map.repo_root, `phos/src/lib/${baseName}${ext}`);
      return { classified: true, oldPath: absPath, newPath: dest, group: 'phos_frontend', type: 'lib', reason: 'drop_zone_by_name' };
    }

    if (ext === '.css') {
      const dest = resolve(map.repo_root, `phos/src/styles/${baseName}${ext}`);
      return { classified: true, oldPath: absPath, newPath: dest, group: 'phos_frontend', type: 'style', reason: 'drop_zone_by_name' };
    }

    if (ext === '.astro') {
      const dest = resolve(map.repo_root, `phos/src/pages/${baseName}${ext}`);
      return { classified: true, oldPath: absPath, newPath: dest, group: 'phos_frontend', type: 'page', reason: 'drop_zone_by_name' };
    }

    return { classified: false, reason: 'drop_zone_unrecognized', oldPath: absPath };
  }

  return { classified: false, reason: 'no_match' };
}

export async function scanRepo() {
  const map = loadMap();
  const root = map.repo_root;

  // Collect all tracked files from git
  const { execSync } = await import('child_process');
  let trackedFiles = [];
  try {
    const out = execSync('git ls-files --cached --others --exclude-standard', {
      cwd: root,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    trackedFiles = out.trim().split('\n').filter(Boolean);
  } catch {
    // Fallback: walk the directory
    const { readdirSync, statSync } = await import('fs');
    function walk(dir) {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = resolve(dir, entry.name);
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        if (entry.isDirectory()) walk(full);
        else trackedFiles.push(relative(root, full));
      }
    }
    walk(root);
  }

  const results = [];
  for (const relPath of trackedFiles) {
    const absPath = resolve(root, relPath);
    const result = await classifyFile(absPath);
    results.push(result);
  }

  return {
    total: results.length,
    classified: results.filter((r) => r.classified).length,
    unclassified: results.filter((r) => !r.classified).length,
    needsMove: results.filter(
      (r) => r.classified && r.oldPath !== r.newPath
    ).length,
    items: results,
  };
}
