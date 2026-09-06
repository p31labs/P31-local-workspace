#!/usr/bin/env node
/**
 * P31 Andromeda — Health Check System
 * -----------------------------------
 * Verifies all services are running and configured.
 * Run: node scripts/health-check.js
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m';

let passed = 0;
let failed = 0;
let warnings = 0;

function check(name, status, detail = '') {
  if (status === 'pass') {
    console.log(`  ${GREEN}✅ ${name}${NC}${detail ? ' — ' + detail : ''}`);
    passed++;
  } else if (status === 'warn') {
    console.log(`  ${YELLOW}⚠️  ${name}${NC}${detail ? ' — ' + detail : ''}`);
    warnings++;
  } else {
    console.log(`  ${RED}❌ ${name}${NC}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

function checkUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function checkCommand(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkEnvVar(varName) {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return 'missing';
  const content = fs.readFileSync(envPath, 'utf8');
  const match = content.match(new RegExp(`^${varName}=(.*)$`, 'm'));
  if (!match) return 'missing';
  if (!match[1].trim()) return 'empty';
  return 'set';
}

async function main() {
  console.log('');
  console.log(`${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}`);
  console.log(`${CYAN}║  🔺 P31 ANDROMEDA — HEALTH CHECK                           ║${NC}`);
  console.log(`${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}`);
  console.log('');

  // ─── Prerequisites ───
  console.log('Prerequisites:');
  const prereqs = [
    { name: 'Node.js', cmd: 'node' },
    { name: 'Python', cmd: 'python3' },
    { name: 'Docker', cmd: 'docker' },
    { name: 'Git', cmd: 'git' },
    { name: 'npm', cmd: 'npm' },
  ];
  for (const p of prereqs) {
    if (checkCommand(p.cmd)) {
      try {
        const version = execSync(`${p.cmd} --version 2>/dev/null`).toString().trim().split('\n')[0];
        check(p.name, 'pass', version);
      } catch {
        check(p.name, 'pass');
      }
    } else {
      check(p.name, 'fail', 'not installed');
    }
  }

  // ─── Environment ───
  console.log('');
  console.log('Environment (.env):');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    check('.env file', 'pass');
  } else {
    check('.env file', 'fail', 'missing — run: cp .env.example .env');
  }

  const requiredVars = ['NEO4J_PASSWORD', 'ANTHROPIC_API_KEY'];
  const recommendedVars = [
    'DISCORD_WEBHOOK_URL', 'TWITTER_API_KEY', 'REDDIT_CLIENT_ID',
    'DEEPSEEK_API_KEY', 'GOOGLE_API_KEY',
  ];

  for (const v of requiredVars) {
    const status = checkEnvVar(v);
    if (status === 'set') check(v, 'pass');
    else if (status === 'empty') check(v, 'fail', 'empty — required');
    else check(v, 'fail', 'missing — required');
  }

  for (const v of recommendedVars) {
    const status = checkEnvVar(v);
    if (status === 'set') check(v, 'pass');
    else if (status === 'empty') check(v, 'warn', 'empty — optional');
    else check(v, 'warn', 'missing — optional');
  }

  // ─── Services ───
  console.log('');
  console.log('Services:');

  const services = [
    { name: 'Backend (FastAPI)', url: 'http://localhost:8000/health' },
    { name: 'Frontend (Vite)', url: 'http://localhost:5173' },
    { name: 'Neo4j Browser', url: 'http://localhost:7474' },
    { name: 'Cloudflare Workers (local)', url: 'http://localhost:8787' },
  ];

  for (const s of services) {
    const ok = await checkUrl(s.url, 3000);
    check(s.name, ok ? 'pass' : 'fail', s.url);
  }

  // ─── Docker ───
  console.log('');
  console.log('Docker:');
  try {
    const containers = execSync('docker ps --format "{{.Names}}" 2>/dev/null').toString().trim();
    if (containers.includes('neo4j')) {
      check('Neo4j container', 'pass', 'running');
    } else {
      check('Neo4j container', 'warn', 'not running — run: docker-compose up -d neo4j');
    }
  } catch {
    check('Docker', 'warn', 'could not check containers');
  }

  // ─── Cloudflare Workers ───
  console.log('');
  console.log('Cloudflare Workers:');
  const workerDirs = [
    'workers',
    'cloudflare-worker/social-drop-automation',
    'cloudflare-worker',
  ];
  for (const dir of workerDirs) {
    const dirPath = path.join(__dirname, '..', dir);
    const wranglerPath = path.join(dirPath, 'wrangler.toml');
    if (fs.existsSync(wranglerPath)) {
      check(`${dir}/wrangler.toml`, 'pass');
    } else {
      check(`${dir}/wrangler.toml`, 'warn', 'not found');
    }
  }

  // ─── Summary ───
  console.log('');
  console.log(`${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}`);
  console.log(`${CYAN}║  RESULTS                                                    ║${NC}`);
  console.log(`${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}`);
  console.log('');
  console.log(`  ${GREEN}Passed:   ${passed}${NC}`);
  console.log(`  ${YELLOW}Warnings: ${warnings}${NC}`);
  console.log(`  ${RED}Failed:   ${failed}${NC}`);
  console.log('');

  if (failed === 0) {
    console.log(`  ${GREEN}✅ All critical checks passed.${NC}`);
  } else {
    console.log(`  ${RED}❌ ${failed} critical check(s) failed. Fix before deploying.${NC}`);
  }
  console.log('');

  process.exit(failed > 0 ? 1 : 0);
}

main();
