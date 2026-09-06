#!/usr/bin/env node
/**
 * generate-a2ui-catalog.mjs
 *
 * Reads design-system.json and generates A2UI v0.9 flat catalog JSON
 * for each consumer app.
 *
 * Usage:
 *   node scripts/generate-a2ui-catalog.mjs
 *   node scripts/generate-a2ui-catalog.mjs --design-system path/to/design-system.json
 *   node scripts/generate-a2ui-catalog.mjs --out-dir apps/phos/public/.well-known
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── A2UI action mapping ────────────────────────────────────────────────

const ACTION_MAP = {
  GlassPanel:    [],
  GlassCard:     ['click', 'focus', 'hover'],
  GlassStrong:   [],
  GlassSubtle:   [],
  Button:        ['click', 'focus', 'hover'],
  SpoonMeter:    ['change', 'update'],
  TetraGrid:     [],
  HonestLabel:   [],
  StatusBadge:   [],
  CrisisOverlay: ['dismiss', 'confirm'],
  Starfield:     ['start', 'stop'],
  ThemeToggle:   ['toggle'],
  CandyHeader:   ['navigate'],
  Crown:         [],
  SpoonDial:     ['change'],
};

const CONSUMER_APPS = [
  'phos',
  'p31ca',
  'willow',
  'bonding',
  'phosphorus31',
];

// ─── A2UI type mapping ──────────────────────────────────────────────────

function mapA2uiType(dsType) {
  switch (dsType) {
    case 'string':  return 'string';
    case 'number':  return 'number';
    case 'boolean': return 'boolean';
    default:        return 'string';
  }
}

function mapProps(dsProps) {
  if (!dsProps || Object.keys(dsProps).length === 0) return {};
  const result = {};
  for (const [name, def] of Object.entries(dsProps)) {
    const entry = { type: mapA2uiType(def.type) };
    if ('default' in def) entry.default = def.default;
    if (def.options)      entry.options = def.options;
    if (def.range)        entry.range   = def.range;
    result[name] = entry;
  }
  return result;
}

function buildCatalog(designSystem) {
  // Load tool-token bindings from semantic manifest if available
  let tokenBindings = {};
  const semanticPath = path.join(ROOT, 'packages', 'design-core', 'src', 'css', 'semantic-token-manifest.json');
  try {
    const semantic = JSON.parse(fs.readFileSync(semanticPath, 'utf8'));
    tokenBindings = semantic.toolTokenBindings || {};
  } catch {
    // semantic manifest not yet generated — proceed without bindings
  }

  const components = (designSystem.components || []).map(comp => {
    const entry = {
      name:        comp.name,
      description: comp.description,
      props:       mapProps(comp.props),
      actions:     ACTION_MAP[comp.name] || [],
      tool:        comp.tool || null,
    };
    // Attach tool-token bindings from semantic manifest
    const binding = tokenBindings[comp.name];
    if (binding && binding.tokens && binding.tokens.length > 0) {
      entry.tokenBindings = {
        css_variables: binding.tokens.map(t => t.css),
        resolved: binding.tokens.reduce((acc, t) => {
          acc[t.css] = t.resolved;
          return acc;
        }, {}),
      };
    }
    return entry;
  });

  const apps = (designSystem.metadata?.apps) || CONSUMER_APPS;

  return {
    $schema: 'https://a2ui.dev/schemas/catalog.json',
    version: '0.9',
    metadata: {
      name:        designSystem.metadata?.name || 'P31 Quantum Design System',
      description: designSystem.metadata?.description || '',
      base_url:    designSystem.metadata?.base_url || '',
      apps,
    },
    components,
  };
}

function writeCatalog(catalog, outPath) {
  const dir = path.dirname(outPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2));
  return outPath;
}

function main() {
  const dsArg    = process.argv.find(a => a.startsWith('--design-system=')) || '--design-system=design-system.json';
  const dsPath   = path.resolve(ROOT, dsArg.split('=')[1] || 'design-system.json');
  const outDir   = process.argv.find(a => a.startsWith('--out-dir='))?.split('=')[1];

  if (!fs.existsSync(dsPath)) {
    console.error(`design-system.json not found at ${dsPath}`);
    process.exit(1);
  }

  const designSystem = JSON.parse(fs.readFileSync(dsPath, 'utf8'));
  const catalog = buildCatalog(designSystem);

  if (outDir) {
    const resolved = path.resolve(ROOT, outDir);
    const written = writeCatalog(catalog, path.join(resolved, 'a2ui-catalog.json'));
    console.log(`Wrote A2UI catalog to ${written}`);
  } else {
    for (const app of CONSUMER_APPS) {
      const wkDir = path.join(ROOT, 'apps', app, 'public', '.well-known');
      const written = writeCatalog(catalog, path.join(wkDir, 'a2ui-catalog.json'));
      console.log(`Wrote A2UI catalog to ${written}`);
    }
  }
}

main();
