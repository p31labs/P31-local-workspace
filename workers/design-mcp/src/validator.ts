/**
 * @file Validation & audit engine for P31 design system.
 */

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  component: string;
}

export interface AuditResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  summary: {
    components: number;
    tokens: number;
    icons: number;
    versions: {
      tokens: string;
      components: string;
    };
  };
  orphanedTokens: string[];
  deadTokens: string[];
  missingValues: string[];
  circularReferences: string[];
}

export interface AuditIconsResult {
  valid: boolean;
  summary: {
    icons: number;
    regular: number;
    advanced: number;
  };
  missingSvg: string[];
  missingMetadata: string[];
  invalidFamily: string[];
  colorCountMismatch: string[];
  duplicateIds: string[];
  animationMismatch: string[];
  missingViewBox: string[];
  missingAriaLabel: string[];
  catalogMismatch: string[];
}

function getMissingFields(component: Record<string, any>): string[] {
  const missing: string[] = [];
  if (!component.description) missing.push('description');
  if (!component.css_class) missing.push('css_class');
  if (!component.aiGuidance?.useWhen) missing.push('aiGuidance.useWhen');
  if (!component.aiGuidance?.avoidWhen) missing.push('aiGuidance.avoidWhen');
  if (!component.props) missing.push('props');
  if (!component.slots) missing.push('slots');
  if (!component.tokens) missing.push('tokens');
  return missing;
}

export function validateComponent(name: string, component: any, tokens: any, allComponents: Record<string, any> = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const missing = getMissingFields(component);
  if (missing.length > 0) {
    errors.push(`Missing required fields: ${missing.join(', ')}`);
  }

  if (component.css_class) {
    if (!/^[a-z][a-z0-9-]*$/.test(component.css_class)) {
      errors.push(`css_class "${component.css_class}" is not kebab-case`);
    }
    const duplicates = Object.entries(allComponents)
      .filter(([k, c]: [string, any]) => k !== name && c.css_class === component.css_class)
      .map(([k]) => k);
    if (duplicates.length > 0) {
      errors.push(`css_class "${component.css_class}" is duplicated on: ${duplicates.join(', ')}`);
    }
  }

  if (component.tokens) {
    for (const t of component.tokens) {
      const parts = t.split('.');
      let node: any = tokens;
      let found = true;
      for (const p of parts) {
        if (node == null || typeof node !== 'object' || !(p in node)) {
          found = false;
          break;
        }
        node = node[p];
      }
      if (!found) {
        errors.push(`Token path "${t}" does not exist in tokens.yml`);
      }
    }
  }

  if (component.props) {
    for (const [key, def] of Object.entries(component.props)) {
      if (!def.type) {
        errors.push(`Prop "${key}" missing "type" field`);
      }
      if (def.options != null && !Array.isArray(def.options)) {
        errors.push(`Prop "${key}" options must be an array`);
      }
      if (def.range != null && !Array.isArray(def.range)) {
        errors.push(`Prop "${key}" range must be an array`);
      }
    }
  }

  if (component.slots) {
    for (const slot of component.slots) {
      if (typeof slot !== 'string' || slot.trim() === '') {
        errors.push(`Slot "${slot}" must be a non-empty string`);
      }
    }
  }

  if (component.aiGuidance && component.aiGuidance.useWhen === component.aiGuidance.avoidWhen) {
    warnings.push(`useWhen and avoidWhen are identical`);
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
    component: name,
  };
}

export function auditTokens(tokens: any, components: any): AuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const orphanedTokens: string[] = [];
  const deadTokens: string[] = [];
  const missingValues: string[] = [];
  const circularReferences: string[] = [];

  const componentMap = components.components || components;
  const referenced = new Set<string>();
  for (const comp of Object.values(componentMap)) {
    for (const t of (comp as any).tokens || []) {
      referenced.add(t);
    }
  }

  const defined = new Set<string>();
  const allTokenPaths: { path: string; node: any }[] = [];
  const indirectlyReferenced = new Set<string>();

  function walk(node: any, path: string, inTokenTree = true) {
    if (node == null || typeof node !== 'object') {
      if (inTokenTree && path && typeof node === 'string') {
        defined.add(path);
        allTokenPaths.push({ path, node: { $value: node } });
        const refs = (node as string).match(/\{([^}]+)\}/g);
        if (refs) {
          for (const ref of refs) {
            const refPath = ref.slice(1, -1);
            indirectlyReferenced.add(refPath);
          }
        }
      }
      return;
    }
    if (node.$value !== undefined || node.$type !== undefined) {
      defined.add(path);
      allTokenPaths.push({ path, node });
      if (node.$value == null) {
        missingValues.push(path);
      }
      const refs = (node.$value as string)?.match(/\{([^}]+)\}/g);
      if (refs) {
        for (const ref of refs) {
          const refPath = ref.slice(1, -1);
          indirectlyReferenced.add(refPath);
        }
      }
    } else {
      for (const key of Object.keys(node)) {
        if (key.startsWith('$') || key === 'metadata') continue;
        const isComponent = key === 'component' || path.startsWith('component.');
        const inComponentDefs = inTokenTree && key === 'component';
        walk(node[key], path ? `${path}.${key}` : key, inTokenTree && !isComponent, inComponentDefs);
      }
    }
  }
  walk(tokens, '');

  function collectComponentRefs(node: any) {
    if (node == null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const item of node) collectComponentRefs(item);
      return;
    }
    for (const val of Object.values(node)) {
      if (typeof val === 'string') {
        const refs = val.match(/\{([^}]+)\}/g);
        if (refs) {
          for (const ref of refs) {
            indirectlyReferenced.add(ref.slice(1, -1));
          }
        }
      } else if (typeof val === 'object') {
        collectComponentRefs(val);
      }
    }
  }
  if (tokens.component) {
    collectComponentRefs(tokens.component);
  }

  for (const ref of referenced) {
    if (!defined.has(ref)) {
      orphanedTokens.push(ref);
    }
  }

  for (const def of defined) {
    if (def === 'version') continue;
    if (!referenced.has(def) && !indirectlyReferenced.has(def)) {
      if (def.startsWith('semantic.') || def.startsWith('theme.')) continue;
      deadTokens.push(def);
    }
  }

  function resolveValue(val: any, path: string, seen: Set<string> = new Set()): any {
    if (typeof val !== 'string') return val;
    if (val.startsWith('{') && val.endsWith('}')) {
      const ref = val.slice(1, -1);
      if (seen.has(ref)) {
        circularReferences.push(`${path} -> ${ref} (cycle)`);
        return val;
      }
      seen.add(ref);
      const parts = ref.split('.');
      let node: any = tokens;
      for (const p of parts) {
        if (node == null || typeof node !== 'object' || !(p in node)) return val;
        node = node[p];
      }
      return resolveValue(node?.$value ?? node, ref, seen);
    }
    return val;
  }

  for (const { path, node } of allTokenPaths) {
    resolveValue(node.$value, path);
  }

  const summary = {
    components: Object.keys(componentMap).length,
    tokens: defined.size,
    icons: 0,
    versions: {
      tokens: (tokens.version as string) || 'unknown',
      components: (components.version as string) || 'unknown',
    },
  };

  return {
    valid: orphanedTokens.length === 0 && deadTokens.length === 0 && missingValues.length === 0 && circularReferences.length === 0,
    warnings,
    errors,
    summary,
    orphanedTokens,
    deadTokens,
    missingValues,
    circularReferences,
  };
}

export function auditIcons(icons: any[], iconCatalog: Record<string, any>): AuditIconsResult {
  const result: AuditIconsResult = {
    valid: true,
    summary: { icons: icons.length, regular: 0, advanced: 0 },
    missingSvg: [],
    missingMetadata: [],
    invalidFamily: [],
    colorCountMismatch: [],
    duplicateIds: [],
    animationMismatch: [],
    missingViewBox: [],
    missingAriaLabel: [],
    catalogMismatch: [],
  };

  const seenIds = new Set<string>();
  const catalogKeys = new Set(Object.keys(iconCatalog));

  for (const icon of icons) {
    if (icon.family === 'regular') result.summary.regular++;
    else if (icon.family === 'advanced') result.summary.advanced++;

    if (!icon.svg || icon.svg.trim() === '') {
      result.missingSvg.push(icon.id || 'unnamed');
    }

    const required = ['id', 'name', 'family', 'description', 'colors', 'animated'];
    const missing = required.filter(f => icon[f] === undefined || icon[f] === null || icon[f] === '');
    if (missing.length) {
      result.missingMetadata.push(`${icon.id || 'unnamed'} (missing: ${missing.join(', ')})`);
    }

    if (icon.family && !['regular', 'advanced'].includes(icon.family)) {
      result.invalidFamily.push(icon.id || 'unnamed');
    }

    if (icon.colors) {
      const count = Array.isArray(icon.colors) ? icon.colors.length : 0;
      if ((icon.family === 'regular' && count !== 3) || (icon.family === 'advanced' && count !== 6)) {
        result.colorCountMismatch.push(`${icon.id || 'unnamed'} (${count} colors)`);
      }
    }

    if (icon.id) {
      if (seenIds.has(icon.id)) {
        result.duplicateIds.push(icon.id);
      }
      seenIds.add(icon.id);
    }

    if (icon.animated === true && icon.svg) {
      const hasAnimation = icon.svg.includes('@keyframes') || icon.svg.includes('<animate');
      if (!hasAnimation) {
        result.animationMismatch.push(icon.id || 'unnamed');
      }
    }

    if (icon.svg && !icon.svg.includes('viewBox')) {
      result.missingViewBox.push(icon.id || 'unnamed');
    }

    if (icon.svg && !icon.svg.includes('aria-label')) {
      result.missingAriaLabel.push(icon.id || 'unnamed');
    }
  }

  for (const key of catalogKeys) {
    if (!seenIds.has(key)) {
      result.catalogMismatch.push(`${key} (in catalog but not in icons array)`);
    }
  }
  for (const id of seenIds) {
    if (!catalogKeys.has(id)) {
      result.catalogMismatch.push(`${id} (in icons array but not in catalog)`);
    }
  }

  const hasError =
    result.missingSvg.length > 0 ||
    result.missingMetadata.length > 0 ||
    result.invalidFamily.length > 0 ||
    result.colorCountMismatch.length > 0 ||
    result.duplicateIds.length > 0 ||
    result.catalogMismatch.length > 0;
  result.valid = !hasError;

  return result;
}
