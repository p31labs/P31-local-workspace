#!/usr/bin/env node
/**
 * Fail CI if Cloudflare Pages deploy targets are crossed (hub vs Hearing Ops).
 * Extend this file when adding new wrangler pages deploy scripts.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function read(p) {
  return readFileSync(join(ROOT, p), 'utf8');
}

const errors = [];

// Hearing Ops must never deploy to project "p31ca"
const hopsPkg = '04_SOFTWARE/p31-hearing-ops/package.json';
if (existsSync(join(ROOT, hopsPkg))) {
  const j = JSON.parse(read(hopsPkg));
  const deploy = j.scripts?.deploy ?? '';
  if (deploy.includes('--project-name p31ca') || deploy.includes('--project-name=p31ca')) {
    errors.push(`${hopsPkg}: deploy script must use --project-name p31-hearing-ops, not p31ca`);
  }
  if (!deploy.includes('p31-hearing-ops')) {
    errors.push(`${hopsPkg}: deploy script should reference project p31-hearing-ops`);
  }
}

// Hub must deploy to p31ca
const hubPkg = '04_SOFTWARE/p31ca/package.json';
if (existsSync(join(ROOT, hubPkg))) {
  const j = JSON.parse(read(hubPkg));
  const deploy = j.scripts?.deploy ?? '';
  if (deploy && !deploy.includes('--project-name p31ca') && !deploy.includes('--project-name=p31ca')) {
    errors.push(`${hubPkg}: hub deploy should target --project-name p31ca`);
  }
}

// phosphorus31.org marketing site (parallel to p31ca hub — separate Pages project)
const p31Site = 'phosphorus31.org/planetary-planet/package.json';
if (existsSync(join(ROOT, p31Site))) {
  const j = JSON.parse(read(p31Site));
  const deploy = j.scripts?.deploy ?? '';
  if (deploy) {
    if (!deploy.includes('phosphorus31-org')) {
      errors.push(`${p31Site}: deploy must use --project-name phosphorus31-org`);
    }
  }
}

if (errors.length) {
  console.error('enterprise-deploy-guard: FAILED\n');
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log('enterprise-deploy-guard: OK (Pages project names consistent)');
