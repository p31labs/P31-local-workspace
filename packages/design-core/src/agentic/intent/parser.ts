import YAML from 'yaml';
import { intentSpecSchema, type IntentSpec } from './schema';

export interface ParseResult {
  ok: boolean;
  spec?: IntentSpec;
  errors?: string[];
}

/**
 * Parses an Intent DSL document (YAML) into a validated IntentSpec.
 * The narrative requirement enforces the Dillpickle Narrator contract: no component
 * ships without a stated human need.
 */
export function parseIntent(yamlSource: string): ParseResult {
  let raw: unknown;
  try {
    raw = YAML.parse(yamlSource);
  } catch (e) {
    return { ok: false, errors: [`YAML syntax error: ${(e as Error).message}`] };
  }
  const parsed = intentSpecSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`),
    };
  }
  return { ok: true, spec: parsed.data };
}

/** One-line summary per constraint — what Cornichon Architect reads first. */
export function summarize(spec: IntentSpec): string[] {
  const c = spec.constraints;
  const lines = [
    `component: ${spec.component}`,
    `a11y: wcag-${c.accessibility.wcag} contrast≥${c.accessibility.contrast}:1 touch≥${c.accessibility.touchTarget}px`,
    `spoons: ${typeof c.spoonAware === 'boolean' ? (c.spoonAware ? 'full ladder' : 'not aware') : c.spoonAware.join(',')}`,
    `perf: ≤${c.performance.bundle}kb gzip · ≤${c.performance.renderTime}ms frame`,
  ];
  if (c.loveSemantics.length)
    lines.push(`love: ${c.loveSemantics.map((l) => `${l.trigger}=+${l.reward}→${l.recipient.join('/')}`).join('; ')}`);
  if (spec.variants.length) lines.push(`variants: ${spec.variants.map((v) => v.name).join(', ')}`);
  return lines;
}
