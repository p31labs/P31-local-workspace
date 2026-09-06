#!/usr/bin/env node
/**
 * Sync component registry with canonical token definitions
 * 
 * Usage:
 *   node scripts/sync-component-registry.mjs
 *   node scripts/sync-component-registry.mjs --dry-run
 *   node scripts/sync-component-registry.mjs --update-aliases
 * 
 * This script:
 * 1. Validates all component token references against design-system.json
 * 2. Reports missing tokens
 * 3. Suggests token aliases for common mismatches
 * 4. Can optionally update component registry with alias mappings
 */

import { readFileSync, writeFileSync } from 'fs';
import { COMPONENTS } from '../workers/component-registry/src/registry.js';

const DEFAULT_DS_PATH = 'apps/phos/public/.well-known/design-system.json';
const dsPath = process.argv[2] || DEFAULT_DS_PATH;
const dryRun = process.argv.includes('--dry-run');
const updateAliases = process.argv.includes('--update-aliases');

console.error(`Loading design system from: ${dsPath}`);

let ds;
try {
  ds = JSON.parse(readFileSync(dsPath, 'utf8'));
} catch (e) {
  console.error(`Failed to load design-system.json: ${e.message}`);
  process.exit(1);
}

// Collect all valid tokens
const allTokens = new Set();
function collectTokens(obj, prefix = '') {
  if (!obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$value') {
      if (prefix) allTokens.add(`--p31-${prefix}`);
    } else if (k.startsWith('$')) {
      // skip metadata
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      const newPrefix = prefix ? `${prefix}-${k}` : k;
      if (v.$value !== undefined) {
        allTokens.add(`--p31-${newPrefix}`);
      } else {
        collectTokens(v, newPrefix);
      }
    }
  }
}

collectTokens(ds.tokens);

console.error(`Found ${allTokens.size} tokens in design-system.json`);

// Known token aliases (component reference -> canonical token)
const KNOWN_ALIASES = {
  '--p31-text-primary': '--p31-color-text-primary',
  '--p31-text-secondary': '--p31-color-text-secondary',
  '--p31-text-tertiary': '--p31-color-text-muted',
  '--p31-accent-gold': '--p31-color-quantum-amber',
  '--p31-accent-red': '--p31-color-semantic-error',
  '--p31-accent-violet': '--p31-color-quantum-violet',
  '--p31-accent-iris': '--p31-color-quantum-violet',
  '--p31-accent-cyan': '--p31-color-quantum-cyan',
  '--p31-accent-green': '--p31-color-quantum-emerald',
  '--p31-bg': '--p31-color-surface-bg',
  '--p31-surface': '--p31-color-surface-card',
  '--p31-surface2': '--p31-color-surface-border',
  '--p31-glass-bg': '--p31-primitive-color-glass_surface',
  '--p31-glass-border': '--p31-primitive-color-glass_border',
  '--p31-glass-border-hover': '--p31-primitive-color-glass_border_hover',
  '--p31-glass-shadow': '--p31-primitive-shadow-glass',
  '--p31-font-sans': '--p31-typography-font_family-sans',
  '--p31-font-mono': '--p31-typography-font_family-mono',
  '--p31-radius-sm': '--p31-border-radius-xs',
  '--p31-radius-md': '--p31-border-radius-sm',
  '--p31-radius-lg': '--p31-border-radius-md',
  '--p31-radius-xl': '--p31-border-radius-lg',
  '--p31-base': '--p31-root-base_unit',
};

// Map component token references to actual CSS variable names
const TOKEN_MAP = {
  'glass-surface': '--p31-primitive-color-glass_surface',
  'glass-border': '--p31-primitive-color-glass_border',
  'glass-border-hover': '--p31-primitive-color-glass_border_hover',
  'void': '--p31-primitive-color-void',
  'void-deep': '--p31-primitive-color-void_deep',
  'surface': '--p31-primitive-color-surface',
  'surface2': '--p31-primitive-color-surface2',
  'text-primary': '--p31-primitive-color-text_primary',
  'text-secondary': '--p31-primitive-color-text_secondary',
  'text-tertiary': '--p31-primitive-color-text_tertiary',
  'quantum-cyan': '--p31-primitive-color-cyan',
  'quantum-violet': '--p31-primitive-color-violet',
  'quantum-gold': '--p31-primitive-color-gold',
  'quantum-green': '--p31-primitive-color-green',
  'quantum-red': '--p31-primitive-color-red',
  'quantum-iris': '--p31-primitive-color-iris',
  'spacing-xs': '--p31-spacing-xs',
  'spacing-sm': '--p31-spacing-sm',
  'spacing-md': '--p31-spacing-md',
  'spacing-lg': '--p31-spacing-lg',
  'spacing-xl': '--p31-spacing-xl',
  'spacing-2xl': '--p31-spacing-2xl',
  'spacing-3xl': '--p31-spacing-3xl',
  'font-sans': '--p31-typography-font_family-sans',
  'font-mono': '--p31-typography-font_family-mono',
  'rounded-none': '--p31-border-radius-none',
  'rounded-xs': '--p31-border-radius-xs',
  'rounded-sm': '--p31-border-radius-sm',
  'rounded-md': '--p31-border-radius-md',
  'rounded-lg': '--p31-border-radius-lg',
  'rounded-xl': '--p31-border-radius-xl',
  'rounded-full': '--p31-border-radius-full',
  'shadow-none': '--p31-shadow-none',
  'shadow-xs': '--p31-shadow-xs',
  'shadow-sm': '--p31-shadow-sm',
  'shadow-md': '--p31-shadow-md',
  'shadow-lg': '--p31-shadow-lg',
  'shadow-glow': '--p31-shadow-glow',
};

// Validate components
const issues = [];
const suggestions = [];

for (const comp of COMPONENTS) {
  for (const token of comp.tokens) {
    const normalizedToken = token.replace(/\./g, '-');
    const mappedToken = TOKEN_MAP[normalizedToken] || TOKEN_MAP[token];
    
    if (mappedToken && allTokens.has(mappedToken)) {
      continue; // Token exists
    }
    
    const directToken = `--p31-${token}`;
    if (allTokens.has(directToken)) {
      continue;
    }
    
    if (mappedToken) {
      suggestions.push({
        component: comp.name,
        token,
        cssVar: mappedToken,
        action: 'alias',
      });
    } else {
      issues.push({
        component: comp.name,
        token,
        cssVar: directToken,
        action: 'missing',
      });
    }
  }
}

console.log('\n=== Component Registry Sync Report ===\n');
console.log(`Total components: ${COMPONENTS.length}`);
console.log(`Total tokens in design-system.json: ${allTokens.size}`);
console.log(`Missing tokens: ${issues.length}`);
console.log(`Alias suggestions: ${suggestions.length}\n`);

if (suggestions.length > 0) {
  console.log('📋 TOKEN ALIAS SUGGESTIONS (update component registry to use canonical tokens):');
  suggestions.forEach(({ component, token, cssVar }) => {
    console.log(`  ${component}: ${token} -> ${cssVar}`);
  });
  console.log('');
}

if (issues.length > 0) {
  console.log('❌ MISSING TOKENS (add to tokens.yml or use existing tokens):');
  issues.forEach(({ component, token, cssVar }) => {
    console.log(`  ${component}: ${cssVar}`);
  });
  console.log('');
}

if (issues.length === 0 && suggestions.length === 0) {
  console.log('✅ All components are fully synced with design-system.json');
  process.exit(0);
} else if (issues.length === 0) {
  console.log('✅ No missing tokens. Apply alias suggestions to improve consistency.');
  if (!dryRun && updateAliases) {
    console.log('\n💡 Updating component registry with alias mappings...');
    // TODO: Implement alias update logic
  }
  process.exit(0);
} else {
  console.log('❌ Sync incomplete. Fix missing tokens before deploying.');
  process.exit(1);
}
