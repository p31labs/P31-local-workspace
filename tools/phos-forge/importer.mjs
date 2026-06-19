import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, relative, extname, sep } from 'path';

const IMPORT_PATTERNS = [
  // ES import: import ... from 'path'
  /^(import\s+(?:(?:\{[^}]*\}|[^;{]+)\s+from\s+)?['"])([^'"]+)(['"])/gm,
  // Dynamic import: import('path')
  /(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,
  // require: require('path')
  /(require\s*\(\s*['"])([^'"]+)(['"]\s*\))/g,
  // Astro frontmatter imports
  /^(---\s*\nimport\s+(?:\{[^}]*\}|[^;{]+)\s+from\s+['"])([^'"]+)(['"])/gm,
];

export function resolveImportPath(importPath, importerFile, oldAbsPath, newAbsPath) {
  const importerDir = importerFile.substring(0, importerFile.lastIndexOf(sep) + 1);

  // If the import is relative (starts with ./ or ../)
  if (importPath.startsWith('.')) {
    const oldRelativeToImporter = resolve(importerDir, importPath);
    const newRelativeToImporter = relative(importerDir, newAbsPath);

    // Make it relative
    let newRel = newRelativeToImporter.startsWith('.')
      ? newRelativeToImporter
      : './' + newRelativeToImporter;

    // Remove extension if original didn't have one (common in TS imports)
    const oldExt = extname(importPath);
    const newExt = extname(newRel);
    if (!oldExt && newExt) {
      newRel = newRel.slice(0, -newExt.length);
    }

    return newRel;
  }

  // Non-relative imports (bare module specifiers like '@/components/...' or 'react')
  // Check if the import path resolves to the old file via an alias
  // For now, only handle relative imports
  return null;
}

export function updateImportsInFile(filePath, oldAbsPath, newAbsPath) {
  if (!existsSync(filePath)) return { updated: false, reason: 'not_found' };

  const ext = extname(filePath);
  const supportedExts = ['.ts', '.tsx', '.js', '.jsx', '.astro', '.mjs'];
  if (!supportedExts.includes(ext)) return { updated: false, reason: 'unsupported_type' };

  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return { updated: false, reason: 'read_error' };
  }

  let updated = false;
  let newContent = content;

  for (const regex of IMPORT_PATTERNS) {
    newContent = newContent.replace(regex, (match, prefix, importPath, suffix) => {
      const resolved = resolveImportPath(importPath, filePath, oldAbsPath, newAbsPath);
      if (resolved && resolved !== importPath) {
        updated = true;
        return prefix + resolved + suffix;
      }
      return match;
    });
  }

  if (updated) {
    try {
      writeFileSync(filePath, newContent, 'utf-8');
    } catch {
      return { updated: false, reason: 'write_error' };
    }
  }

  return { updated, changes: updated ? 1 : 0 };
}

export async function updateAllImports(oldAbsPath, newAbsPath, repoRoot) {
  const { createRequire } = await import('module');
  const require = createRequire(import.meta.url);
  const { glob } = require('fast-glob');

  const sourceFiles = await glob('**/*.{ts,tsx,js,jsx,astro,mjs}', {
    cwd: repoRoot,
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.git/**',
      '**/target/**',
      '**/.wrangler/**',
      '**/.astro/**',
      '**/coverage/**',
    ],
    absolute: true,
  });

  let totalChanges = 0;
  let updatedFiles = 0;

  for (const filePath of sourceFiles) {
    const result = updateImportsInFile(filePath, oldAbsPath, newAbsPath);
    if (result.updated) {
      totalChanges += result.changes || 0;
      updatedFiles++;
    }
  }

  return { updatedFiles, totalChanges };
}
