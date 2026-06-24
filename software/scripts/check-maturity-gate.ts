#!/usr/bin/env tsx

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

interface Scores {
  CODE: number;
  TEST: number;
  DOCS: number;
  OPS: number;
  SEC: number;
}

interface Result {
  artifact: string;
  declaredStage: string;
  scores: Scores;
  average: number;
  passed: boolean;
  details: {
    CODE: string[];
    TEST: string[];
    DOCS: string[];
    OPS: string[];
    SEC: string[];
  };
}

const STAGE_THRESHOLDS: Record<string, { minDim: number; minAvg: number }> = {
  FRUIT: { minDim: 4.0, minAvg: 4.5 },
  BLOOM: { minDim: 3.0, minAvg: 3.5 },
  SAPLING: { minDim: 2.0, minAvg: 2.5 },
  SPROUT: { minDim: 1.0, minAvg: 0.0 },
  SEED: { minDim: 0.0, minAvg: 0.0 },
};

function readStage(dir: string): string {
  const stageFile = join(dir, '.pmm-stage');
  if (existsSync(stageFile)) {
    return readFileSync(stageFile, 'utf-8').trim().toUpperCase();
  }
  const pkgJson = join(dir, 'package.json');
  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      if (pkg.pmmStage) return pkg.pmmStage.toUpperCase();
    } catch { /* ignore */ }
  }
  return 'SEED';
}

function checkCODE(dir: string): { score: number; logs: string[] } {
  const logs: string[] = [];
  let score = 0;

  const pkgJson = join(dir, 'package.json');
  const versionTs = join(dir, 'src', 'version.ts');

  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      if (pkg.version) {
        score += 2;
        logs.push('version in package.json');
      } else {
        logs.push('MISSING: version in package.json');
      }
    } catch {
      logs.push('MISSING: invalid package.json');
    }
  } else {
    logs.push('MISSING: package.json');
  }

  if (existsSync(versionTs)) {
    score += 1;
    logs.push('src/version.ts exists');
  }

  const hasHealth = scanForHealth(dir);
  if (hasHealth) {
    score += 1;
    logs.push('/health endpoint found');
  } else {
    logs.push('MISSING: /health endpoint');
  }

  const noHardcodedSecrets = checkHardcodedSecrets(dir);
  if (noHardcodedSecrets) {
    score += 1;
    logs.push('no hardcoded secrets detected');
  } else {
    logs.push('WARN: potential hardcoded secrets');
  }

  return { score, logs };
}

function scanForHealth(dir: string): boolean {
  const targets = ['src', 'worker.js', 'index.js', 'index.ts'];
  for (const t of targets) {
    const p = join(dir, t);
    if (existsSync(p)) {
      try {
        if (readFileSync(p, 'utf-8').includes('/health')) return true;
      } catch { /* skip binary */ }
    }
  }
  return false;
}

function checkHardcodedSecrets(dir: string): boolean {
  const patterns = [
    /(['"])sk_live_/i,
    /(['"])sk_test_/i,
    /(['"])pk_live_/i,
    /AKIA[A-Z0-9]{16}/,
    /ghp_[a-zA-Z0-9]{36}/,
    /gho_[a-zA-Z0-9]{36}/,
    /xox[bpras]-/,
  ];
  const skipDirs = ['node_modules', 'dist', '.git'];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && skipDirs.includes(entry.name)) continue;
      if (entry.isFile() && !entry.name.endsWith('.ts') && !entry.name.endsWith('.js') && !entry.name.endsWith('.mjs') && !entry.name.endsWith('.json')) continue;
      if (entry.isFile()) {
        const content = readFileSync(join(dir, entry.name), 'utf-8');
        for (const pat of patterns) {
          if (pat.test(content)) return false;
        }
      }
    }
  } catch { /* ignore */ }
  return true;
}

function checkTEST(dir: string): { score: number; logs: string[] } {
  const logs: string[] = [];
  let score = 0;

  const vitestConfig = join(dir, 'vitest.config.ts');
  const vitestConfigJs = join(dir, 'vitest.config.js');
  const jestConfig = join(dir, 'jest.config.js');
  const testDir = join(dir, 'test');
  const testsDir = join(dir, 'tests');
  const srcTestDir = join(dir, 'src', '__tests__');

  let hasConfig = false;
  if (existsSync(vitestConfig) || existsSync(vitestConfigJs) || existsSync(jestConfig)) {
    hasConfig = true;
    score += 2;
    logs.push('test config found');
  } else {
    logs.push('MISSING: test config (vitest/jest)');
  }

  if (existsSync(testDir) || existsSync(testsDir) || existsSync(srcTestDir)) {
    score += 1;
    logs.push('test directory found');
  }

  const pkgJson = join(dir, 'package.json');
  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      const scripts = pkg.scripts || {};
      if (scripts.test) {
        score += 1;
        logs.push('test script defined');
      } else {
        logs.push('MISSING: test script');
      }
    } catch {
      logs.push('MISSING: invalid package.json');
    }
  }

  const coverageThreshold = checkCoverageThreshold(dir);
  if (coverageThreshold) {
    score += 1;
    logs.push('coverage threshold > 0');
  } else {
    logs.push('MISSING: coverage threshold');
  }

  return { score, logs };
}

function checkCoverageThreshold(dir: string): boolean {
  const configs = ['vitest.config.ts', 'vitest.config.js', 'jest.config.js'];
  for (const cfg of configs) {
    const p = join(dir, cfg);
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf-8');
        const match = content.match(/thresholds?\s*:\s*\{[^}]*(\d+)/);
        if (match && parseInt(match[1]) > 0) return true;
      } catch { /* ignore */ }
    }
  }
  return false;
}

function checkDOCS(dir: string): { score: number; logs: string[] } {
  const logs: string[] = [];
  let score = 0;
  const required = ['README.md', 'DEPLOY.md', 'RUNBOOK.md'];

  for (const doc of required) {
    if (existsSync(join(dir, doc))) {
      score += 2;
      logs.push(`${doc} exists`);
    } else {
      logs.push(`MISSING: ${doc}`);
    }
  }

  if (score >= 4) score = Math.min(score, 5);
  return { score, logs };
}

function checkOPS(dir: string): { score: number; logs: string[] } {
  const logs: string[] = [];
  let score = 0;

  const workflowsDir = join(dir, '.github', 'workflows');
  if (existsSync(workflowsDir)) {
    score += 2;
    logs.push('has CI workflows');
  } else {
    logs.push('MISSING: .github/workflows');
  }

  const wranglerToml = join(dir, 'wrangler.toml');
  const dockerCompose = join(dir, 'docker-compose.yml');
  const dockerComposeDev = join(dir, 'docker-compose.dev.yml');
  const deployScripts = ['deploy.sh', 'deploy.ps1', 'Dockerfile'];

  let hasDeployConfig = false;
  if (existsSync(wranglerToml)) {
    hasDeployConfig = true;
    logs.push('wrangler.toml (Cloudflare deploy)');
  }
  if (existsSync(dockerCompose) || existsSync(dockerComposeDev)) {
    hasDeployConfig = true;
    logs.push('docker-compose (deploy config)');
  }
  for (const s of deployScripts) {
    if (existsSync(join(dir, s))) {
      hasDeployConfig = true;
      logs.push(`${s} exists`);
    }
  }
  if (hasDeployConfig) {
    score += 1;
  } else {
    logs.push('MISSING: deploy config');
  }

  if (scanForHealth(dir)) {
    score += 1;
    logs.push('/health endpoint available');
  }

  const hasMonitoring = scanForMonitoring(dir);
  if (hasMonitoring) {
    score += 1;
    logs.push('monitoring/health check present');
  } else {
    logs.push('MISSING: health/monitoring check');
  }

  return { score, logs };
}

function scanForMonitoring(dir: string): boolean {
  const patterns = ['health', 'monitor', 'ping', 'uptime', 'readiness', 'liveness'];
  const targets = ['worker.js', 'index.js', 'index.ts', join('src', 'index.ts'), join('src', 'worker.ts')];
  for (const t of targets) {
    const p = join(dir, t);
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf-8');
        for (const pat of patterns) {
          if (content.includes(pat)) return true;
        }
      } catch { /* ignore */ }
    }
  }
  return false;
}

function checkSEC(dir: string): { score: number; logs: string[] } {
  const logs: string[] = [];
  let score = 0;

  if (existsSync(join(dir, 'pnpm-lock.yaml')) || existsSync(join(dir, 'package-lock.json')) || existsSync(join(dir, 'yarn.lock'))) {
    score += 1;
    logs.push('lock file present');
  }

  const pkgJson = join(dir, 'package.json');
  if (existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgJson, 'utf-8'));
      const scripts = pkg.scripts || {};
      if (scripts.audit || scripts['security:lint'] || scripts.security) {
        score += 2;
        logs.push('dependency audit script found');
      }
    } catch { /* ignore */ }
  }

  const auditConfigs = ['.nsprc', '.auditrc', '.snyk', '.trivyignore'];
  for (const cfg of auditConfigs) {
    if (existsSync(join(dir, cfg))) {
      score += 1;
      logs.push(`${cfg} exists`);
    }
  }

  if (existsSync(join(dir, 'eslint.config.security.mjs')) || existsSync(join(dir, '.eslintrc.security.json'))) {
    score += 1;
    logs.push('security lint config found');
  }

  return { score, logs };
}

function main(): void {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(JSON.stringify({ error: 'Usage: check-maturity-gate.ts <artifact-dir> [artifact-name]' }));
    process.exit(1);
  }

  const dir = resolve(args[0]);
  const artifactName = args[1] || dir.split('/').pop() || 'unknown';

  if (!existsSync(dir)) {
    console.error(JSON.stringify({ error: `Directory not found: ${dir}` }));
    process.exit(1);
  }

  const declaredStage = readStage(dir);

  const codeResult = checkCODE(dir);
  const testResult = checkTEST(dir);
  const docsResult = checkDOCS(dir);
  const opsResult = checkOPS(dir);
  const secResult = checkSEC(dir);

  const scores: Scores = {
    CODE: codeResult.score,
    TEST: testResult.score,
    DOCS: docsResult.score,
    OPS: opsResult.score,
    SEC: secResult.score,
  };

  const average = (scores.CODE + scores.TEST + scores.DOCS + scores.OPS + scores.SEC) / 5;

  const threshold = STAGE_THRESHOLDS[declaredStage] || STAGE_THRESHOLDS.SEED;
  const allAboveMinDim = Object.values(scores).every(s => s >= threshold.minDim);
  const passesAverage = average >= threshold.minAvg;
  const passed = declaredStage === 'SEED' || (allAboveMinDim && passesAverage);

  const result: Result = {
    artifact: artifactName,
    declaredStage,
    scores,
    average: Math.round(average * 100) / 100,
    passed,
    details: {
      CODE: codeResult.logs,
      TEST: testResult.logs,
      DOCS: docsResult.logs,
      OPS: opsResult.logs,
      SEC: secResult.logs,
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
