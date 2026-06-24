#!/usr/bin/env tsx

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join, resolve, relative } from 'path';

const BASE = resolve(import.meta.dirname, '..');
const BADGES_DIR = resolve(BASE, '..', '.p31', 'badges');

interface ArtifactDef {
  name: string;
  displayName: string;
}

const ARTIFACTS: Record<string, ArtifactDef> = {
  'packages/shared': { name: '@p31/shared', displayName: '@p31/shared' },
  p31ca: { name: 'p31ca', displayName: 'p31ca' },
  bonding: { name: 'bonding', displayName: 'bonding' },
  'k4-cage': { name: 'k4-cage', displayName: 'k4-cage' },
  'k4-personal': { name: 'k4-personal', displayName: 'k4-personal' },
  'k4-hubs': { name: 'k4-hubs', displayName: 'k4-hubs' },
  'p31-cortex': { name: 'p31-cortex', displayName: 'p31-cortex' },
  'p31-forge': { name: 'p31-forge', displayName: 'p31-forge' },
  'donate-api': { name: 'donate-api', displayName: 'donate-api' },
  'p31-hearing-ops': { name: 'p31-hearing-ops', displayName: 'hearing-ops' },
  'cloudflare-worker/command-center': { name: 'command-center', displayName: 'command-center' },
  'telemetry-worker': { name: 'telemetry-worker', displayName: 'telemetry-worker' },
  workers: { name: 'workers', displayName: 'love-ledger+orchestrator' },
  '../phosphorus31.org/planetary-planet': { name: 'phosphorus31', displayName: 'phosphorus31' },
  '../apps/willow': { name: 'willow', displayName: 'willow' },
};

function main(): void {
  const indexFile = join(BADGES_DIR, 'index.json');

  if (!existsSync(indexFile)) {
    console.error('No badges index found. Run generate-maturity-badges.ts first.');
    process.exit(1);
  }

  interface BadgeEntry {
    artifact: string;
    path: string;
    stage: string;
    scores: { code: number; test: number; docs: number; ops: number; sec: number };
    badgeFile: string;
  }

  const index: BadgeEntry[] = JSON.parse(readFileSync(indexFile, 'utf-8'));
  const badgeMap = new Map<string, BadgeEntry>();
  for (const entry of index) {
    badgeMap.set(entry.path, entry);
  }

  for (const [relPath, def] of Object.entries(ARTIFACTS)) {
    const dir = join(BASE, relPath);
    const readme = join(dir, 'README.md');

    if (!existsSync(readme)) {
      console.log(`  \u2716 ${def.displayName} — no README.md`);
      continue;
    }

    const entry = badgeMap.get(relPath);
    if (!entry) {
      console.log(`  \u2716 ${def.displayName} — no badge entry`);
      continue;
    }

    const safeName = def.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const badgeRelPath = relative(dir, BADGES_DIR);
    const badgeRef = `![PMM Maturity](${badgeRelPath}/${safeName}.svg)`;

    let content = readFileSync(readme, 'utf-8');
    const markerStart = '<!-- pmm-badge -->';
    const markerEnd = '<!-- /pmm-badge -->';

    const startIdx = content.indexOf(markerStart);

    if (startIdx !== -1) {
      const endIdx = content.indexOf(markerEnd, startIdx);
      if (endIdx !== -1) {
        const before = content.slice(0, startIdx + markerStart.length);
        const after = content.slice(endIdx);
        content = `${before}\n${badgeRef}\n${after}`;
      } else {
        const before = content.slice(0, startIdx + markerStart.length);
        const after = content.slice(startIdx + markerStart.length);
        content = `${before}\n${badgeRef}\n<!-- pmm-badge -->${after}`;
      }
    } else {
      const headerEnd = content.indexOf('\n\n');
      const insertPos = headerEnd !== -1 ? headerEnd + 2 : 0;
      content = `${content.slice(0, insertPos)}${markerStart}\n${badgeRef}\n${markerEnd}\n\n${content.slice(insertPos)}`;
    }

    writeFileSync(readme, content, 'utf-8');
    console.log(`  \u2714 ${def.displayName} — badge inserted in README.md`);
  }
}

main();
