/**
 * Retired-contracts verification.
 *
 * LOVEToken.sol was archived in Phase 1. This test proves no ACTIVE code,
 * test, deploy script, config, or doc references LOVEToken as a LIVE contract.
 *
 * Allowed references (encoded below):
 *   - the archived file itself:  .../archived/LOVEToken.sol
 *   - the archive-procedure doc: LOVEToken_ARCHIVE_INSTRUCTIONS.md
 *   - this test file (self-reference)
 *   - a file that contains an explicit retirement disclaimer banner
 *     (legacy architecture docs kept for historical reference)
 */

import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const ROOT = resolve(__dirname, '..', '..', '..'); // -> P31-local-workspace

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'andromeda-archive-20260707',
  'dist',
  'build',
  'out', // Foundry build artifacts (mention archived source)
  '.wrangler',
  '.svelte-kit',
  'cache', // Foundry cache artifacts
]);

const EXCLUDE_FILES = new Set([
  'retired-contracts.test.ts', // this test (self-reference)
]);

const SCAN_EXT = new Set(['.sol', '.ts', '.tsx', '.js', '.jsx', '.md', '.toml', '.json', '.sql', '.yml', '.yaml', '.sh', '.html', '.astro']);

interface Hit { file: string; line: number; text: string; }
interface FileScan { hits: Hit[]; hasRetirementDisclaimer: boolean; }

// A file-level banner stating LOVEToken was archived => the whole file is
// treated as historical reference, not a live-contract claim.
const RETIREMENT_BANNER = /LOVEToken.{0,40}(archiv|retir)/i;

function scanFile(full: string, scan: FileScan): void {
  let content: string;
  try {
    content = readFileSync(full, 'utf8');
  } catch {
    return; // skip unreadable files (permissions, etc.)
  }
  if (RETIREMENT_BANNER.test(content)) scan.hasRetirementDisclaimer = true;
  content.split('\n').forEach((text, i) => {
    if (/LOVEToken/.test(text)) scan.hits.push({ file: full, line: i + 1, text });
  });
}

function walk(dir: string, files: Map<string, FileScan>): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (EXCLUDE_DIRS.has(name)) continue;
      walk(full, files);
    } else if (SCAN_EXT.has(name.slice(name.lastIndexOf('.')))) {
      if (EXCLUDE_FILES.has(name)) continue;
      if (!files.has(full)) files.set(full, { hits: [], hasRetirementDisclaimer: false });
      scanFile(full, files.get(full)!);
    }
  }
}

describe('LOVEToken is fully retired', () => {
  const files = new Map<string, FileScan>();
  walk(ROOT, files);

  const allHits: Hit[] = [];
  for (const scan of files.values()) allHits.push(...scan.hits);

  it('has no LOVEToken references presented as a live contract', () => {
    const violations = allHits.filter((h) => {
      const rel = h.file;
      const inArchivedFile = /[\\/]archived[\\/]LOVEToken\.sol$/.test(rel);
      const isArchiveInstructions = /[\\/]LOVEToken_ARCHIVE_INSTRUCTIONS\.md$/.test(rel);
      const fileScan = files.get(rel);
      const fileDisclaimed = fileScan?.hasRetirementDisclaimer ?? false;
      const lineNotesRetirement = /archiv|retir|archive/i.test(h.text);
      return !inArchivedFile && !isArchiveInstructions && !fileDisclaimed && !lineNotesRetirement;
    });

    if (violations.length) {
      const detail = violations
        .map((v) => `${v.file}:${v.line}: ${v.text.trim()}`)
        .join('\n');
      throw new Error(`LOVEToken referenced as live contract:\n${detail}`);
    }
    expect(violations.length).toBe(0);
  });

  it('still finds the intentional archived file (sanity)', () => {
    const archived = allHits.filter((h) => /[\\/]archived[\\/]LOVEToken\.sol$/.test(h.file));
    expect(archived.length).toBeGreaterThan(0);
  });
});
