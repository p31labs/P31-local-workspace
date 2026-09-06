#!/usr/bin/env node
/**
 * p31 vibe list — List deployed apps for a family.
 * Usage: p31 vibe list [--family did:xxx]
 */
import { P31Client } from '../../packages/vibe-sdk/src/index.ts';

const familyIdx = process.argv.indexOf('--family');
const familyId = familyIdx >= 0 ? process.argv[familyIdx + 1] : 'p31:default';

const p31 = new P31Client({ familyId });

try {
  const apps = await p31.list();
  console.log(`\n📚 Deployed Apps (${apps.length}):\n`);
  for (const app of apps) {
    console.log(`  ${app.name}`);
    console.log(`    ID:      ${app.id}`);
    console.log(`    Family:  ${app.family_id || 'public'}`);
    console.log(`    Creator: ${app.creator}`);
    console.log(`    Deploys: ${app.deploy_count || 0}`);
    console.log(`    URL:     https://app-supervisor.trimtab-signal.workers.dev/apps/${app.id}`);
    console.log();
  }
} catch (e) {
  console.error('Failed to list apps:', e.message);
  process.exit(1);
}
