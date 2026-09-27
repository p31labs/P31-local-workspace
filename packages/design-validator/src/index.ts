/**
 * @p31/design-validator — enforces @p31ca/design-core invariants on generated UI.
 *
 * Usage:
 *   import { validateUI, validateFile, validateComponent } from '@p31/design-validator';
 *
 *   const result = validateUI('<div data-spoons="3" data-size-class="regular">...</div>');
 *   if (!result.valid) console.error(result.errors);
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvariantManifest {
  version: string;
  invariants: {
    tetra: Record<string, number>;
    spoons: {
      min: number;
      max: number;
      crisis: number;
      storeKey: string;
      crisisPersistsAcrossReload: boolean;
    };
    sizeClass: {
      options: string[];
      values: Record<string, Record<string, unknown>>;
    };
    spacing: {
      base: number;
      scale: number;
      steps: number[];
      semantic: Record<string, number>;
    };
    typography: {
      scale: number;
      base: number;
      sans: string;
      mono: string;
    };
    colors: {
      palette: string[];
      accent: string;
      tokens: Record<string, string>;
      glass: Record<string, string>;
    };
    radii: Record<string, number>;
    motion: {
      tempo: number;
      beat: number;
      durations: Record<string, number>;
      easing: Record<string, string>;
      spoonMapping: Record<string, { duration: string; transition: string }>;
    };
  };
  rules: Record<string, boolean | number | string>;
  components: {
    allowed: string[];
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationOptions {
  /** Allow missing data-spoons (useful for fragments) */
  allowMissingSpoons?: boolean;
  /** Allow missing data-size-class (useful for fragments) */
  allowMissingSizeClass?: boolean;
  /** Treat warnings as errors */
  strict?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Manifest loading
// ---------------------------------------------------------------------------

function loadManifest(): InvariantManifest {
  // Resolve @p31ca/design-core package root via node_modules traversal
  const candidates = [
    resolve(import.meta.dirname, '../design-core/manifest.json'),
    resolve(import.meta.dirname, '../../design-core/manifest.json'),
    resolve(import.meta.dirname, '../../../design-core/manifest.json'),
  ];
  for (const candidate of candidates) {
    try {
      const raw = readFileSync(candidate, 'utf-8');
      return JSON.parse(raw) as InvariantManifest;
    } catch {
      // continue
    }
  }
  throw new Error('Could not locate @p31ca/design-core/manifest.json');
}

const m = loadManifest();

const DYNAMIC_TAILWIND_RE = /(?:className|class)\s*[=:]\s*(?:[`'"][^`'"]*\$\{|\{[^}]*\$\{)/;
const INLINE_HEX_RE = /style="[^"]*#[0-9a-fA-F]{3,8}/;
const PURE_WHITE_RE = /#FFFFFF|#fff|white/;
const PURE_BLACK_RE = /#000000|#000|black/;
const HARDCODED_PX_RE = /(?:width|height|padding|margin|top|left|right|bottom|gap)\s*:\s*\d+px/;

/** Check whether a string contains any of the allowed component class names. */
function hasAllowedComponent(html: string): boolean {
  const allowed = m.components.allowed;
  return allowed.some((name) => {
    const re = new RegExp(`class="[^"]*\\b${name}\\b[^"]*"`, 'i');
    return re.test(html);
  });
}

/** Count glass-card occurrences vs generic card divs. */
function cardCoverage(html: string): { cards: number; glassCards: number } {
  const cards = (html.match(/class="[^"]*card[^"]*"/gi) || []).length;
  const glassCards = (html.match(/class="[^"]*glass-card[^"]*"/gi) || []).length;
  return { cards, glassCards };
}

/** Count link-glow coverage. */
function linkGlowCoverage(html: string): { links: number; glowingLinks: number } {
  const links = (html.match(/<a\b[^>]*>/gi) || []).length;
  const glowingLinks = (html.match(/<a\b[^>]*class="[^"]*link-glow[^"]*"[^>]*>/gi) || []).length;
  return { links, glowingLinks };
}

// ---------------------------------------------------------------------------
// Core validation
// ---------------------------------------------------------------------------

export function validateUI(html: string, options: ValidationOptions = {}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { allowMissingSpoons = false, allowMissingSizeClass = false, strict = false } = options;

  // 1. No dynamic Tailwind / className template literals
  if (DYNAMIC_TAILWIND_RE.test(html)) {
    errors.push('Dynamic className template literals not allowed — use static class strings only');
  }

  // 2. All cards must use glass-card
  const { cards, glassCards } = cardCoverage(html);
  if (cards > 0 && glassCards === 0) {
    errors.push(`Found ${cards} card-like element(s) but none use glass-card — all cards must use glass-card, glass-subtle, or glass-panel`);
  }
  if (cards > glassCards) {
    warnings.push(`${cards - glassCards} card-like element(s) missing glass-card class`);
  }

  // 3. Links should use link-glow
  const { links, glowingLinks } = linkGlowCoverage(html);
  if (links > 0 && glowingLinks === 0) {
    warnings.push(`Found ${links} <a> element(s) but none use link-glow — all interactive links should use link-glow`);
  }

  // 4. data-spoons required
  if (!allowMissingSpoons && !html.includes('data-spoons=')) {
    errors.push('data-spoons attribute required on root element');
  }

  // 5. data-size-class required
  if (!allowMissingSizeClass && !html.includes('data-size-class=')) {
    errors.push('data-size-class attribute required on root element');
  }

  // 6. No inline hex colors
  if (INLINE_HEX_RE.test(html)) {
    errors.push('Inline hex colors detected — use design tokens (var(--p31-*)) instead');
  }

  // 7. No pure white text
  if (PURE_WHITE_RE.test(html) && !html.includes('text-primary')) {
    warnings.push('Pure white (#FFFFFF / white) detected — use text-primary (#F5F5F7) to prevent halation');
  }

  // 8. No pure black backgrounds
  if (PURE_BLACK_RE.test(html)) {
    warnings.push('Pure black (#000000 / black) detected — use void (#0A0A0F) for backgrounds');
  }

  // 9. No hardcoded px values in inline styles
  if (HARDCODED_PX_RE.test(html)) {
    warnings.push('Hardcoded px values in inline styles detected — use spacing tokens instead');
  }

  // 10. At least one allowed component present
  if (!hasAllowedComponent(html)) {
    warnings.push('No recognized @p31ca/ui component classes found — ensure you are using the allowed component set');
  }

  const valid = strict ? errors.length === 0 && warnings.length === 0 : errors.length === 0;

  return { valid, errors, warnings };
}

// ---------------------------------------------------------------------------
// File-level validation
// ---------------------------------------------------------------------------

export function validateFile(filePath: string, options: ValidationOptions = {}): ValidationResult {
  const resolved = resolve(filePath);
  const content = readFileSync(resolved, 'utf-8');
  return validateUI(content, options);
}

// ---------------------------------------------------------------------------
// Component-name validation (for agent-generated spec strings)
// ---------------------------------------------------------------------------

export function validateComponentNames(components: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const name of components) {
    if (!m.components.allowed.includes(name)) {
      errors.push(`"${name}" is not in the allowed component list — see @p31ca/design-core manifest`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ---------------------------------------------------------------------------
// Manifest accessor (for agents / CLI)
// ---------------------------------------------------------------------------

export function getManifest(): InvariantManifest {
  return m;
}

export function getAllowedComponents(): string[] {
  return [...m.components.allowed];
}

export function getInvariant<T extends keyof InvariantManifest['invariants']>(key: T): InvariantManifest['invariants'][T] {
  return m.invariants[key];
}
