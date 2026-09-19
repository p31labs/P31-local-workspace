/**
 * @p31/canon — loom-coverage.mjs
 *
 * Shared pure logic for the contract agents: CSS class-family detection,
 * signal ranking, and contract-body grounding. Both loom-contract-agent.mjs
 * (single proposal) and loom-coverage-agent.mjs (batched) import this so the
 * detector lives in exactly one place — two detectors would drift.
 *
 * No I/O beyond what callers pass in. No model calls, no vendor names.
 */

/** Tone/status words — a class suffix that is a *visual variant*, not a
 *  structural child. `.badge-success` is a variant; `.a2-data-card-title` is a child. */
export const TONE_WORDS = new Set([
  'success', 'warning', 'error', 'info', 'danger',
  'primary', 'secondary', 'ghost',
  'active', 'disabled', 'loading', 'pending', 'approved', 'rejected',
  'online', 'offline',
]);

/** Positional words — children that partition a container along an axis.
 *  `.topbar-left`/`.topbar-center`/`.topbar-right` are positional modifiers. */
export const POSITIONAL_WORDS = new Set([
  'left', 'right', 'center', 'top', 'bottom',
]);

/** Variant-suffix words — material/presentation variants signalled by a
 *  trailing hyphen word. `.topbar-glass` is a variant of `.topbar`. */
export const VARIANT_WORDS = new Set([
  'glass', 'wrapper', 'subtle', 'strong', 'box',
]);

/** Class shorthands that alias an already-contracted component. `.btn` is the
 *  Button, which has a contract; proposing "Btn" would duplicate it. */
export const ALIASES = { btn: 'button' };

/** PascalCase from a dotted slug: `.a2-data-card` → `A2DataCard`. */
export function pascalize(slug) {
  return slug
    .slice(1)
    .replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^./, (c) => c.toUpperCase());
}

/** Is `suffix` (the part of a class after a base name) a modifier, as opposed
 *  to a structural child? `--primary` (BEM), `-glass` (variant word),
 *  `-left` (positional), `-success` (tone) are modifiers. `-title`,
 *  `-header`, `-metric-label` are children. */
export function isModifierSuffix(suffix) {
  if (!suffix.startsWith('-')) return false;
  const word = suffix.replace(/^-+/, ''); // strip one or two leading dashes
  return TONE_WORDS.has(word) || POSITIONAL_WORDS.has(word) || VARIANT_WORDS.has(word);
}

/** Walk a set of `{ name, tokens }` class records and group each base class
 *  with its modifier siblings. Returns families sorted by signal desc. */
export function detectFamilies(classVars) {
  const families = [];
  for (const [name, record] of classVars) {
    const variants = [];
    for (const [k] of classVars) {
      if (k === name || !k.startsWith(name + '-')) continue;
      if (isModifierSuffix(k.slice(name.length))) variants.push(k);
    }
    if (variants.length < 2) continue;
    // signal = modifier count × token consumption × file spread
    const tokenCount = new Set([...(record.tokens ?? []), ...variants.flatMap((v) => [...(classVars.get(v)?.tokens ?? [])])]).size;
    const fileCount = new Set([...(record.files ?? []), ...variants.flatMap((v) => [...(classVars.get(v)?.files ?? [])])]).size;
    const signal = variants.length * Math.max(1, tokenCount) * Math.max(1, fileCount);
    families.push({
      base: name,
      variants,
      modifierCount: variants.length,
      tokenCount,
      fileCount,
      signal,
    });
  }
  families.sort((a, b) => b.signal - a.signal || a.base.localeCompare(b.base));
  return families;
}

/** Filter to families that are not already contracted and not aliased to a
 *  contracted component. */
export function uncontractedFamilies(families, contractedNames) {
  const contracted = new Set(contractedNames.map((n) => n.toLowerCase()));
  return families.filter((f) => {
    const pascal = pascalize(f.base);
    const aliased = ALIASES[f.base.slice(1)] ?? null;
    return !contracted.has(pascal.toLowerCase()) && !(aliased && contracted.has(aliased));
  });
}

/** Ground a family in the tokens its CSS actually consumes. `dtcgTokens` is a
 *  Map of p31.* path → value; the CSS var `--p31-<dots-as-dashes>` is the
 *  exact inverse of the DTCG path. Returns the sorted tokenContract. */
export function groundTokens(classVars, family, dtcgTokens) {
  const varNameFor = (path) => '--p31-' + path.replace(/^p31\./, '').replace(/\./g, '-');
  const consumed = new Set([...(classVars.get(family.base)?.tokens ?? [])]);
  for (const v of family.variants) for (const t of classVars.get(v)?.tokens ?? []) consumed.add(t);
  return [...dtcgTokens.keys()].filter((p) => p.startsWith('p31.') && consumed.has(varNameFor(p))).sort();
}

/** Build a full component contract body from a detected family + grounded
 *  tokens. Deterministic; the `variant` enum is the modifier suffix list. */
export function buildContractBody(family, tokenContract, dtcgTokens) {
  const pascal = pascalize(family.base);
  const variants = family.variants
    .map((v) => v.slice(family.base.length).replace(/^-+/, ''))
    .sort();
  const statusByVariant = Object.fromEntries(
    variants.map((v) => [v, dtcgTokens.has(`p31.status-${v}`) ? `p31.status-${v}` : null]),
  );
  return {
    name: pascal,
    layer: 'component',
    status: 'planned',
    intent: `Display a compact ${variants.join('/')} surface. A reusable ${variants.length}-variant component.`,
    props: [
      {
        name: 'variant',
        type: 'enum',
        required: false,
        description: `Semantic tone. ${variants.map((v) => `${v} = ${v}`).join(', ')}.`,
        options: variants,
        default: variants[0],
      },
      { name: 'children', type: 'node', required: true, description: 'The content.' },
    ],
    tokenContract,
    semanticParts: [
      { name: 'container', description: 'The outer element.' },
      { name: 'label', description: 'The text content.' },
    ],
    requiredAria: [{ attribute: 'aria-label', required: false, description: 'Present when the variant alone is insufficient context.' }],
    interactionStates: {
      default: {
        description: 'Renders with the variant tone applied and content visible.',
        property: 'background-color',
        matcher: 'not-empty',
        trigger: 'none',
        fixture: { children: 'Item', variant: variants[0] },
      },
    },
    sources: [
      { kind: 'spec', path: 'src/contracts/schema.ts' },
      { kind: 'token', path: 'tokens/tokens.dtc.json' },
    ],
    importStatement: `import { ${pascal} } from '@p31/canon-react';`,
    antiExamples: [
      {
        label: `variant="${variants[0]}" but a hardcoded rgba background`,
        why: 'Bypasses the token contract.',
        useInstead: statusByVariant[variants[0]] ? `Consume ${statusByVariant[variants[0]]} via the variant prop.` : 'Reference a real p31.* token via the variant prop.',
      },
    ],
  };
}
