#!/usr/bin/env node
/**
 * @p31/canon — test-loom-ingest.mjs
 *
 * Ingestion unit tests: parseCss (comment-stripping, token extraction,
 * hardcoded-value honesty), parseTokens (flat + DTCG), and toRegistry.
 *
 * Run: node scripts/test-loom-ingest.mjs  (from packages/canon)
 */
import { parseCss, parseTokens, toRegistry } from '../src/loom/ingest.ts';

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); };

// ── 1. parseCss strips comments — prose class names must not leak ───────
{
  const css = `
/* note: loom-ingest.mjs and .btn-danger are mentioned in prose */
.card { border-radius: var(--radius-md); color: var(--color-primary); }
.card-danger { background: #ef4444; }
.card-wide { width: 100%; }
`;
  const classes = parseCss(css, 'test.css');
  const names = classes.map((c) => c.name);
  ok(names.includes('.card'), 'real class parsed');
  ok(!names.includes('.mjs'), 'comment prose class name does not leak');
  ok(!names.includes('.card-danger'), 'hardcoded-value class with no var() is omitted');
  ok(!names.includes('.card-wide'), 'class with no var() is omitted');
  ok(classes.find((c) => c.name === '.card').tokens.includes('--radius-md'), 'consumed var extracted');
}

// ── 2. parseTokens flat shape ───────────────────────────────────────────
{
  const flat = '--p31-accent: oklch(0.7 0.2 300);\n--p31-space-md: 16px;\n';
  const tokens = parseTokens(flat);
  ok(tokens.length === 2, 'flat token block parsed');
  ok(tokens[0].name === '--p31-accent', 'flat var name preserved');
}

// ── 3. parseTokens DTCG shape ───────────────────────────────────────────
{
  const dtcg = JSON.stringify({ color: { primary: { $value: '#3b82f6' } }, radius: { full: { $value: '999px' } } });
  const tokens = parseTokens(dtcg);
  ok(tokens.length === 2, 'DTCG token tree parsed');
  ok(tokens.some((t) => t.name === 'color.primary'), 'DTCG path preserved as dots');
}

// ── 4. toRegistry shape ─────────────────────────────────────────────────
{
  const classes = [{ name: '.card', files: ['a.css'], tokens: ['--radius-md'] }];
  const tokens = [{ name: 'color.primary', value: '#3b82f6' }];
  const r = toRegistry(classes, tokens, { source: 'fixture' });
  ok(r.counts.cssClasses === 1, 'class count correct');
  ok(r.counts.tokens === 1, 'token count correct');
  ok(r.counts.components === 0, 'components empty — ingestion does not invent contracts');
  ok(r.components.length === 0 && r.themes.length === 0, 'components and themes empty');
  ok(r.generatedFrom[0] === 'fixture', 'source recorded');
}

if (fails.length) {
  console.error(`\n❌ LOOM INGEST FAILED — ${fails.length} failure(s):`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log('✅ loom ingest — comment-stripping, hardcoded-value honesty, flat + DTCG tokens, registry shape.');
