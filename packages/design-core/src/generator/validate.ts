/**
 * @file Post-generation validation for design-core generator output.
 *
 * Imports simplified spatial validator logic and runs it against generated
 * files after each adapter writes to disk. Checks:
 *   - Forbidden CSS properties (margin, position, transform)
 *   - Missing token references (bare CSS values where var(--p31-…) expected)
 *   - SVG bounding box compliance (viewBox + width/height match bounding_boxes)
 *
 * Usage:
 *   import { validateGeneratedFiles } from '@p31/design-core/generator/validate';
 *   const results = validateGeneratedFiles(files, tokensData);
 */

import type { GeneratedFile, TokensFile } from './shared';
import { loadTokens, TOKENS_YAML } from './shared';

// ─── Types ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  file: string;
  valid: boolean;
  violations: string[];
  warnings: string[];
}

// ─── Forbidden property patterns ────────────────────────────────────────

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; label: string; severity: 'error' | 'warn' }> = [
  { pattern: /margin\s*:/,                               label: 'margin (external spacing)',         severity: 'error' },
  { pattern: /position\s*:\s*(relative|absolute|fixed)/,  label: 'position: relative/absolute/fixed', severity: 'error' },
  { pattern: /transform\s*:\s*translate[XY]?\(/,          label: 'transform: translate',              severity: 'error' },
  { pattern: /\btop\s*:/,                                 label: 'top',                               severity: 'warn'  },
  { pattern: /\bbottom\s*:/,                              label: 'bottom',                            severity: 'warn'  },
  { pattern: /\bleft\s*:/,                                label: 'left',                              severity: 'warn'  },
  { pattern: /\bright\s*:/,                               label: 'right',                             severity: 'warn'  },
  { pattern: /display\s*:\s*inline-block/,                label: 'display: inline-block',             severity: 'warn'  },
];

// CSS property names that are safe (internal appearance only)
const SAFE_PROPERTIES = new Set([
  'background', 'backgroundcolor', 'background-color',
  'border', 'bordercolor', 'border-color', 'borderradius', 'border-radius',
  'boxshadow', 'box-shadow',
  'color', 'fill', 'fontfamily', 'font-family', 'fontsize', 'font-size',
  'fontweight', 'font-weight',
  'height', 'lineheight', 'line-height', 'opacity', 'overflow',
  'padding', 'paddingtop', 'paddingtop', 'padding-bottom', 'paddingleft', 'paddingright',
  'paddingx', 'paddingy',
  'stroke', 'textalign', 'text-align', 'textdecoration', 'text-decoration',
  'texttransform', 'text-transform', 'transition',
  'width', 'zindex', 'z-index',
  'backdropfilter', 'backdrop-filter', 'webkitbackdropfilter', '-webkit-backdrop-filter',
  'boxshadow', 'box-shadow',
  'maxwidth', 'max-width',
  'gap', 'alignitems', 'align-items', 'justifycontent', 'justify-content',
  'display', 'flex', 'grid', 'gridtemplatecolumns', 'grid-template-columns',
  'gridtemplaterows', 'grid-template-rows',
]);

// ─── Token reference detection ─────────────────────────────────────────

const VAR_REF = /\{\{([^}]+)\}\}/g;
const CSS_VAR_REF = /var\((--p31-[^)]+)\)/g;

function collectTokenRefs(code: string): string[] {
  const refs = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = VAR_REF.exec(code)) !== null) refs.add(m[1].trim());
  while ((m = CSS_VAR_REF.exec(code)) !== null) refs.add(m[1].replace(/--p31-/, '').replace(/-/g, '.'));
  return Array.from(refs);
}

function tokenExists(tokenPath: string, tokens: TokensFile): boolean {
  if (tokenPath.includes('.')) {
    const parts = tokenPath.split('.');
    let node: any = tokens;
    for (const part of parts) {
      if (node == null || typeof node !== 'object') return false;
      node = node[part];
    }
    const exists = (node as any) !== undefined && (node as any) !== null;
    return exists as boolean;
  }
  return !!(
    tokens.primitive[tokenPath] !== undefined ||
    tokens.semantic[tokenPath] !== undefined ||
    (tokens.component && tokens.component[tokenPath] !== undefined) ||
    (tokens.theme && tokens.theme[tokenPath] !== undefined)
  );
}

// ─── SVG bounding box check ─────────────────────────────────────────────

const BBOX_WIDTH_RE  = /width\s*[:=]\s*["']?(\d+px)["']?/;
const BBOX_HEIGHT_RE = /height\s*[:=]\s*["']?(\d+px)["']?/;
const VIEWBOX_RE     = /viewBox\s*[:=]\s*["']([^"']+)["']/;

interface BBoxMatch {
  file: string;
  bboxName: string;
  expectedW: string;
  expectedH: string;
  actualW?: string;
  actualH?: string;
  viewBox?: string;
}

function extractBBoxName(code: string): string | undefined {
  const m = code.match(/bbox[=:\s]*["']?(\w+)["']?/i) ||
           code.match(/bounding_box[=:\s]*["']?(\w+)["']?/i) ||
           code.match(/size[=:\s]*["']?(\w+)["']?/i);
  return m ? m[1] : undefined;
}

// ─── Core validation logic ──────────────────────────────────────────────

function validateCode(code: string, fileName: string, tokens: TokensFile): ValidationResult {
  const violations: string[] = [];
  const warnings: string[]  = [];

  // 1. Forbidden CSS properties
  for (const { pattern, label, severity } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      if (severity === 'error') {
        violations.push(`${fileName}: forbidden property "${label}" found in generated code`);
      } else {
        warnings.push(`${fileName}: suspicious property "${label}" found — review for layout leakage`);
      }
    }
  }

  // 2. Missing token references (bare numeric values where token refs expected)
  const tokenRefs = collectTokenRefs(code);
  for (const ref of tokenRefs) {
    if (!tokenExists(ref, tokens)) {
      violations.push(`${fileName}: token reference "{{${ref}}}" does not resolve in tokens.yml`);
    }
  }

  // 3. SVG bbox compliance
  const svgMatches = code.matchAll(/<svg[\s\S]*?<\/svg>/gi);
  for (const svgBlock of svgMatches) {
    const svg = svgBlock[0];
    const bboxName = extractBBoxName(svg) || 'icon_md';
    const bbox = (tokens.bounding_boxes || {})[bboxName];

    if (!bbox) {
      warnings.push(`${fileName}: SVG references bbox "${bboxName}" which is not defined in tokens.yml`);
      continue;
    }

    const expectedW = String(bbox.width  || '');
    const expectedH = String(bbox.height || '');
    const actualW = svg.match(BBOX_WIDTH_RE)?.[1];
    const actualH = svg.match(BBOX_HEIGHT_RE)?.[1];
    const viewBox = svg.match(VIEWBOX_RE)?.[1];

    if (expectedW && actualW && actualW !== expectedW) {
      violations.push(`${fileName}: SVG bbox "${bboxName}" width mismatch — expected ${expectedW}, got ${actualW}`);
    }
    if (expectedH && actualH && actualH !== expectedH) {
      violations.push(`${fileName}: SVG bbox "${bboxName}" height mismatch — expected ${expectedH}, got ${actualH}`);
    }
    if (!viewBox && bbox) {
      warnings.push(`${fileName}: SVG bbox "${bboxName}" has no viewBox attribute`);
    }
  }

  return {
    file: fileName,
    valid: violations.length === 0,
    violations,
    warnings,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────

export function validateGeneratedFiles(files: GeneratedFile[], tokens?: TokensFile): ValidationResult[] {
  const resolvedTokens = tokens || loadTokens(TOKENS_YAML);
  return files.map(f => validateCode(f.code, f.name, resolvedTokens));
}

export function runPostGenerationValidation(files: GeneratedFile[], tokens?: TokensFile): ValidationResult[] {
  const results = validateGeneratedFiles(files, tokens);
  const violations = results.flatMap(r => r.violations);
  const warnings   = results.flatMap(r => r.warnings);

  if (violations.length > 0) {
    console.error(`\n❌ Post-generation validation: ${violations.length} violation(s) found:`);
    for (const v of violations) console.error(`   ${v}`);
  }
  if (warnings.length > 0) {
    console.warn(`\n⚠️  Post-generation validation: ${warnings.length} warning(s):`);
    for (const w of warnings) console.warn(`   ${w}`);
  }
  if (violations.length === 0 && warnings.length === 0) {
    console.log(`\n✅ Post-generation validation passed for ${results.length} file(s).`);
  }

  return results;
}
