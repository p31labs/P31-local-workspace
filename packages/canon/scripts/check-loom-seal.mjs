#!/usr/bin/env node
/**
 * @p31/canon — check-loom-seal.mjs
 *
 * The write-side seal, enforced. The ONLY module allowed to append to the Loom
 * log is jsonl-write.internal.ts, and the only module allowed to import it is
 * commit.ts. Every writer must go through commit() so the ReplayGate validates
 * and seq is assigned under lock.
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
  join(repo, 'packages', 'canon-mcp', 'src'),
  join(repo, 'apps', 'loom', 'src'),
];

const EXTS = /\.(ts|tsx|mjs|js|astro)$/;

/** The one module permitted to touch the filesystem for writes. */
const WRITE_MODULE = 'jsonl-write.internal.ts';
/** The one module permitted to import the write module. */
const COMMIT_MODULE = 'commit.ts';

function walk(dir) {
  let out = [];
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
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
    const isCommitModule = base === COMMIT_MODULE;
    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      const n = i + 1;
      // appendEvent may only be defined/imported in the two sealed modules.
      if (!isWriteModule && !isCommitModule && /appendEvent\s*\(/.test(line)) rule(file, n, 'appendEvent', line);
      // Raw filesystem appends belong only to the write module.
      if (!isWriteModule && /appendFileSync\s*\(/.test(line)) rule(file, n, 'appendFileSync', line);
      if (!isWriteModule && /createWriteStream\s*\(/.test(line)) rule(file, n, 'createWriteStream', line);
      if (/writeFileSync\s*\(/.test(line) && /jsonl|LOOM_LOG|loom/i.test(line)) rule(file, n, 'writeFileSync(loom)', line);
    });
  }
}

if (violations.length) {
  console.error(`\n❌ LOOM SEAL BROKEN — ${violations.length} bypass path(s):`);
  for (const v of violations) console.error(`   • ${v}`);
  console.error('\n   Every write must go through commit(). See src/loom/commit.ts.');
  process.exit(1);
}
console.log('✅ loom seal — the only writer is commit() (jsonl-write.internal.ts, imported only by commit.ts).');
