#!/usr/bin/env node
/**
 * @p31/canon — check-loom-seal.mjs
 *
 * The write-side seal, enforced. The ONLY module allowed to append to either
 * log is jsonl-append.internal.ts, and the only modules allowed to import it
 * are commit.ts (warp) and commitWeft.ts (weft). Every writer must go through
 * one of those so the gates validate and seq is assigned under lock.
 *
 * This scans the Loom/MCP/canvas source trees for any other append path and
 * exits 1 on a single hit. A bypass is a build failure, not a code review note.
 *
 * Run: node scripts/check-loom-seal.mjs  (from packages/canon)
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..', '..', '..');

const SCAN_DIRS = [
  join(repo, 'packages', 'canon', 'src', 'loom'),
  join(repo, 'packages', 'canon', 'scripts'),
  join(repo, 'packages', 'canon-mcp', 'src'),
  join(repo, 'apps', 'loom'),
];

const EXTS = /\.(ts|tsx|mjs|js|astro)$/;

/** The one module permitted to touch the filesystem for writes. */
const WRITE_MODULE = 'jsonl-append.internal.ts';
/** The two modules permitted to import the write module. */
const COMMIT_MODULES = ['commit.ts', 'commitWeft.ts'];

function walk(dir) {
  let out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name === '.git') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(full));
    else if (EXTS.test(e.name)) out.push(full);
  }
  return out;
}

const violations = [];
const rule = (file, lineNo, kind, line) =>
  violations.push(`${file.replace(repo + '/', '')}:${lineNo}  [${kind}]  ${line.trim().slice(0, 90)}`);

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir)) {
    const base = file.slice(file.lastIndexOf('/') + 1);
    const isWriteModule = base === WRITE_MODULE;
    const isCommitModule = COMMIT_MODULES.includes(base);
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const n = i + 1;
      // appendEvent may only be defined/imported in the sealed modules.
      if (!isWriteModule && !isCommitModule && /appendEvent\s*\(/.test(line)) rule(file, n, 'appendEvent', line);
      // Raw filesystem appends belong only to the write module.
      if (!isWriteModule && /appendFileSync\s*\(/.test(line)) rule(file, n, 'appendFileSync', line);
      if (!isWriteModule && /createWriteStream\s*\(/.test(line)) rule(file, n, 'createWriteStream', line);
      // writeFileSync is only a bypass when it targets the LIVE logs (a path
      // resolved via LOOM_LOG / resolveLogPath(), or a literal events.jsonl /
      // weft.jsonl). Test-fixture writes to temp files are allowed — they
      // precede the gate and write a fixture, not a log.
      if (/writeFileSync\s*\(/.test(line) && /(?:LOOM_LOG|resolveLogPath\(\)|events\.jsonl|weft\.jsonl)/.test(line)) rule(file, n, 'writeFileSync', line);
    });
  }
}

if (violations.length) {
  console.error(`\n❌ LOOM SEAL BROKEN — ${violations.length} bypass path(s):`);
  for (const v of violations) console.error(`   • ${v}`);
  console.error('\n   Every write must go through commit(). See src/loom/commit.ts.');
  process.exit(1);
}
console.log('✅ loom seal — two logs, one append primitive (jsonl-append.internal.ts), two sealed importers (commit.ts + commitWeft.ts).');
