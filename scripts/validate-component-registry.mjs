#!/usr/bin/env node
/**
 * Validate all components against canonical design-system.json
 * 
 * Usage:
 *   node scripts/validate-component-registry.mjs
 *   node scripts/validate-component-registry.mjs --path apps/phos/public/.well-known/design-system.json
 * 
 * Exit codes:
 *   0 - All components are token-valid
 *   1 - Missing or invalid tokens found
 */

import { readFileSync } from 'fs';
import { COMPONENTS } from '../workers/component-registry/src/registry.js';

const DEFAULT_DS_PATH = 'apps/phos/public/.well-known/design-system.json';
const dsPath = process.argv[2] || DEFAULT_DS_PATH;

console.error(`Loading design system from: ${dsPath}`);

let ds;
try {
  ds = JSON.parse(readFileSync(dsPath, 'utf8'));
} catch (e) {
  console.error(`Failed to load design-system.json: ${e.message}`);
  process.exit(1);
}

// Collect all valid CSS variable names from design-system.json
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

// Map component token references to actual CSS variable names
const TOKEN_MAP = {
  // Primitive colors
  'glass-surface': '--p31-primitive-color-glass_surface',
  'glass-border': '--p31-primitive-color-glass_border',
  'glass-border-hover': '--p31-primitive-color-glass_border_hover',
  'glass-surface-strong': '--p31-primitive-color-glass_surface_strong',
  'glass-surface-subtle': '--p31-primitive-color-glass_surface_subtle',
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
  // Spacing
  'spacing-xs': '--p31-spacing-xs',
  'spacing-sm': '--p31-spacing-sm',
  'spacing-md': '--p31-spacing-md',
  'spacing-lg': '--p31-spacing-lg',
  'spacing-xl': '--p31-spacing-xl',
  'spacing-2xl': '--p31-spacing-2xl',
  'spacing-3xl': '--p31-spacing-3xl',
  // Typography
  'font-sans': '--p31-typography-font_family-sans',
  'font-mono': '--p31-typography-font_family-mono',
  // Border radius (handle dot notation)
  'rounded-none': '--p31-border-radius-none',
  'rounded-xs': '--p31-border-radius-xs',
  'rounded-sm': '--p31-border-radius-sm',
  'rounded-md': '--p31-border-radius-md',
  'rounded-lg': '--p31-border-radius-lg',
  'rounded-xl': '--p31-border-radius-xl',
  'rounded-full': '--p31-border-radius-full',
  // Shadow
  'shadow-none': '--p31-shadow-none',
  'shadow-xs': '--p31-shadow-xs',
  'shadow-sm': '--p31-shadow-sm',
  'shadow-md': '--p31-shadow-md',
  'shadow-lg': '--p31-shadow-lg',
  'shadow-glow': '--p31-shadow-glow',
};

// Validate each component
let missing = [];
let warnings = [];

for (const comp of COMPONENTS) {
  for (const token of comp.tokens) {
    // Normalize dot notation to hyphens (e.g., rounded.lg -> rounded-lg)
    const normalizedToken = token.replace(/\./g, '-');
    
    // Check if token is in our mapping
    const mappedToken = TOKEN_MAP[normalizedToken] || TOKEN_MAP[token];
    
    if (mappedToken && allTokens.has(mappedToken)) {
      continue; // Token exists
    }
    
    // Check if it's a direct token name
    const directToken = `--p31-${token}`;
    if (allTokens.has(directToken)) {
      continue;
    }
    
    // Check if it's a known alias
    if (mappedToken) {
      missing.push({
        component: comp.name,
        token,
        cssVar: mappedToken,
        suggestion: `Component uses "${token}" which maps to ${mappedToken}`,
      });
    } else {
      missing.push({
        component: comp.name,
        token,
        cssVar: directToken,
        suggestion: 'Add to TOKEN_MAP or design-system.json',
      });
    }
  }
}

// Report results
console.log('\n=== Component Registry Validation ===\n');
console.log(`Total components: ${COMPONENTS.length}`);
console.log(`Total tokens in design-system.json: ${allTokens.size}`);
console.log(`Missing tokens: ${missing.length}`);
console.log(`Warnings: ${warnings.length}\n`);

if (missing.length > 0) {
  console.log('❌ MISSING TOKENS:');
  missing.forEach(({ component, token, cssVar, suggestion }) => {
    console.log(`  ${component}: ${token}`);
    console.log(`    → ${suggestion}`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  warnings.forEach(({ component, token, note }) => {
    console.log(`  ${component}: ${token} — ${note}`);
  });
  console.log('');
}

if (missing.length === 0) {
  console.log('✅ All components are token-valid.');
  process.exit(0);
} else {
  console.log('❌ Validation failed. Fix missing tokens before deploying.');
  process.exit(1);
}
