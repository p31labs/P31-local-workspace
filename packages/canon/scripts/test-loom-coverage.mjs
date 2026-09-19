#!/usr/bin/env node
/**
 * @p31/canon — test-loom-coverage.mjs
 *
 * Unit tests for the coverage detector: modifier-vs-child classification,
 * family grouping, signal ranking, alias filtering, and contract grounding.
 * Pure — no log, no registry, no commit.
 *
 * Run: node scripts/test-loom-coverage.mjs  (from packages/canon)
 */
import {
  isModifierSuffix,
  detectFamilies,
  uncontractedFamilies,
  groundTokens,
  buildContractBody,
  pascalize,
} from './loom-coverage.mjs';
import { ComponentContractSchema } from '../src/contracts/schema.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// ── 1. modifier vs child classification ────────────────────────────────
ok(isModifierSuffix('-success'), 'tone suffix is a modifier');
ok(isModifierSuffix('-left'), 'positional suffix is a modifier');
ok(isModifierSuffix('-glass'), 'variant-word suffix is a modifier');
ok(isModifierSuffix('--primary'), 'BEM double-dash suffix is a modifier');
ok(!isModifierSuffix('-title'), 'structural child suffix is not a modifier');
ok(!isModifierSuffix('-metric-label'), 'multi-word child suffix is not a modifier');
ok(!isModifierSuffix('title'), 'non-hyphenated suffix is not a modifier');

// ── 2. pascalize ────────────────────────────────────────────────────────
ok(pascalize('.badge') === 'Badge', 'simple slug pascalizes');
ok(pascalize('.a2-data-card') === 'A2DataCard', 'dotted slug pascalizes');

// ── 3. family detection + ranking ───────────────────────────────────────
const classVars = new Map();
const add = (name, tokens = [], files = []) => classVars.set(name, { tokens: new Set(tokens), files: new Set(files) });
// .badge: 4 tone variants
add('.badge', ['--p31-radius-full'], ['recipes.css']);
add('.badge-success', ['--p31-accent-green'], ['recipes.css']);
add('.badge-warning', ['--p31-accent-gold'], ['recipes.css']);
add('.badge-error', ['--p31-accent-red'], ['recipes.css']);
add('.badge-info', ['--p31-accent'], ['recipes.css']);
// .topbar: 4 positional/variant variants, more tokens
add('.topbar', ['--p31-glass-bg', '--p31-space-md'], ['recipes.css']);
add('.topbar-left', ['--p31-accent'], ['recipes.css']);
add('.topbar-center', ['--p31-space-xs'], ['recipes.css']);
add('.topbar-right', ['--p31-space-xs'], ['recipes.css']);
add('.topbar-glass', ['--p31-glass-border'], ['layout.css']);
// .a2-data-card: structural children, must NOT be a family
add('.a2-data-card', ['--p31-glass-bg'], ['a2ui-datacard.css']);
add('.a2-data-card-title', ['--p31-text'], ['a2ui-datacard.css']);
add('.a2-data-card-subtitle', ['--p31-text-tertiary'], ['a2ui-datacard.css']);
add('.a2-data-card-close', ['--p31-text-tertiary'], ['a2ui-datacard.css']);

const families = detectFamilies(classVars);
const names = families.map((f) => f.base).sort();
ok(names.includes('.badge') && names.includes('.topbar'), 'tone and positional families detected');
ok(!names.includes('.a2-data-card'), 'structural-children class is NOT a family');
ok(families[0].base === '.topbar', 'topbar ranks above badge on signal (more tokens)');

// ── 4. alias + contracted filtering ─────────────────────────────────────
const gaps = uncontractedFamilies(families, ['Badge']);
ok(!gaps.some((g) => g.base === '.badge'), 'contracted family is filtered out');
ok(gaps.some((g) => g.base === '.topbar'), 'uncontracted family survives');

// ── 5. token grounding: only resolvable p31.* tokens ────────────────────
const dtcgTokens = new Map([
  ['p31.radius-full', '999px'],
  ['p31.space-md', '16px'],
  ['p31.glass-bg', 'rgba(255,255,255,0.04)'],
  ['p31.text', 'oklch(...)'],
]);
const grounded = groundTokens(classVars, families.find((f) => f.base === '.badge'), dtcgTokens);
ok(grounded.includes('p31.radius-full'), 'grounding resolves a consumed token');
ok(!grounded.includes('p31.accent-green'), 'grounding drops tokens that do not resolve in DTCG');

// ── 6. buildContractBody satisfies the contract schema ──────────────────
const body = buildContractBody(families.find((f) => f.base === '.badge'), grounded, dtcgTokens);
const parsed = ComponentContractSchema.safeParse(body);
ok(parsed.success, `generated contract body satisfies the schema (${parsed.success ? '' : parsed.error.issues[0]?.message})`);
ok(body.props[0].options.length === 4, 'variant enum covers all four badge tones');

if (fails.length) {
  console.error(`\n❌ LOOM COVERAGE FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom coverage — modifier/child split, ranking, alias filter, grounding, schema. All green.');
