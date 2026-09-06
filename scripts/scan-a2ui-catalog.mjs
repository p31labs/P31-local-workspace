/**
 * scan-a2ui-catalog.mjs — Build A2UI catalog from production portals.
 *
 * Priority:
 * 1. Scan /home/p31/production/portals/ for data-a2ui-component
 * 2. If none found, fall back to design-system.json generator
 * 3. Write catalog to .well-known/a2ui-catalog.json and copy to all consumer apps
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PRODUCTION_PORTALS = '/home/p31/production/portals';
const OUTPUT = path.join(ROOT, '.well-known/a2ui-catalog.json');
const CONSUMER_APPS = ['phos', 'p31ca', 'willow', 'bonding', 'phosphorus31'];
const PRODUCTION_PORTAL_DIRS = [
  'children',
  'teen',
  'parent',
  'developer/p31ca',
  'institutional/phosphorus31',
  'meatspace',
  'design',
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---- HTML annotation parser (lightweight regex) ----
function extractComponentsFromHTML(html, filePath) {
  const components = [];
  const re = /<[^>]*\s+data-a2ui-component=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const name = match[1];
    const propsMatch = tag.match(/data-a2ui-props=["']([^"']*)["']/);
    let props = {};
    if (propsMatch) {
      try { props = JSON.parse(propsMatch[1]); } catch { /* ignore */ }
    }
    const actionsMatch = tag.match(/data-a2ui-actions=["']([^"']*)["']/);
    let actions = [];
    if (actionsMatch) {
      try { actions = JSON.parse(actionsMatch[1]); } catch { /* ignore */ }
    }
    if (!components.some(c => c.name === name)) {
      components.push({
        name,
        description: `A2UI component from ${path.basename(filePath)}`,
        props: Object.keys(props).length ? props : undefined,
        actions: actions.length ? actions : undefined,
        source: filePath,
      });
    }
  }
  return components;
}

function scanProductionPortals() {
  if (!fs.existsSync(PRODUCTION_PORTALS)) {
    console.warn(`⚠️  Production portals path not found: ${PRODUCTION_PORTALS}`);
    return [];
  }
  const htmlFiles = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlFiles.push(fullPath);
    }
  };
  walk(PRODUCTION_PORTALS);
  console.log(`🔍 Scanning ${htmlFiles.length} production HTML files...`);
  const allComponents = [];
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const comps = extractComponentsFromHTML(content, file);
    for (const comp of comps) {
      if (!allComponents.find(c => c.name === comp.name)) {
        allComponents.push(comp);
      } else {
        const existing = allComponents.find(c => c.name === comp.name);
        if (comp.props && !existing.props) existing.props = comp.props;
        if (comp.actions && !existing.actions) existing.actions = comp.actions;
      }
    }
  }
  return allComponents;
}

// ---- Fallback: design-system generator ----
function runFallback() {
  const FALLBACK_GENERATOR = path.join(ROOT, 'scripts', 'generate-a2ui-catalog.mjs');
  if (fs.existsSync(FALLBACK_GENERATOR)) {
    execSync(`node ${FALLBACK_GENERATOR}`, { cwd: ROOT, stdio: 'inherit' });
  } else {
    console.error('❌ Fallback catalog generator not found.');
    process.exit(1);
  }
  const consumerApps = ['phos', 'p31ca', 'willow', 'bonding', 'phosphorus31'];
  for (const app of consumerApps) {
    const appCatalog = path.join(ROOT, 'apps', app, 'public', '.well-known', 'a2ui-catalog.json');
    if (fs.existsSync(appCatalog)) {
      fs.copyFileSync(appCatalog, OUTPUT);
      console.log(`  Copied ${app} catalog → root .well-known/a2ui-catalog.json`);
      break;
    }
  }
}

// ---- Merge with base schema ----
function mergeWithBase() {
  const BASE_CATALOG = path.join(ROOT, 'packages', 'interface-generator', 'src', 'adapters', 'a2ui.schema.json');
  if (!fs.existsSync(BASE_CATALOG) || !fs.existsSync(OUTPUT)) return;
  try {
    const base = JSON.parse(fs.readFileSync(BASE_CATALOG, 'utf8'));
    const scanned = JSON.parse(fs.readFileSync(OUTPUT, 'utf8'));
    const merged = {
      ...base,
      components: [
        ...base.components.filter(c => !scanned.components.some(s => s.name === c.name)),
        ...scanned.components,
      ],
      version: '1.0.0',
      id: 'p31ca.org:a2ui',
    };
    fs.writeFileSync(OUTPUT, JSON.stringify(merged, null, 2));
    console.log('✅ Merged with base catalog');
  } catch (err) {
    console.warn('⚠️  Could not merge with base catalog:', err.message);
  }
}

// ---- Copy to consumer apps ----
function copyToConsumerApps() {
  for (const app of CONSUMER_APPS) {
    const target = path.join(ROOT, 'apps', app, 'public', '.well-known', 'a2ui-catalog.json');
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    fs.copyFileSync(OUTPUT, target);
    console.log(`  ✅ Copied to apps/${app}/public/.well-known/`);
  }
}

// ---- Copy to production portal webroots ----
function copyToProductionPortals() {
  for (const subdir of PRODUCTION_PORTAL_DIRS) {
    const targetDir = path.join(PRODUCTION_PORTALS, subdir, '.well-known');
    const targetFile = path.join(targetDir, 'a2ui-catalog.json');
    ensureDir(targetDir);
    fs.copyFileSync(OUTPUT, targetFile);
    console.log(`  ✅ Copied to production/${subdir}/.well-known/a2ui-catalog.json`);
  }
}

// ---- Main ----
function main() {
  console.log('🔍 A2UI Catalog Generation (Production-first)');
  console.log('═══════════════════════════════════════════════');

  ensureDir(path.dirname(OUTPUT));

  let components = scanProductionPortals();

  if (!components || components.length === 0) {
    console.log('⚠️  No production components found. Falling back to design-system generator.');
    runFallback();
  } else {
    console.log(`✅ Found ${components.length} component(s) from production portals.`);
  }

  const catalog = {
    $schema: 'https://a2ui.dev/schemas/catalog.json',
    version: '1.0.0',
    metadata: {
      name: 'P31 Production Catalog',
      description: 'Auto-generated from deployed HTML portals',
      source: 'production',
      generated: new Date().toISOString(),
    },
    components: components.map(c => ({
      name: c.name,
      description: c.description || '',
      props: c.props || {},
      actions: c.actions || [],
    })),
  };

  fs.writeFileSync(OUTPUT, JSON.stringify(catalog, null, 2));
  console.log(`📄 Catalog written to ${OUTPUT}`);

  copyToConsumerApps();
  copyToProductionPortals();
  mergeWithBase();

  console.log(`\n🎉 Done. Component count: ${catalog.components.length}`);
}

main();
