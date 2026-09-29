#!/usr/bin/env node
// Emits the KNOWN_GAPS open-count as {"count": N} — the input the
// known-gaps ratchet reads. A gap counts as open when its Status column
// does not contain "fixed".
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(process.argv[2] ?? 'KNOWN_GAPS.md');
try {
  const text = readFileSync(file, 'utf8');
  const open = text
    .split('\n')
    .filter((line) => line.trim().startsWith('|'))
    .filter((line) => !/^\|\s*#/.test(line) && !/^\|\s*-+/.test(line))
    .filter((line) => !/fixed/i.test(line))
    .length;
  console.log(`{"count": ${open}}`);
} catch (e) {
  console.error(`KNOWN_GAPS.md missing or unreadable: ${file}`);
  process.exit(1);
}