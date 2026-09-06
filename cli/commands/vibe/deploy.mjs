#!/usr/bin/env node
/**
 * p31 vibe deploy — Deploy an app to the P31 mesh.
 * Usage: p31 vibe deploy --name "My App" --html "<h1>Hi</h1>" [--css "..."] [--js "..."] [--family did:xxx]
 */
import { P31Client } from '../../packages/vibe-sdk/src/index.ts';

const getArg = (name) => {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 && idx + 1 < process.argv.length ? process.argv[idx + 1] : null;
};
const hasArg = (name) => process.argv.includes(`--${name}`);

const name = getArg('name');
const html = getArg('html');
const css = getArg('css') || '';
const js = getArg('js') || '';
const familyId = getArg('family') || 'p31:default';

if (!name || !html) {
  console.error('Usage: p31 vibe deploy --name "App Name" --html "<main>...</main>" [--css "..."] [--js "..."] [--family did:xxx]');
  process.exit(1);
}

const p31 = new P31Client({ familyId });
console.log(`🚀 Deploying "${name}"...`);

try {
  const result = await p31.deploy({ name, html, css, js, familyId });
  console.log(`\n✅ Deployed!`);
  console.log(`   App ID: ${result.id}`);
  console.log(`   Family: ${result.family_id}`);
  console.log(`   URL:    ${result.url}`);
} catch (e) {
  console.error('Deploy failed:', e.message);
  console.error('Try: curl -X POST https://app-supervisor.trimtab-signal.workers.dev/apps/create -H "Content-Type: application/json" -d \'{"name":"...","html":"..."}\'');
  process.exit(1);
}
