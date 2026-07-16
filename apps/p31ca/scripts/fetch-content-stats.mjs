#!/usr/bin/env node
/**
 * fetch-content-stats.mjs — Fetches live stats from external APIs and
 * updates ground-truth/content/stats.json.
 *
 * Sources:
 *   Zenodo API — view/download counts for DOI 10.5281/zenodo.18627420
 *   GitHub CI artifact — latest test count (if available)
 *
 * Usage:
 *   node scripts/fetch-content-stats.mjs          # fetch (skips if recently fetched)
 *   node scripts/fetch-content-stats.mjs --force  # force fetch regardless of staleness
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, '..', 'ground-truth', 'content');
const STATS_PATH = resolve(CONTENT_DIR, 'stats.json');
const FORCE = process.argv.includes('--force');

function loadStats() {
  return JSON.parse(readFileSync(STATS_PATH, 'utf-8'));
}

function saveStats(stats) {
  writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2) + '\n');
  console.log(`  wrote ${STATS_PATH}`);
}

function hoursAgo(iso) {
  return (Date.now() - new Date(iso).getTime()) / 36e5;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'P31-ContentFreshener/1.0 (mailto:hello@p31ca.org)' },
  });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

async function fetchZenodoStats(stats) {
  console.log('[zenodo] fetching stats for DOI 10.5281/zenodo.18627420...');
  try {
    const data = await fetchJson('https://zenodo.org/api/records/18627420');
    const views = data.stats?.views || stats.zenodoViews;
    const downloads = data.stats?.downloads || stats.zenodoDownloads;
    const changed = views !== stats.zenodoViews || downloads !== stats.zenodoDownloads;
    if (changed) {
      console.log(`  views: ${stats.zenodoViews} → ${views}`);
      console.log(`  downloads: ${stats.zenodoDownloads} → ${downloads}`);
    } else {
      console.log('  no change');
    }
    stats.zenodoViews = views;
    stats.zenodoDownloads = downloads;
  } catch (e) {
    console.error(`  Zenodo fetch failed: ${e.message}`);
  }
}

async function fetchCiTestCount(stats) {
  console.log('[ci] reading latest test count...');
  const ciStatsPath = resolve(__dirname, '..', 'out', 'ci-stats.json');
  try {
    const ciData = JSON.parse(readFileSync(ciStatsPath, 'utf-8'));
    if (ciData.testsPassing && ciData.testsPassing !== stats.testsPassing) {
      console.log(`  tests: ${stats.testsPassing} → ${ciData.testsPassing}`);
      stats.testsPassing = ciData.testsPassing;
    } else {
      console.log('  no change (or ci-stats.json not available)');
    }
  } catch {
    console.log('  no ci-stats.json found — keeping existing value');
  }
}

async function computeFersDays(stats, constantsPath) {
  console.log('[fers] computing days remaining...');
  try {
    const constants = JSON.parse(readFileSync(constantsPath, 'utf-8'));
    const deadline = new Date(constants.fersDeadline + 'T12:00:00+02:00'); // CEST
    const now = new Date();
    const days = Math.ceil((deadline.getTime() - now.getTime()) / 864e5);
    const changed = days !== stats.fersDaysRemaining;
    if (changed) {
      console.log(`  days: ${stats.fersDaysRemaining} → ${days}`);
      stats.fersDaysRemaining = days;
    } else {
      console.log(`  days: ${days} (no change)`);
    }
  } catch (e) {
    console.error(`  FERS compute failed: ${e.message}`);
  }
}

async function main() {
  console.log('P31 Content Freshener\n');

  const stats = loadStats();

  const hours = hoursAgo(stats.lastVerified);
  if (!FORCE && hours < stats.stalenessThreshold * 24) {
    console.log(`Stats fetched ${hours.toFixed(1)}h ago (threshold: ${stats.stalenessThreshold * 24}h). Skipping.`);
    console.log('Use --force to override.');
    return;
  }

  const constantsPath = resolve(CONTENT_DIR, 'constants.json');

  await Promise.all([
    fetchZenodoStats(stats),
    fetchCiTestCount(stats),
    computeFersDays(stats, constantsPath),
  ]);

  stats.lastVerified = new Date().toISOString();

  saveStats(stats);

  console.log('\nDone.');
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
