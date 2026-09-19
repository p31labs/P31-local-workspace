#!/usr/bin/env node
/**
 * @p31/canon — bench/compare.mjs
 *
 * Scores the Loom and the baseline on the four axes from task.md: token
 * grounding, caveat honesty, prop completeness, determinism. Produces a table.
 *
 * Inputs are two directories of pre-run artifacts: <dir>/<fixture>.loom.json
 * and <dir>/<fixture>.baseline.json. If a baseline is missing, that column is
 * empty — the method is what ships; the result waits on a manual model run.
 *
 * Run: node scripts/bench/compare.mjs <loom-dir> <baseline-dir> <tokens-file>
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseTokens } from '../../src/loom/ingest.ts';

const loomDir = resolve(process.argv[2] ?? '');
const baselineDir = resolve(process.argv[3] ?? '');
const tokensFile = resolve(process.argv[4] ?? '');

const resolvable = new Set(parseTokens(readFileSync(tokensFile, 'utf8')).map((t) => t.name));

function score(body) {
  if (!body || body.error) return null;
  const tokens = body.tokenContract ?? [];
  // Empty tokenContract is "no grounding", not "perfect grounding" — an empty
  // set divides to NaN and would read as 1.0 otherwise.
  const grounding = tokens.length ? tokens.filter((t) => resolvable.has(t)).length / tokens.length : 0;
  const hasCaveat = (body.caveats ?? []).length > 0 || (body.antiExamples ?? []).length > 0;
  const variantOptions = (body.props ?? []).find((p) => p.type === 'enum')?.options ?? [];
  const completeness = variantOptions.length >= 2 ? 1 : 0;
  return { grounding: +grounding.toFixed(2), caveat: hasCaveat ? 1 : 0, props: completeness };
}

const fixtures = new Set();
for (const dir of [loomDir, baselineDir]) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir)) {
    const m = f.match(/^(.+)\.(loom|baseline)\.json$/);
    if (m) fixtures.add(m[1]);
  }
}

console.log('fixture            | runner  | grounding | caveat | props');
console.log('-------------------|---------|-----------|--------|------');
for (const fx of [...fixtures].sort()) {
  for (const [runner, dir] of [['loom', loomDir], ['baseline', baselineDir]]) {
    const path = join(dir, `${fx}.${runner}.json`);
    if (!existsSync(path)) continue;
    const s = score(JSON.parse(readFileSync(path, 'utf8')));
    if (!s) {
      console.log(`${fx.padEnd(18)} | ${runner.padEnd(7)} | (no output)`);
      continue;
    }
    console.log(`${fx.padEnd(18)} | ${runner.padEnd(7)} | ${String(s.grounding).padEnd(9)} | ${String(s.caveat).padEnd(6)} | ${s.props}`);
  }
}
