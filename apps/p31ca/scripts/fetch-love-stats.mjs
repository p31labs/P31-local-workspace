#!/usr/bin/env node
/**
 * fetch-love-stats.mjs — Refresh ground-truth/content/love.json from the
 * live k4-cage API.
 *
 * Source: GET https://k4-cage.trimtab-signal.workers.dev/api/mesh
 *   → { totalLove, mesh: { vertices: { <id>: { love } } }, ... }
 *
 * love.json is the fallback the LOVE display reads when the k4-cage API
 * is unreachable. It previously carried hand-entered values with a
 * `vertices: { top, left, right, bottom }` shape that no producer or
 * consumer ever matched. This script writes the API's real shape:
 * totalLove + one entry per mesh vertex id.
 *
 * Usage:
 *   node scripts/fetch-love-stats.mjs          # skip if within threshold
 *   node scripts/fetch-love-stats.mjs --force  # fetch regardless
 *
 * Fail-closed: a failed or malformed fetch exits 1 and does NOT overwrite
 * the file. lastVerified is only bumped when the values were actually
 * read from the source.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '..', 'ground-truth', 'content');
const LOVE_PATH = resolve(CONTENT_DIR, 'love.json');
const FORCE = process.argv.includes('--force');
const SOURCE = 'https://k4-cage.trimtab-signal.workers.dev/api/mesh';

async function main() {
  console.log('P31 LOVE content freshener\n');

  const current = JSON.parse(readFileSync(LOVE_PATH, 'utf-8'));
  const thresholdDays = current.stalenessThreshold ?? 30;
  const hoursAgo = (Date.now() - new Date(current.lastVerified).getTime()) / 36e5;

  if (!FORCE && hoursAgo < thresholdDays * 24) {
    console.log(`love.json verified ${hoursAgo.toFixed(1)}h ago (threshold: ${thresholdDays * 24}h). Skipping.`);
    console.log('Use --force to override.');
    return;
  }

  console.log(`[k4-cage] GET ${SOURCE}`);
  const res = await fetch(SOURCE, {
    headers: { 'User-Agent': 'P31-ContentFreshener/1.0 (mailto:hello@p31ca.org)' },
  });
  if (!res.ok) throw new Error(`${SOURCE} returned ${res.status}`);

  const mesh = await res.json();
  if (typeof mesh?.totalLove !== 'number' || !Number.isFinite(mesh.totalLove)) {
    throw new Error('malformed mesh payload: totalLove is not a finite number');
  }
  const rawVertices = mesh?.mesh?.vertices;
  if (!rawVertices || typeof rawVertices !== 'object' || Array.isArray(rawVertices)) {
    throw new Error('malformed mesh payload: mesh.vertices is not an object');
  }

  const vertices = {};
  for (const [id, v] of Object.entries(rawVertices)) {
    if (typeof v?.love !== 'number' || !Number.isFinite(v.love)) {
      throw new Error(`malformed mesh payload: vertex "${id}" has no numeric love`);
    }
    vertices[id] = v.love;
  }
  if (Object.keys(vertices).length === 0) {
    throw new Error('malformed mesh payload: no vertices');
  }

  const next = {
    schema: current.schema,
    version: current.version,
    lastVerified: new Date().toISOString(),
    stalenessThreshold: thresholdDays,
    source: SOURCE,
    totalLove: mesh.totalLove,
    vertices,
    note:
      'Fallback for the LOVE display when the k4-cage API is unreachable. ' +
      'Auto-fetched by scripts/fetch-love-stats.mjs from GET /api/mesh. ' +
      'Superseded hand-entered top/left/right/bottom values, which had no producer or consumer.',
  };

  writeFileSync(LOVE_PATH, JSON.stringify(next, null, 2) + '\n');
  console.log(`  totalLove: ${current.totalLove} → ${next.totalLove}`);
  console.log(`  vertices:  ${JSON.stringify(vertices)}`);
  console.log(`  wrote ${LOVE_PATH}`);
}

main().catch((e) => {
  console.error(`\n❌ fetch-love-stats failed: ${e.message}`);
  console.error('   love.json left unchanged; lastVerified NOT bumped.');
  process.exit(1);
});
