import { readFileSync, existsSync } from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUS_CLI = join(__dirname, 'bus.mjs');
const SPOON_STATE = '/home/p31/P31-local-workspace/spoon-state.json';
const EVENTS_LOG = '/tmp/phos-forge/events.jsonl';

const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  magenta: '\x1b[35m',
};

function c(name) {
  return process.stdout.isTTY ? COLORS[name] || '' : '';
}

function busEmit(type, payload) {
  try {
    spawn('node', [BUS_CLI, 'emit', type, JSON.stringify(payload)], {
      stdio: 'ignore',
      detached: true,
    }).unref();
  } catch {}
}

function getSpoonLevel() {
  try {
    const data = JSON.parse(readFileSync(SPOON_STATE, 'utf-8'));
    return typeof data.level === 'number' ? data.level : 4;
  } catch {
    return 4;
  }
}

function getRecentEvents(limit = 20) {
  if (!existsSync(EVENTS_LOG)) return [];
  const lines = readFileSync(EVENTS_LOG, 'utf-8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).map((line) => {
    try { return JSON.parse(line); } catch { return null; }
  }).filter(Boolean).reverse();
}

function getServiceHealth() {
  const services = ['phos', 'p31-safe-router', 'affective-chemistry', 'spoon-monitor', 'bonding', 'p31-sync'];
  const results = [];
  for (const svc of services) {
    const url =
      svc === 'phos' ? 'https://phos.p31ca.org/health' :
      svc === 'bonding' ? 'https://bonding.p31ca.org/health' :
      `https://${svc}.trimtab-signal.workers.dev/health`;
    const proc = spawn('curl', ['-sf', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', '5', url], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let code = '???';
    proc.stdout.on('data', (d) => { code = d.toString().trim(); });
    proc.on('close', () => {
      results.push({ service: svc, code, status: code === '200' ? 'healthy' : code === '000' ? 'unreachable' : 'degraded' });
    });
  }
  return new Promise((resolve) => {
    proc.on('close', () => resolve(results));
    setTimeout(() => resolve(results), 6000);
  });
}

function eventTypeIcon(type) {
  if (type.includes('deploy')) return '🚀';
  if (type.includes('health') || type.includes('inspect')) return '🏥';
  if (type.includes('fail') || type.includes('error')) return '❌';
  if (type.includes('fuel')) return '⛽';
  if (type.includes('grade')) return '📊';
  if (type.includes('yardmaster')) return '⚙️';
  return '📡';
}

function spoonLabel(level) {
  if (level >= 5) return 'FLOURISHING';
  if (level === 4) return 'HEALTHY';
  if (level === 3) return 'STABLE';
  if (level === 2) return 'UNSTABLE';
  if (level === 1) return 'CRITICAL';
  return 'EMPTY';
}

export async function dashboard() {
  const spoonLevel = getSpoonLevel();
  const spoonLabelText = spoonLabel(spoonLevel);
  const spoonColor = spoonLevel <= 2 ? c('red') : spoonLevel <= 3 ? c('yellow') : c('green');

  const events = getRecentEvents(30);
  const health = await getServiceHealth();

  console.log('');
  console.log(`${c('bold')}${c('cyan')}═══════════════════════════════════════════════════${c('reset')}`);
  console.log(`${c('bold')}${c('cyan')}  PHOS FORGE — CONVERGENCE DASHBOARD${c('reset')}`);
  console.log(`${c('cyan')}═══════════════════════════════════════════════════${c('reset')}`);
  console.log('');

  // Spoon state
  console.log(`${c('bold')}Cognitive State (Spoons):${c('reset')}`);
  const bar = '█'.repeat(spoonLevel) + '░'.repeat(5 - spoonLevel);
  console.log(`  ${spoonColor}${bar}${c('reset')} Level ${spoonLevel}/5 — ${spoonColor}${spoonLabelText}${c('reset')}`);
  console.log('');

  // Service health
  console.log(`${c('bold')}Service Health:${c('reset')}`);
  for (const svc of health) {
    const icon = svc.status === 'healthy' ? `${c('green')}✓${c('reset')}` :
                 svc.status === 'unreachable' ? `${c('red')}✗${c('reset')}` :
                 `${c('yellow')}⚠${c('reset')}`;
    console.log(`  ${icon} ${svc.service.padEnd(20)} ${c('dim')}${svc.code}${c('reset')}`);
  }
  console.log('');

  // Recent events
  console.log(`${c('bold')}Recent Events (${events.length}):${c('reset')}`);
  for (const ev of events.slice(0, 15)) {
    const icon = eventTypeIcon(ev.type);
    const time = ev.timestamp?.slice(11, 19) || '??:??:??';
    console.log(`  ${icon} ${c('dim')}${time}${c('reset')} ${c('cyan')}${ev.type}${c('reset')}`);
  }
  console.log('');

  // Stats summary
  const typeCounts = {};
  for (const ev of events) {
    typeCounts[ev.type] = (typeCounts[ev.type] || 0) + 1;
  }
  const top = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (top.length > 0) {
    console.log(`${c('bold')}Top Event Types:${c('reset')}`);
    for (const [type, count] of top) {
      console.log(`  ${c('magenta')}${type}${c('reset')} ${c('dim')}×${count}${c('reset')}`);
    }
    console.log('');
  }

  busEmit('dashboard.viewed', { spoonLevel, eventCount: events.length });
}
