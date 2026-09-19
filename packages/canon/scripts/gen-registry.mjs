#!/usr/bin/env node
/**
 * @p31/canon — gen-registry.mjs
 *
 * Generates canon/registry.json — the single machine-readable catalog that the
 * design portal, the marketplace, and the MCP server all read. Derived, never
 * hand-maintained, from four sources canon already owns:
 *
 *   tokens      dist/tokens.css
 *   components  src/contracts/*.contract.ts  (+ canon-react implementations)
 *   cssClasses  src/css/*.css
 *   themes      src/theming/theme-store.ts
 *
 * Run: node scripts/gen-registry.mjs  (from packages/canon)
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { THEMES, THEME_IDS, DEFAULT_THEME, SEMANTIC_MAP } from '../src/theming/theme-store.ts';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..'); // packages/canon
const repo = resolve(root, '..', '..');

const semanticNames = new Set(
  Object.keys(SEMANTIC_MAP).map((p) => '--p31-' + p.split('.').join('-')),
);

function category(name) {
  const n = name.replace(/^--p31-/, '');
  if (/^(color|accent|bg|surface|text|glass|neon|glow|status|starfield|void|cloud|portal|scrim)/.test(n)) return 'color';
  if (/^(space|spacing|card-padding)/.test(n)) return 'spacing';
  if (/^(font|type|h1|h2|h3|h4|body|label|caption|scale)/.test(n)) return 'typography';
  if (/^(motion|duration|easing|speed)/.test(n)) return 'motion';
  if (/^radius/.test(n)) return 'radius';
  if (/shadow/.test(n)) return 'shadow';
  if (/^(z-|topbar)/.test(n)) return 'layout';
  return 'other';
}

// ── tokens ─────────────────────────────────────────────────────────────
const css = readFileSync(join(root, 'dist', 'tokens.css'), 'utf8');
const rootMatch = css.match(/:root\s*\{([^}]*)\}/);
const rootDecls = new Map();
if (rootMatch) {
  for (const m of rootMatch[1].matchAll(/(--p31-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    rootDecls.set(m[1], m[2].trim());
  }
}
const firstDecl = new Map();
for (const m of css.matchAll(/(--p31-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
  if (!firstDecl.has(m[1])) firstDecl.set(m[1], m[2].trim());
}
const tokens = [...firstDecl.keys()].sort().map((name) => ({
  name,
  value: rootDecls.get(name) ?? firstDecl.get(name),
  tier: semanticNames.has(name) ? 'semantic' : 'primitive',
  category: category(name),
}));

// ── themes ─────────────────────────────────────────────────────────────
const themes = THEME_IDS.map((id) => ({
  id,
  name: THEMES[id].label,
  description: THEMES[id].description,
  isDefault: id === DEFAULT_THEME,
  tokenCount: Object.keys(THEMES[id].tokens).length,
}));

// ── components (from contracts) ────────────────────────────────────────
const contractsDir = join(root, 'src', 'contracts');
const components = [];
if (existsSync(contractsDir)) {
  for (const f of readdirSync(contractsDir)) {
    if (!f.endsWith('.contract.ts') || f.startsWith('__')) continue;
    const mod = await import(pathToFileURL(join(contractsDir, f)).href);
    const contract = Object.values(mod).find(
      (v) => v && typeof v === 'object' && 'name' in v && 'props' in v,
    );
    if (!contract) continue;
    const enumProps = contract.props.filter((p) => p.type === 'enum');
    const impl = join(repo, 'packages', 'canon-react', 'src', contract.name, `${contract.name}.tsx`);
    components.push({
      slug: contract.name.toLowerCase(),
      name: contract.name,
      layer: contract.layer,
      status: contract.status,
      intent: contract.intent,
      contract: `src/contracts/${f}`,
      import: contract.importStatement,
      implemented: existsSync(impl),
      props: contract.props.map((p) => ({
        name: p.name,
        type: p.type,
        required: !!p.required,
        options: p.options ?? null,
        default: p.default ?? null,
        description: p.description,
      })),
      variants: Object.fromEntries(enumProps.map((p) => [p.name, p.options])),
      states: Object.keys(contract.interactionStates ?? {}),
      tokens: contract.tokenContract,
    });
  }
}

// ── css classes ────────────────────────────────────────────────────────
const cssDir = join(root, 'src', 'css');
const classMap = new Map();
if (existsSync(cssDir)) {
  for (const f of readdirSync(cssDir).filter((x) => x.endsWith('.css'))) {
    const text = readFileSync(join(cssDir, f), 'utf8');
    // Strip block comments first — otherwise `.class` names in prose (e.g.
    // "size-class.css") leak into the selector capture and become phantom
    // classes (the committed registry carried a phantom ".css" from exactly
    // this). Must match ingest.ts's parseCss.
    const cleaned = text.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of cleaned.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const body = m[2];
      const used = [...new Set([...body.matchAll(/var\((--p31-[a-z0-9-]+)/g)].map((x) => x[1]))];
      if (!used.length) continue;
      for (const c of m[1].matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
        const name = '.' + c[1];
        const e = classMap.get(name) ?? { name, files: new Set(), tokens: new Set() };
        e.files.add(f);
        used.forEach((t) => e.tokens.add(t));
        classMap.set(name, e);
      }
    }
  }
}
const cssClasses = [...classMap.values()]
  .map((c) => ({ name: c.name, files: [...c.files].sort(), tokens: [...c.tokens].sort() }))
  .sort((a, b) => a.name.localeCompare(b.name));

const registry = {
  generatedFrom: [
    'dist/tokens.css',
    'src/contracts/*.contract.ts',
    'src/css/*.css',
    'src/theming/theme-store.ts',
  ],
  counts: {
    tokens: tokens.length,
    components: components.length,
    cssClasses: cssClasses.length,
    themes: themes.length,
  },
  tokens,
  components,
  cssClasses,
  themes,
};

writeFileSync(join(root, 'registry.json'), JSON.stringify(registry, null, 2) + '\n');
console.log(`gen-registry — tokens:${registry.counts.tokens} components:${registry.counts.components} cssClasses:${registry.counts.cssClasses} themes:${registry.counts.themes}`);
console.log('  components: ' + components.map((c) => c.name + (c.implemented ? '' : ' [contract only]')).join(', '));
