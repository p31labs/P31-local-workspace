#!/usr/bin/env node
/**
 * Build all 25 omnibus .docx via p31-forge (used by CI and pnpm run forge:omnibus).
 */
const { spawnSync } = require('child_process');
const path = require('path');

const forgeDir = path.resolve(__dirname, '../p31-forge');
const forge = path.join(forgeDir, 'forge.js');

let failed = 0;
for (let i = 1; i <= 25; i++) {
  const id = String(i).padStart(2, '0');
  const r = spawnSync(process.execPath, [forge, 'paper', '--paper', id], {
    cwd: forgeDir,
    stdio: 'inherit',
    env: process.env
  });
  if (r.status !== 0) {
    failed += 1;
    process.exit(r.status || 1);
  }
}
console.log('\n[forge-omnibus-all] 25/25 complete → p31-forge/out/');
