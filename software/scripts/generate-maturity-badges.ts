#!/usr/bin/env tsx

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from 'fs';
import { join, resolve, relative } from 'path';

const BASE = resolve(import.meta.dirname, '..');
const OUTPUT = resolve(BASE, '..', '.p31', 'badges');

interface Scores {
  code: number;
  test: number;
  docs: number;
  ops: number;
  sec: number;
}

export interface MaturityReport {
  artifact: string;
  path: string;
  stage: 'SEED' | 'SPROUT' | 'SAPLING' | 'BLOOM' | 'FRUIT';
  scores: Scores;
  average: number;
  badge: string;
}

const STAGE_COLORS: Record<string, string> = {
  SEED: '#95a5a6',
  SPROUT: '#2ecc71',
  SAPLING: '#3498db',
  BLOOM: '#9b59b6',
  FRUIT: '#e05d44',
};

const STAGE_ICONS: Record<string, string> = {
  SEED: '\u{1F331}',
  SPROUT: '\u{1F33F}',
  SAPLING: '\u{1F333}',
  BLOOM: '\u{1F338}',
  FRUIT: '\u{1F34E}',
};

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
  '../phos': { name: 'phos', displayName: 'phos' },
};

function grepDir(dir: string, pattern: RegExp): boolean {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.turbo' || entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (grepDir(full, pattern)) return true;
      } else if (entry.isFile() && /\.(ts|tsx|js|jsx|mjs|cjs)$/i.test(entry.name)) {
        try {
          const content = readFileSync(full, 'utf-8');
          if (pattern.test(content)) return true;
        } catch {}
      }
    }
  } catch {}
  return false;
}

function hasFile(dir: string, ...segments: string[]): boolean {
  return existsSync(join(dir, ...segments));
}

function hasFilesMatching(dir: string, glob: RegExp): boolean {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.turbo') continue;
      if (glob.test(entry.name)) return true;
      if (entry.isDirectory()) {
        if (hasFilesMatching(join(dir, entry.name), glob)) return true;
      }
    }
  } catch {}
  return false;
}

function hasAnyFile(dir: string, ...names: string[]): boolean {
  return names.some(n => existsSync(join(dir, n)));
}

function scoreCode(dir: string): number {
  let s = 1;
  const src = join(dir, 'src');
  const search = existsSync(src) ? src : dir;

  if (hasFilesMatching(dir, /version\.(ts|js)/) || grepDir(search, /\bVERSION\b/)) s++;
  if (grepDir(search, /\/health/)) s++;
  if (grepDir(search, /try\s*\{|ErrorHandler|catch\s*\(/)) s++;
  if (grepDir(search, /pino|logger\.(info|warn|error|debug)/)) s++;
  if (grepDir(search, /process\.env/)) s++;

  return Math.min(s, 5);
}

function scoreTest(dir: string): number {
  let s = 1;

  if (hasAnyFile(dir, 'vitest.config.ts', 'vitest.config.js', 'jest.config.js', 'jest.config.ts', 'playwright.config.ts', 'playwright.config.js')) s++;
  if (hasFilesMatching(dir, /\.(test|spec)\.(ts|tsx|js|jsx)$/)) s++;
  if (hasFile(dir, 'vitest.config.ts') || hasFile(dir, 'vitest.config.js')) {
    try {
      const content = readFileSync(join(dir, 'vitest.config.ts'), 'utf-8');
      if (/thresholds?\s*:\s*\{/.test(content)) s++;
    } catch {}
  } else if (s > 1) {
    s++;
  }

  if (hasFilesMatching(dir, /\.integration\.test\.(ts|js)/) || hasFile(dir, 'tests', 'integration') || hasFile(dir, 'test', 'integration') || hasFile(dir, 'src', '__tests__', 'integration')) s++;
  if (hasAnyFile(dir, 'playwright.config.ts', 'playwright.config.js', 'cypress.config.ts', 'cypress.config.js') || hasFile(dir, 'e2e') || hasFilesMatching(dir, /\.e2e\.test\.(ts|js)/)) s++;

  return Math.min(s, 5);
}

function scoreDocs(dir: string): number {
  let s = 1;

  if (hasFile(dir, 'README.md') || hasFile(dir, 'README.html')) s++;
  if (hasFile(dir, 'DEPLOY.md')) s++;
  if (hasFile(dir, 'RUNBOOK.md')) s++;
  if (hasFile(dir, 'docs') || hasFilesMatching(dir, /ARCHITECTURE\.md|ADR|adr/) || hasFile(dir, 'ARCHITECTURE.md')) s++;

  const src = join(dir, 'src');
  if (existsSync(src) && grepDir(src, /\/\*\*|@param|@returns|@typedef/)) s++;
  else if (grepDir(dir, /\/\*\*|@param|@returns/)) s++;

  return Math.min(s, 5);
}

function scoreOps(dir: string): number {
  let s = 1;

  const rootGh = resolve(BASE, '..', '.github', 'workflows');
  if (existsSync(rootGh)) s++;
  if (hasFile(dir, '.github', 'workflows')) s++;

  if (grepDir(dir, /\/health/)) s++;
  if (hasAnyFile(dir, 'deploy.sh', 'deploy.ps1', 'Dockerfile', 'docker-compose.yml') || hasFile(dir, 'scripts', 'deploy.sh')) s++;

  if (grepDir(dir, /monitoring|alert/)) s++;
  if (grepDir(dir, /rollback/)) s++;

  return Math.min(s, 5);
}

function scoreSec(dir: string): number {
  let s = 1;

  if (grepDir(dir, /process\.env/)) s++;
  if (hasAnyFile(dir, 'pnpm-lock.yaml', 'package-lock.json', 'yarn.lock')) s++;
  if (grepDir(dir, /validate|validation|zod|yup|joi/)) s++;
  if (grepDir(dir, /rate.?limit|auth|middleware/)) s++;
  if (grepDir(dir, /pqc|post.?quantum|crypto/)) s++;

  return Math.min(s, 5);
}

function determineStage(scores: Scores): MaturityReport['stage'] {
  const minDim = Math.min(scores.code, scores.test, scores.docs, scores.ops, scores.sec);
  if (minDim >= 4) return 'BLOOM';
  if (minDim >= 3) return 'SAPLING';
  if (minDim >= 2) return 'SPROUT';
  return 'SEED';
}

function estimateTextWidth(text: string): number {
  let w = 0;
  for (const ch of text) {
    if (ch >= '\u4e00' && ch <= '\u9fff') w += 14;
    else if (ch >= '\u{1F300}' && ch <= '\u{1F9FF}') w += 14;
    else w += 7;
  }
  return w + 16;
}

function generateBadge(label: string, stage: string, scores: Scores): string {
  const stageLabel = `${STAGE_ICONS[stage]} ${stage}`;
  const color = STAGE_COLORS[stage];
  const leftW = estimateTextWidth(label);
  const rightW = estimateTextWidth(stageLabel);
  const totalW = leftW + rightW;
  const leftX = leftW / 2;
  const rightX = leftW + rightW / 2;

  const scoreLine = `CODE:${scores.code}  TEST:${scores.test}  DOCS:${scores.docs}  OPS:${scores.ops}  SEC:${scores.sec}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="38" viewBox="0 0 ${totalW} 38">
  <defs>
    <linearGradient id="bg" x2="0" y2="100%">
      <stop offset="0" stop-color="#fff" stop-opacity=".12"/>
      <stop offset="1" stop-opacity=".08"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalW}" height="20" rx="3" fill="#fff"/>
    </clipPath>
  </defs>
  <g clip-path="url(#r)">
    <rect width="${leftW}" height="20" fill="#555"/>
    <rect x="${leftW}" width="${rightW}" height="20" fill="${color}"/>
    <rect width="${totalW}" height="20" fill="url(#bg)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${leftX}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${leftX}" y="14">${label}</text>
    <text x="${rightX}" y="15" fill="#010101" fill-opacity=".3">${stageLabel}</text>
    <text x="${rightX}" y="14">${stageLabel}</text>
  </g>
  <g fill="#666" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="9">
    <text x="${totalW / 2}" y="33">${scoreLine}</text>
  </g>
</svg>`;
}

function scanArtifact(relPath: string, def: ArtifactDef): MaturityReport {
  const dir = join(BASE, relPath);

  if (!existsSync(dir)) {
    return {
      artifact: def.name,
      path: relPath,
      stage: 'SEED',
      scores: { code: 1, test: 1, docs: 1, ops: 1, sec: 1 },
      average: 1,
      badge: generateBadge(def.displayName, 'SEED', { code: 1, test: 1, docs: 1, ops: 1, sec: 1 }),
    };
  }

  const scores: Scores = {
    code: scoreCode(dir),
    test: scoreTest(dir),
    docs: scoreDocs(dir),
    ops: scoreOps(dir),
    sec: scoreSec(dir),
  };

  const stage = determineStage(scores);
  const average = (scores.code + scores.test + scores.docs + scores.ops + scores.sec) / 5;

  return {
    artifact: def.name,
    path: relPath,
    stage,
    scores,
    average: Math.round(average * 100) / 100,
    badge: generateBadge(def.displayName, stage, scores),
  };
}

function main(): void {
  mkdirSync(OUTPUT, { recursive: true });

  const reports: MaturityReport[] = [];

  for (const [relPath, def] of Object.entries(ARTIFACTS)) {
    const report = scanArtifact(relPath, def);
    reports.push(report);

    const safeName = def.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const badgePath = join(OUTPUT, `${safeName}.svg`);
    writeFileSync(badgePath, report.badge, 'utf-8');
    console.log(`  ${STAGE_ICONS[report.stage]} [${report.stage}] ${def.displayName.padEnd(30)} CODE:${report.scores.code} TEST:${report.scores.test} DOCS:${report.scores.docs} OPS:${report.scores.ops} SEC:${report.scores.sec}  avg=${report.average}`);
  }

  const index = reports.map(r => ({
    artifact: r.artifact,
    path: r.path,
    stage: r.stage,
    scores: r.scores,
    average: r.average,
    badgeFile: `${r.artifact.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`,
  }));

  writeFileSync(join(OUTPUT, 'index.json'), JSON.stringify(index, null, 2), 'utf-8');
  console.log(`\nWrote ${reports.length} badges to ${OUTPUT}`);
}

main();
