#!/usr/bin/env node
/**
 * Component/Class Audit Tool
 * Scans all source files across the monorepo for CSS class usage
 * and compares against packages/design-core/src/css/recipes.css
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');
const SCAN_DIRS = [
  'production/shell/src',
  'production/portals',
  'apps/p31ca/src',
  'apps/phosphorus31/src',
  'packages/design-core/src'
];

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.astro', '.git']);
const CLASS_REGEX = /class(?:Name)?="([^"]*)"/g;
const CSS_CLASS_REGEX = /([.#]?[a-zA-Z_-][a-zA-Z0-9_-]*)\s*[:{]/g;

function scanDir(dir, classes = new Set()) {
  if (IGNORE_DIRS.has(dir.split('/').pop())) return classes;
  
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath, classes);
        } else if (/\.(css|scss|astro|tsx?|jsx?)$/.test(entry)) {
          const content = readFileSync(fullPath, 'utf-8');
          let match;
          
          // Extract from class="..." or className="..."
          while ((match = CLASS_REGEX.exec(content)) !== null) {
            const classNames = match[1].split(/\s+/).filter(c => c);
            classNames.forEach(c => classes.add(c));
          }
          
          // Extract from CSS selectors
          while ((match = CSS_CLASS_REGEX.exec(content)) !== null) {
            const className = match[1].replace(/^[.#]/, '');
            if (className && !className.startsWith('--')) {
              classes.add(className);
            }
          }
        }
      } catch (e) {
        // skip files we can't read
      }
    }
  } catch (e) {
    // skip dirs we can't read
  }
  return classes;
}

function getRecipesClasses() {
  const recipesPath = join(ROOT, 'packages/design-core/src/css/recipes.css');
  try {
    const content = readFileSync(recipesPath, 'utf-8');
    const classes = new Set();
    const regex = /^\.([a-zA-Z_-][a-zA-Z0-9_-]*)/gm;
    let match;
    while ((match = regex.exec(content)) !== null) {
      classes.add(match[1]);
    }
    return classes;
  } catch (e) {
    return new Set();
  }
}

function main() {
  console.log('🔍 Scanning source files for CSS classes...\n');
  
  const usedClasses = new Set();
  for (const dir of SCAN_DIRS) {
    const fullPath = join(ROOT, dir);
    try {
      scanDir(fullPath, usedClasses);
    } catch (e) {
      console.log(`  ⚠️  Could not scan ${dir}: ${e.message}`);
    }
  }
  
  console.log(`   Found ${usedClasses.size} unique classes in source files\n`);
  
  const recipesClasses = getRecipesClasses();
  console.log(`   Found ${recipesClasses.size} classes in recipes.css\n`);
  
  // Filter out Tailwind utilities (keep semantic/brand classes)
  const tailwindPrefixes = [
    'absolute', 'relative', 'fixed', 'sticky',
    'flex', 'inline-flex', 'grid', 'inline-grid',
    'hidden', 'block', 'inline-block', 'contents',
    'hover:', 'focus:', 'active:', 'disabled:', 'group-hover:',
    'sm:', 'md:', 'lg:', 'xl:', '2xl:',
    'bg-', 'text-', 'border-', 'rounded-',
    'p-', 'm-', 'px-', 'py-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
    'gap-', 'space-',
    'h-', 'w-', 'min-h-', 'max-h-', 'min-w-', 'max-w-',
    'top-', 'bottom-', 'left-', 'right-',
    'z-', 'opacity-', 'shadow-',
    'font-', 'leading-', 'tracking-', 'underline', 'no-underline',
    'transition', 'duration-', 'ease-', 'animate-', 'delay-',
    'backdrop-', 'blur-', 'brightness-', 'contrast-', 'grayscale-',
    'inset-', 'translate-', 'rotate-', 'scale-',
    'list-', 'table-', 'caption-', 'col-', 'row-', 'cell-',
    'form-', 'input-', 'label-', 'legend-', 'field-', 'radio-', 'checkbox-',
    'file-', 'submit-', 'reset-', 'button-', 'link-',
    'break-', 'whitespace-', 'truncate-', 'line-clamp-',
    'sr-', 'aria-', 'data-', 'role-',
    'cursor-', 'select-', 'resize-', 'overflow-', 'overscroll-',
    'fill-', 'stroke-',
    'from-', 'via-', 'to-', 'via-',
    'mix-', 'object-', 'origin-', 'scale-', 'rotate-', 'translate-',
    'skew-', 'transform',
    'appearance-', 'accent-',
    'columns-', 'grid-cols-', 'grid-rows-',
    'aspect-',
  ];
  
  const isTailwind = (cls) => {
    if (recipesClasses.has(cls)) return false;
    for (const prefix of tailwindPrefixes) {
      if (cls.startsWith(prefix)) return true;
    }
    if (/^(sm|md|lg|xl|2xl):[a-z-]+$/.test(cls)) return true;
    return false;
  };
  
  const semanticClasses = [...usedClasses].filter(c => !isTailwind(c) && c.length > 0);
  
  // Find missing in recipes.css
  const missingInRecipes = semanticClasses.filter(c => !recipesClasses.has(c));
  const inRecipes = semanticClasses.filter(c => recipesClasses.has(c));
  
  console.log('═'.repeat(60));
  console.log(`Semantic classes used (non-Tailwind): ${semanticClasses.length}`);
  console.log(`  ✅ In recipes.css: ${inRecipes.length}`);
  console.log(`  ❌ Missing from recipes.css: ${missingInRecipes.length}`);
  console.log('═'.repeat(60));
  
  if (missingInRecipes.length > 0) {
    console.log('\nMissing classes (add these to recipes.css):\n');
    missingInRecipes.sort().forEach(c => console.log(`  .${c}`));
  }
  
  // Check for hardcoded hex values in source files
  console.log('\n' + '═'.repeat(60));
  console.log('Checking for hardcoded hex colors...\n');
  const hexRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
  let hexCount = 0;
  for (const dir of SCAN_DIRS) {
    const fullPath = join(ROOT, dir);
    try {
      const entries = readdirSync(fullPath);
      for (const entry of entries) {
        const filePath = join(fullPath, entry);
        try {
          const stat = statSync(filePath);
          if (stat.isDirectory()) {
            scanForHex(filePath, hexRegex);
          } else if (/\.(css|scss|astro|tsx?|jsx?)$/.test(entry)) {
            scanForHexInFile(filePath, hexRegex);
          }
        } catch (e) {}
      }
    } catch (e) {}
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('Summary:');
  console.log(`  Total classes found: ${usedClasses.size}`);
  console.log(`  Semantic classes: ${semanticClasses.length}`);
  console.log(`  Missing from recipes.css: ${missingInRecipes.length}`);
  console.log('═'.repeat(60));
}

function scanForHex(dir, regex) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanForHex(fullPath, regex);
        } else if (/\.(css|scss|astro|tsx?|jsx?)$/.test(entry)) {
          scanForHexInFile(fullPath, regex);
        }
      } catch (e) {}
    }
  } catch (e) {}
}

function scanForHexInFile(filePath, regex) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const matches = content.match(regex);
    if (matches && matches.length > 0) {
      const relPath = relative(process.cwd(), filePath);
      console.log(`  ${relPath}: ${matches.length} hardcoded hex colors`);
      matches.slice(0, 5).forEach(m => console.log(`    - ${m}`));
      if (matches.length > 5) console.log(`    ... and ${matches.length - 5} more`);
    }
  } catch (e) {}
}

main();
