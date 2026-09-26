#!/usr/bin/env node
/**
 * Better Component/Class Audit Tool
 * Focuses on semantic classes actually used in HTML/JSX/CSS
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..', '..');
const SCAN_DIRS = [
  'apps/p31ca/src',
  'apps/phosphorus31/src',
  'packages/design-core/src',
  'production/shell/src',
  'production/portals'
];

const IGNORE_DIRS = new Set(['node_modules', 'dist', '.astro', '.git', '.next', '.wrangler']);
const TAILWIND_PREFIXES = new Set([
  'absolute', 'relative', 'fixed', 'sticky',
  'flex', 'inline-flex', 'grid', 'inline-grid', 'flow-root',
  'hidden', 'block', 'inline-block', 'contents', 'table',
  'hover:', 'focus:', 'active:', 'disabled:', 'group-hover:', 'peer-',
  'sm:', 'md:', 'lg:', 'xl:', '2xl:',
  'bg-', 'text-', 'border-', 'rounded-',
  'p-', 'm-', 'px-', 'py-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-',
  'gap-', 'space-', 'divide-',
  'h-', 'w-', 'min-h-', 'max-h-', 'min-w-', 'max-w-',
  'top-', 'bottom-', 'left-', 'right-', 'inset-',
  'z-', 'opacity-', 'shadow-',
  'font-', 'leading-', 'tracking-', 'underline', 'no-underline', 'line-clamp-',
  'transition', 'duration-', 'ease-', 'animate-', 'delay-',
  'backdrop-', 'blur-', 'brightness-', 'contrast-', 'grayscale-',
  'translate-', 'rotate-', 'scale-', 'skew-',
  'list-', 'table-', 'caption-', 'col-', 'row-', 'cell-',
  'form-', 'input-', 'label-', 'legend-', 'field-', 'radio-', 'checkbox-',
  'file-', 'submit-', 'reset-', 'button-', 'link-',
  'break-', 'whitespace-', 'truncate-',
  'sr-', 'aria-', 'data-', 'role-',
  'cursor-', 'select-', 'resize-', 'overflow-', 'overscroll-',
  'fill-', 'stroke-',
  'from-', 'via-', 'to-',
  'mix-', 'object-', 'origin-',
  'appearance-', 'accent-',
  'columns-', 'grid-cols-', 'grid-rows-',
  'aspect-',
  'antialiased', 'subpixel-antialiased',
]);

const JS_KEYWORDS = new Set([
  'let', 'const', 'var', 'function', 'return', 'if', 'else', 'switch', 'case',
  'default', 'break', 'continue', 'while', 'do', 'for', 'in', 'of', 'try', 'catch',
  'finally', 'throw', 'new', 'class', 'extends', 'super', 'this', 'import', 'export',
  'static', 'get', 'set', 'async', 'await', 'yield', 'typeof', 'instanceof', 'void',
  'delete', 'null', 'undefined', 'true', 'false'
]);

const CSS_PROPERTIES = new Set([
  'align-items', 'align-self', 'align-content', 'justify-content', 'justify-items',
  'justify-self', 'place-items', 'place-content', 'place-self',
  'display', 'position', 'float', 'clear', 'box-sizing',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'background', 'background-color', 'background-image', 'background-size',
  'color', 'font', 'font-family', 'font-size', 'font-weight', 'line-height',
  'text-align', 'text-decoration', 'text-transform', 'letter-spacing',
  'opacity', 'visibility', 'overflow', 'overflow-x', 'overflow-y',
  'z-index', 'top', 'right', 'bottom', 'left',
  'transform', 'transition', 'animation',
  'cursor', 'pointer-events', 'user-select',
  'flex', 'flex-direction', 'flex-wrap', 'flex-grow', 'flex-shrink',
  'grid', 'grid-template', 'gap',
  'filter', 'backdrop-filter',
  'border-radius', 'box-shadow',
  'white-space', 'word-break', 'word-spacing',
  'content', 'counter-reset', 'counter-increment',
]);

function isTailwind(cls) {
  for (const prefix of TAILWIND_PREFIXES) {
    if (cls.startsWith(prefix)) return true;
  }
  if (/^(sm|md|lg|xl|2xl):[a-z-]+$/.test(cls)) return true;
  return false;
}

function isJsKeyword(cls) {
  return JS_KEYWORDS.has(cls);
}

function isCssProperty(cls) {
  return CSS_PROPERTIES.has(cls);
}

function isJunk(cls) {
  if (!cls || cls.length < 2) return true;
  if (cls.startsWith('[') && cls.endsWith(']')) return true;
  if (cls.startsWith('(') && cls.endsWith(')')) return true;
  if (cls.startsWith('{') && cls.endsWith('}')) return true;
  if (/^[A-Z_]+$/.test(cls)) return true;
  if (/^\d/.test(cls)) return true;
  if (cls.includes('(') || cls.includes(')')) return true;
  if (cls.includes('[') || cls.includes(']')) return true;
  if (cls.includes('{') || cls.includes('}')) return true;
  return false;
}

function scanDir(dir, classes = new Set()) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry)) continue;
      const fullPath = join(dir, entry);
      try {
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath, classes);
        } else if (/\.(css|scss|astro|tsx?|jsx?)$/.test(entry)) {
          const content = readFileSync(fullPath, 'utf-8');
          
          // Extract from class="..." or className="..."
          const classRegex = /class(?:Name)?="([^"]*)"/g;
          let match;
          while ((match = classRegex.exec(content)) !== null) {
            match[1].split(/\s+/).forEach(c => {
              c = c.trim();
              if (c && !isTailwind(c) && !isJunk(c) && !isJsKeyword(c) && !isCssProperty(c)) {
                classes.add(c);
              }
            });
          }
          
          // Extract from CSS selectors
          const cssRegex = /^\.([a-zA-Z_-][a-zA-Z0-9_-]*)/gm;
          while ((match = cssRegex.exec(content)) !== null) {
            const cls = match[1];
            if (!isTailwind(cls) && !isJunk(cls) && !isJsKeyword(cls) && !isCssProperty(cls)) {
              classes.add(cls);
            }
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
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
  console.log('🔍 Scanning source files for semantic CSS classes...\n');
  
  const usedClasses = new Set();
  for (const dir of SCAN_DIRS) {
    const fullPath = join(ROOT, dir);
    try {
      scanDir(fullPath, usedClasses);
    } catch (e) {
      console.log(`  ⚠️  Could not scan ${dir}: ${e.message}`);
    }
  }
  
  const recipesClasses = getRecipesClasses();
  
  // Find missing in recipes.css
  const missingInRecipes = [...usedClasses].filter(c => !recipesClasses.has(c));
  const inRecipes = [...usedClasses].filter(c => recipesClasses.has(c));
  
  console.log('═'.repeat(60));
  console.log(`Semantic classes used in source: ${usedClasses.size}`);
  console.log(`  ✅ In recipes.css: ${inRecipes.length}`);
  console.log(`  ❌ Missing from recipes.css: ${missingInRecipes.length}`);
  console.log('═'.repeat(60));
  
  if (missingInRecipes.length > 0) {
    console.log('\nMissing classes (add to recipes.css):\n');
    missingInRecipes.sort().forEach(c => console.log(`  .${c}`));
  }
  
  console.log('\n' + '═'.repeat(60));
}

main();
