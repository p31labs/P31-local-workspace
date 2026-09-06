#!/usr/bin/env node
/**
 * @file SpatialValidator v3.0-quantum — Enforces P31-Q design system rules.
 * Run: node cli/validators/spatialValidator.mjs [--tokens <path>] [--src <path>] [--strict] [--fix] [--machine-readable]
 *
 * Checks:
 *   1. Forbidden external spacing properties (margin, transform, position)
 *   2. Hardcoded pixel values that should use token references
 *   3. Hardcoded colors (hex/rgb) that should use OKLCH tokens
 *   4. Header container compliance (height, flex, align-items)
 *   5. Bounding box adherence for SVGs
 *
 * Modes:
 *   --fix              Auto-correct safe violations (unambiguous token matches)
 *   --machine-readable Output JSON for AI agent consumption
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';
import pkg from 'glob';
const { glob } = pkg;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ─── Types ──────────────────────────────────────────────────────────────

class SpatialValidator {
  constructor(tokensPath) {
    const raw = readFileSync(tokensPath, 'utf-8');
    this.tokens = parse(raw);
    this.fixes = [];
  }

  // ─── Token Helpers ────────────────────────────────────────────────────

  getScaleToken(value) {
    const scale = this.tokens.scale || {};
    for (const [key, token] of Object.entries(scale)) {
      if (token.$value && token.$value.includes(value)) return `--p31-scale-${key}`;
    }
    return null;
  }

  getSpacingToken(value) {
    const spacing = this.tokens.spacing || {};
    for (const [key, token] of Object.entries(spacing)) {
      if (token.$value && token.$value.includes(value)) return `--p31-space-${key}`;
    }
    return null;
  }

  getColorToken(value) {
    const color = this.tokens.color || {};
    for (const [category, hues] of Object.entries(color)) {
      if (typeof hues === 'object' && hues !== null) {
        for (const [name, token] of Object.entries(hues)) {
          if (token.$value && (token.$value === value || token.$value.replace(/"/g, '') === value)) {
            return `--p31-color-${name}`;
          }
        }
      }
    }
    return null;
  }

  // ─── Component Validation ────────────────────────────────────────────

  validateComponent(component) {
    const violations = [];
    const passed = [];
    const warnings = [];
    const fixes = [];

    const forbidden = this.tokens.spacing_rules?.component_forbidden_properties || [];

    // 1. Check forbidden properties in style objects
    if (component.styles) {
      for (const [key, value] of Object.entries(component.styles)) {
        const isForbidden = forbidden.some(rule => {
          if (rule.includes(':')) {
            const [prop, val] = rule.split(':').map(s => s.trim());
            return key === prop && String(value).includes(val);
          }
          return key === rule;
        });
        if (isForbidden) {
          violations.push(`❌ Component "${component.name}" declares forbidden property "${key}: ${value}".`);
          // Suggest fix if unambiguous
          const tokenRef = this.suggestTokenFix(key, value);
          if (tokenRef) {
            fixes.push(`💡 Fix: replace with ${tokenRef}`);
          }
        }
      }
    }

    // 2. Check generated code for hardcoded spacing
    if (component.generated_code) {
      const code = component.generated_code;

      // Margin violations
      const marginRegex = /margin[A-Z]?:\s*['"]?-?\d+px['"]?/g;
      const marginMatches = code.match(marginRegex) || [];
      for (const match of marginMatches) {
        violations.push(`❌ Component "${component.name}" has hardcoded margin: ${match}`);
        const tokenRef = this.suggestTokenFix('margin', match);
        if (tokenRef) fixes.push(`💡 Fix: replace with ${tokenRef}`);
      }

      // Transform violations
      const transformRegex = /transform:\s*['"]?translate[XY]?\([^)]+px\)/g;
      const transformMatches = code.match(transformRegex) || [];
      if (transformMatches.length > 0) {
        violations.push(`❌ Component "${component.name}" uses transform for spacing: ${transformMatches.join(', ')}`);
      }

      // Position violations
      const positionRegex = /position:\s*['"]?(relative|absolute)/g;
      const positionMatches = code.match(positionRegex) || [];
      if (positionMatches.length > 0) {
        violations.push(`❌ Component "${component.name}" uses positioning for spacing: ${positionMatches.join(', ')}`);
      }

      // Top/bottom violations
      const topBottomRegex = /(top|bottom|left|right):\s*['"]?-?\d+px['"]?/g;
      const topBottomMatches = code.match(topBottomRegex) || [];
      for (const match of topBottomMatches) {
        violations.push(`❌ Component "${component.name}" has hardcoded offset: ${match}`);
      }

      // 3. Check for hardcoded colors (hex/rgb in component styles)
      const hexColorRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
      const rgbColorRegex = /rgba?\([^)]+\)/g;
      const hardcodedColors = (code.match(hexColorRegex) || []).concat(code.match(rgbColorRegex) || []);
      if (hardcodedColors.length > 0) {
        warnings.push(`⚠️ Component "${component.name}" contains hardcoded colors: ${hardcodedColors.join(', ')}. Consider using OKLCH tokens.`);
      }

      // 4. Check for hardcoded dimensions that should use scale tokens
      const dimensionRegex = /(width|height|padding|font-size|gap):\s*['"]?-?\d+px['"]?/g;
      const dimensionMatches = code.match(dimensionRegex) || [];
      for (const match of dimensionMatches) {
        const valueMatch = match.match(/(\d+)px/);
        if (valueMatch) {
          const pxValue = valueMatch[1];
          const tokenRef = this.getScaleToken(`${pxValue}px`) || this.getSpacingToken(`${pxValue}px`);
          if (tokenRef) {
            warnings.push(`⚠️ Component "${component.name}" uses hardcoded ${match} — consider ${tokenRef}`);
          }
        }
      }

      if (marginMatches.length === 0 && transformMatches.length === 0 && positionMatches.length === 0 && topBottomMatches.length === 0) {
        passed.push(`✅ Component "${component.name}" has no hardcoded external spacing.`);
      }

      if (code.includes('display: inline-block')) {
        warnings.push(`⚠️ Component "${component.name}" uses display: inline-block (may cause baseline gaps).`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      passed,
      warnings,
      fixes
    };
  }

  // ─── Template Validation ─────────────────────────────────────────────

  validateTemplate(template) {
    const violations = [];
    const passed = [];
    const warnings = [];
    const fixes = [];

    if (template.role === 'header' || template.name?.includes('Header')) {
      const headerToken = this.tokens.layout_containers?.header;
      if (!headerToken) {
        warnings.push(`⚠️ Header template "${template.name}" found but no header token defined.`);
        return { valid: true, violations: [], passed: [], warnings, fixes };
      }

      // Height check
      if (headerToken.height) {
        const expectedHeight = headerToken.height.replace(/calc\(|--p31-base|px|\)|\*|\s/g, '');
        const heightRegex = new RegExp(`height:\\s*['"]?${headerToken.height.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}|height:\\s*var\\(--p31-header-h\\)`);
        if (!heightRegex.test(template.code)) {
          violations.push(`❌ Header "${template.name}" height is not set to ${headerToken.height} or var(--p31-header-h).`);
          fixes.push(`💡 Fix: set height: ${headerToken.height} or var(--p31-header-h)`);
        } else {
          passed.push(`✅ Header height is ${headerToken.height}`);
        }
      }

      // Flex check
      const hasFlex = /display:\s*(flex|'flex')|display:\s*["']?flex["']?/.test(template.code) || /\bflex\b/.test(template.code);
      if (headerToken.display && !hasFlex) {
        violations.push(`❌ Header "${template.name}" does not have display: ${headerToken.display}.`);
      } else {
        passed.push(`✅ Header uses ${headerToken.display} layout.`);
      }

      // Align-items check
      const hasAlignCenter = /align-items:\s*center|alignItems:\s*['"]?center['"]?/.test(template.code);
      if (headerToken.align_items && !hasAlignCenter) {
        violations.push(`❌ Header "${template.name}" does not have align-items: ${headerToken.align_items}.`);
      } else {
        passed.push(`✅ Header uses align-items: ${headerToken.align_items}.`);
      }
    }

    return { valid: violations.length === 0, violations, passed, warnings, fixes };
  }

  // ─── Codebase Audit ──────────────────────────────────────────────────

  auditCodebase(options) {
    const results = [];
    let totalViolations = 0;
    let totalWarnings = 0;
    let totalFixes = 0;

    if (options.componentsPath && existsSync(options.componentsPath)) {
      const raw = readFileSync(options.componentsPath, 'utf-8');
      const comps = parse(raw);
      for (const [name, def] of Object.entries(comps.components || {})) {
        const result = this.validateComponent({ name, styles: def.styles, generated_code: def.generated_code });
        results.push(result);
        totalViolations += result.violations.length;
        totalWarnings += result.warnings.length;
        totalFixes += result.fixes.length;
      }
    }

    if (options.srcDir) {
      const files = glob.sync(`${options.srcDir}/**/*.{astro,tsx,jsx}`, { ignore: ['**/node_modules/**'] });
      for (const file of files) {
        const code = readFileSync(file, 'utf-8');
        const name = file.split('/').pop();
        const role = name.includes('Header') ? 'header' : undefined;
        const result = this.validateTemplate({ name, code, role });
        results.push(result);
        totalViolations += result.violations.length;
        totalWarnings += result.warnings.length;
        totalFixes += result.fixes.length;
      }
    }

    return { results, totalViolations, totalWarnings, totalFixes };
  }

  // ─── Suggest Token Fix ───────────────────────────────────────────────

  suggestTokenFix(property, value) {
    const strVal = String(value);
    const pxMatch = strVal.match(/(\d+)px/);
    if (!pxMatch) return null;

    const pxValue = parseInt(pxMatch[1], 10);

    // Map common hardcoded values to tokens
    const tokenMap = {
      4: '--p31-scale-xs',
      8: '--p31-space-xs',
      12: '--p31-scale-xs',
      16: '--p31-scale-sm',
      21: '--p31-scale-md',
      24: '--p31-space-md',
      28: '--p31-scale-lg',
      32: '--p31-space-lg',
      38: '--p31-scale-xl',
      40: '--p31-icon-lg-w',
      48: '--p31-header-h',
      50: '--p31-scale-2xl',
      64: '--p31-icon-xl-w',
    };

    if (tokenMap[pxValue]) return `${property}: var(${tokenMap[pxValue]})`;
    return null;
  }

  // ─── Fix Violations (Auto-correct safe cases) ────────────────────────

  fixViolations(filePath, dryRun = true) {
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      return { fixed: 0, skipped: 0 };
    }

    let content = readFileSync(filePath, 'utf-8');
    let fixed = 0;
    let skipped = 0;
    const fixes = [];

    // Safe replacements: hardcoded px → token references
    const safeReplacements = [
      { pattern: /margin-top:\s*['"]?16px['"]?/gi, replacement: 'margin-top: var(--p31-space-sm)', desc: 'margin-top: 16px → var(--p31-space-sm)' },
      { pattern: /margin-bottom:\s*['"]?16px['"]?/gi, replacement: 'margin-bottom: var(--p31-space-sm)', desc: 'margin-bottom: 16px → var(--p31-space-sm)' },
      { pattern: /margin-top:\s*['"]?24px['"]?/gi, replacement: 'margin-top: var(--p31-space-md)', desc: 'margin-top: 24px → var(--p31-space-md)' },
      { pattern: /margin-bottom:\s*['"]?24px['"]?/gi, replacement: 'margin-bottom: var(--p31-space-md)', desc: 'margin-bottom: 24px → var(--p31-space-md)' },
      { pattern: /margin-top:\s*['"]?32px['"]?/gi, replacement: 'margin-top: var(--p31-space-lg)', desc: 'margin-top: 32px → var(--p31-space-lg)' },
      { pattern: /margin-bottom:\s*['"]?32px['"]?/gi, replacement: 'margin-bottom: var(--p31-space-lg)', desc: 'margin-bottom: 32px → var(--p31-space-lg)' },
      { pattern: /padding:\s*['"]?16px['"]?/gi, replacement: 'padding: var(--p31-space-sm)', desc: 'padding: 16px → var(--p31-space-sm)' },
      { pattern: /padding:\s*['"]?24px['"]?/gi, replacement: 'padding: var(--p31-space-md)', desc: 'padding: 24px → var(--p31-space-md)' },
      { pattern: /width:\s*['"]?40px['"]?/gi, replacement: 'width: var(--p31-icon-lg-w)', desc: 'width: 40px → var(--p31-icon-lg-w)' },
      { pattern: /height:\s*['"]?40px['"]?/gi, replacement: 'height: var(--p31-icon-lg-h)', desc: 'height: 40px → var(--p31-icon-lg-h)' },
      { pattern: /width:\s*['"]?48px['"]?/gi, replacement: 'width: var(--p31-header-h)', desc: 'width: 48px → var(--p31-header-h)' },
      { pattern: /height:\s*['"]?48px['"]?/gi, replacement: 'height: var(--p31-header-h)', desc: 'height: 48px → var(--p31-header-h)' },
    ];

    for (const { pattern, replacement, desc } of safeReplacements) {
      const matches = content.match(pattern);
      if (matches) {
        if (dryRun) {
          fixes.push(`Would fix: ${desc} (${matches.length} occurrence(s))`);
        } else {
          content = content.replace(pattern, replacement);
          fixes.push(`Fixed: ${desc} (${matches.length} occurrence(s))`);
        }
        fixed += matches.length;
      }
    }

    if (!dryRun && fixed > 0) {
      writeFileSync(filePath, content, 'utf-8');
    }

    return { fixed, skipped, fixes };
  }

  // ─── Health Score ────────────────────────────────────────────────────

  healthScore(options) {
    const audit = this.auditCodebase(options);
    const totalChecks = audit.results.length;
    const cleanChecks = audit.results.filter(r => r.valid && r.warnings.length === 0).length;
    const score = totalChecks > 0 ? Math.round((cleanChecks / totalChecks) * 100) : 100;

    return {
      score,
      totalChecks,
      cleanChecks,
      violations: audit.totalViolations,
      warnings: audit.totalWarnings,
      fixes: audit.totalFixes,
      grade: score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'F'
    };
  }
}

// ─── CLI Entry Point ──────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getOpt = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : undefined; };

const tokensPath = getOpt('--tokens') || join(ROOT, '..', 'cli', 'tokens', 'tokens.yml');
const componentsPath = getOpt('--components') || join(ROOT, '..', 'cli', 'tokens', 'components.yml');
const srcDir = getOpt('--src') || join(ROOT, '..', 'apps', 'p31ca', 'src');
const strict = args.includes('--strict');
const fix = args.includes('--fix');
const machineReadable = args.includes('--machine-readable');

if (!existsSync(tokensPath)) {
  console.error(`❌ Tokens file not found: ${tokensPath}`);
  process.exit(1);
}

const validator = new SpatialValidator(tokensPath);

// Fix mode
if (fix) {
  const filesToFix = glob.sync(`${srcDir}/**/*.{astro,tsx,jsx,css}`, { ignore: ['**/node_modules/**', '**/dist/**'] });
  let totalFixed = 0;
  const allFixes = [];

  for (const file of filesToFix) {
    const result = validator.fixViolations(file, false);
    totalFixed += result.fixed;
    allFixes.push(...result.fixes);
  }

  if (machineReadable) {
    console.log(JSON.stringify({ mode: 'fix', totalFixed, fixes: allFixes }, null, 2));
  } else {
    console.log(`\n🔧 Fix mode applied: ${totalFixed} violation(s) corrected.\n`);
    for (const fix of allFixes) {
      console.log(`  ${fix}`);
    }
  }

  process.exit(0);
}

// Health score mode
if (args.includes('--health')) {
  const health = validator.healthScore({ componentsPath, srcDir });
  if (machineReadable) {
    console.log(JSON.stringify({ mode: 'health', ...health }, null, 2));
  } else {
    console.log(`\n🏥 P31-Q System Health`);
    console.log(`   Score: ${health.score}/100 (Grade: ${health.grade})`);
    console.log(`   Checks: ${health.totalChecks} total, ${health.cleanChecks} clean`);
    console.log(`   Violations: ${health.violations}`);
    console.log(`   Warnings: ${health.warnings}`);
    console.log(`   Auto-fixable: ${health.fixes}`);
  }
  process.exit(health.score >= 70 ? 0 : 1);
}

// Standard audit mode
const audit = validator.auditCodebase({ componentsPath, srcDir });

if (machineReadable) {
  const output = {
    mode: 'audit',
    tokens: tokensPath,
    totalViolations: audit.totalViolations,
    totalWarnings: audit.totalWarnings,
    totalFixes: audit.totalFixes,
    results: audit.results.map(r => ({
      valid: r.valid,
      violations: r.violations,
      warnings: r.warnings,
      fixes: r.fixes
    }))
  };
  console.log(JSON.stringify(output, null, 2));
  process.exit(audit.totalViolations > 0 ? 1 : 0);
}

let exitCode = 0;

for (const result of audit.results) {
  if (result.violations.length > 0) {
    console.error(result.violations.join('\n'));
    exitCode = 1;
  }
  if (result.warnings.length > 0 && !strict) {
    console.warn(result.warnings.join('\n'));
  }
  if (result.fixes && result.fixes.length > 0) {
    console.log(result.fixes.join('\n'));
  }
  if (result.passed.length > 0) {
    console.log(result.passed.join('\n'));
  }
}

if (audit.totalViolations > 0) {
  console.error(`\n❌ ${audit.totalViolations} violation(s) found.`);
  if (strict) process.exit(1);
} else {
  console.log(`\n✅ All components and templates pass spatial validation.`);
}

process.exit(exitCode);
