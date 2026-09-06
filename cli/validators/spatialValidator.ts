// cli/validators/spatialValidator.ts
// P31 Spatial Governance Engine — Reads tokens.v2.yml and enforces layout rules.
// Part of the UI Compiler pipeline.

import { parse } from 'yaml';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

// ─── Types ──────────────────────────────────────────────────────────────

export interface TokenSchema {
  version: string;
  bounding_boxes: Record<string, { width: string; height: string; container_display?: string; container_width?: string; container_height?: string; description?: string; usage?: string }>;
  layout_containers: Record<string, { height?: string; padding_y?: string; gap?: string; align_items?: string; justify_content?: string; max_width?: string; margin?: string; display?: string; description?: string; forbidden_child_properties?: string[]; allowed_child_properties?: string[] }>;
  spacing_rules: {
    component_forbidden_properties: string[];
    template_allowed_properties: string[];
    component_allowed_internal_properties: string[];
    description?: string;
  };
  cascade_layers: {
    order: string[];
    description?: string;
    layer_definitions?: Record<string, { description?: string; includes?: string }>;
  };
  svg_rules: {
    enforce_bounding_box: boolean;
    svgo_transform: Record<string, boolean | string>;
    viewBox_trimming: { enabled: boolean; padding?: string; trim_to_visible_bounds?: boolean };
    container_wrapping: { enabled: boolean; wrapper_display?: string; wrapper_width?: string; wrapper_height?: string };
    description?: string;
  };
  agent_prompt_injection?: Record<string, any>;
  examples?: Record<string, any>;
  version_history?: any[];
}

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  passed: string[];
  warnings: string[];
}

// ─── Validator Class ──────────────────────────────────────────────────────

export class SpatialValidator {
  private tokens: TokenSchema;
  private tokensPath: string;

  constructor(tokensPath: string) {
    this.tokensPath = tokensPath;
    const raw = fs.readFileSync(tokensPath, 'utf-8');
    this.tokens = parse(raw) as TokenSchema;
  }

  /**
   * Validate a component definition (from components.v2.yml or generated code)
   * Checks:
   *   - No forbidden external spacing properties
   *   - No hardcoded pixel margins in generated code
   */
  validateComponent(component: { name: string; styles?: Record<string, any>; generated_code?: string }): ValidationResult {
    const violations: string[] = [];
    const passed: string[] = [];
    const warnings: string[] = [];

    const forbidden = this.tokens.spacing_rules.component_forbidden_properties;
    const allowed = this.tokens.spacing_rules.component_allowed_internal_properties;

    // 1. Check YAML definition
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
        }
      }
    }

    // 2. Check generated code (TSX/JSX) for hardcoded margins or transforms
    if (component.generated_code) {
      const marginRegex = /margin[A-Z]?:\s*['"]?-?\d+px['"]?/g;
      const transformRegex = /transform:\s*['"]?translate[XY]?\([^)]+px\)/g;
      const positionRegex = /position:\s*['"]?(relative|absolute)/g;
      const topBottomRegex = /(top|bottom|left|right):\s*['"]?-?\d+px['"]?/g;

      const marginMatches = component.generated_code.match(marginRegex) || [];
      const transformMatches = component.generated_code.match(transformRegex) || [];
      const positionMatches = component.generated_code.match(positionRegex) || [];
      const topBottomMatches = component.generated_code.match(topBottomRegex) || [];

      const allViolations = [...marginMatches, ...transformMatches, ...positionMatches, ...topBottomMatches];
      if (allViolations.length > 0) {
        violations.push(`❌ Component "${component.name}" generated code contains forbidden spacing: ${allViolations.join(', ')}`);
      } else {
        passed.push(`✅ Component "${component.name}" has no hardcoded external spacing.`);
      }

      // Check for inline-block (which creates baseline gaps)
      if (component.generated_code.includes('display: inline-block')) {
        warnings.push(`⚠️ Component "${component.name}" uses display: inline-block (may cause baseline gaps). Consider using flex or block.`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
      passed,
      warnings,
    };
  }

  /**
   * Validate a layout template (Astro or HTML)
   * Checks:
   *   - Header height matches layout_containers.header.height
   *   - Header uses flex + align-items: center
   *   - Allowed properties are used for spacing
   */
  validateTemplate(template: { name: string; code: string; role?: string }): ValidationResult {
    const violations: string[] = [];
    const passed: string[] = [];
    const warnings: string[] = [];

    // If the template is a header, enforce layout_container rules
    if (template.role === 'header' || template.name.includes('Header')) {
      const headerToken = this.tokens.layout_containers.header;
      if (!headerToken) {
        warnings.push(`⚠️ Header template "${template.name}" found but no header token defined in tokens.v2.yml.`);
        return { valid: true, violations: [], passed: [], warnings };
      }

      // Check height
      if (headerToken.height) {
        const heightRegex = new RegExp(`height:\\s*['"]?${headerToken.height}['"]?|height:\\s*var\\(--p31-header-h\\)`);
        if (!heightRegex.test(template.code)) {
          violations.push(`❌ Header "${template.name}" height is not set to ${headerToken.height} or var(--p31-header-h).`);
        } else {
          passed.push(`✅ Header height is ${headerToken.height}`);
        }
      }

      // Check display: flex
      if (headerToken.display && !template.code.includes(`display: ${headerToken.display}`)) {
        violations.push(`❌ Header "${template.name}" does not have display: ${headerToken.display}.`);
      } else {
        passed.push(`✅ Header uses ${headerToken.display} layout.`);
      }

      // Check align-items: center
      if (headerToken.align_items && !template.code.includes(`align-items: ${headerToken.align_items}`)) {
        violations.push(`❌ Header "${template.name}" does not have align-items: ${headerToken.align_items}.`);
      } else {
        passed.push(`✅ Header uses align-items: ${headerToken.align_items}.`);
      }

      // Check forbidden child properties in any child elements (basic regex)
      const forbiddenChildren = headerToken.forbidden_child_properties || [];
      for (const prop of forbiddenChildren) {
        if (prop.includes(':')) {
          const [propName, propValue] = prop.split(':').map(s => s.trim());
          const regex = new RegExp(`${propName}\\s*:\\s*['"]?${propValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]?`);
          if (regex.test(template.code)) {
            violations.push(`❌ Header "${template.name}" contains a child with forbidden property "${prop}".`);
          }
        } else {
          const regex = new RegExp(`${prop}\\s*:\\s*['"]?[^;]+['"]?`);
          if (regex.test(template.code) && !template.code.includes(`/* p31-allow-${prop} */`)) {
            violations.push(`❌ Header "${template.name}" contains a child with forbidden property "${prop}".`);
          }
        }
      }
    }

    // Check that template uses only allowed properties for spacing
    const allowedSpacing = this.tokens.spacing_rules.template_allowed_properties;
    const suspicious = template.code.match(/margin[A-Z]?:\s*['"]?-?\d+px['"]?/g) || [];
    if (suspicious.length > 0) {
      warnings.push(`⚠️ Template "${template.name}" uses hardcoded margins: ${suspicious.join(', ')}. Consider using gap or padding on parent.`);
    }

    return {
      valid: violations.length === 0,
      violations,
      passed,
      warnings,
    };
  }

  /**
   * Validate a layout element (e.g., a specific div or container)
   * Used for more granular checks on specific elements within a page.
   */
  validateLayoutElement(element: { id: string; role?: string; display?: string; height?: string; alignItems?: string; children?: any[]; type?: string; expectedSize?: string; parent?: any }): ValidationResult {
    const violations: string[] = [];
    const passed: string[] = [];

    // If this is an SVG, check bounding box
    if (element.type === 'svg') {
      const expectedSize = element.expectedSize || 'icon_md';
      const box = this.tokens.bounding_boxes[expectedSize];
      if (!box) {
        violations.push(`❌ SVG "${element.id}" has no bounding box defined for size "${expectedSize}".`);
      } else {
        passed.push(`✅ SVG "${element.id}" is expected to fit bounding box "${expectedSize}".`);
      }
    }

    return { valid: violations.length === 0, violations, passed, warnings: [] };
  }

  /**
   * Full audit of the entire codebase: scan all component and template files.
   */
  auditCodebase(options: { componentsPath?: string; templatesPath?: string; srcDir?: string }): { results: ValidationResult[]; totalViolations: number } {
    const results: ValidationResult[] = [];
    let totalViolations = 0;

    // 1. Audit components (from components.v2.yml)
    if (options.componentsPath) {
      const comps = parse(fs.readFileSync(options.componentsPath, 'utf-8'));
      for (const [name, def] of Object.entries(comps.components || {})) {
        const result = this.validateComponent({ name, styles: (def as any).styles, generated_code: (def as any).generated_code });
        results.push(result);
        totalViolations += result.violations.length;
      }
    }

    // 2. Audit templates (from a source directory)
    if (options.srcDir) {
      const files = glob.sync(`${options.srcDir}/**/*.{astro,tsx,jsx}`, { ignore: ['**/node_modules/**'] });
      for (const file of files) {
        const code = fs.readFileSync(file, 'utf-8');
        const name = path.basename(file);
        const role = name.includes('Header') ? 'header' : undefined;
        const result = this.validateTemplate({ name, code, role });
        results.push(result);
        totalViolations += result.violations.length;
      }
    }

    return { results, totalViolations };
  }
}

// ─── CLI Integration ──────────────────────────────────────────────────────

export function runSpatialValidation(options: { tokensPath?: string; componentsPath?: string; srcDir?: string; strict?: boolean; fix?: boolean }) {
  const tokensPath = options.tokensPath || path.resolve(process.cwd(), 'schemas', 'tokens.v2.yml');
  if (!fs.existsSync(tokensPath)) {
    console.error(`❌ Tokens file not found: ${tokensPath}`);
    process.exit(1);
  }

  const validator = new SpatialValidator(tokensPath);
  const audit = validator.auditCodebase({
    componentsPath: options.componentsPath || path.resolve(process.cwd(), 'schemas', 'components.v2.yml'),
    srcDir: options.srcDir || path.resolve(process.cwd(), 'apps', 'p31ca', 'src'),
  });

  let exitCode = 0;

  for (const result of audit.results) {
    if (result.violations.length > 0) {
      console.error(result.violations.join('\n'));
      exitCode = 1;
    }
    if (result.warnings.length > 0 && !options.strict) {
      console.warn(result.warnings.join('\n'));
    }
    if (result.passed.length > 0) {
      console.log(result.passed.join('\n'));
    }
  }

  if (audit.totalViolations > 0) {
    console.error(`\n❌ ${audit.totalViolations} violation(s) found.`);
    if (options.fix) {
      console.log('🔧 Automatic fix not yet implemented. Please fix manually.');
    }
    if (options.strict) {
      process.exit(1);
    }
  } else {
    console.log(`\n✅ All components and templates pass spatial validation.`);
  }

  process.exit(exitCode);
}
