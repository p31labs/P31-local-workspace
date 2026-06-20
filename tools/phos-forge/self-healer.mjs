import { readFileSync, existsSync, writeFileSync, appendFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const SPOON_PATH = '/home/p31/P31-local-workspace/spoon-state.json';
const COG_STATE_PATH = '/tmp/phos-cognitive-state.json';
const HEALER_LOG = '/tmp/phos-forge/healer-log.jsonl';

const DIAGNOSTIC_KB = [
  {
    id: 'sys_error_spike',
    label: 'Systemic error spike',
    severity: 0.7,
    patterns: [
      { metric: 'error_rate', op: 'gt', value: 0.3 },
      { metric: 'services_affected', op: 'gte', value: 2 },
    ],
    recommendation: 'Check infrastructure health and recent deploys. Consider rolling back last change.',
    actions: ['emit_alerts', 'suggest_rollback'],
  },
  {
    id: 'burnout_risk',
    label: 'Operator burnout risk',
    severity: 0.8,
    patterns: [
      { metric: 'spoon', op: 'lte', value: 2 },
      { metric: 'cmd_freq', op: 'gt', value: 3 },
    ],
    recommendation: 'Spoon level critically low with high command volume. Recommend immediate break.',
    actions: ['suggest_break', 'lock_production'],
  },
  {
    id: 'frustration_spiral',
    label: 'Deploy frustration spiral',
    severity: 0.6,
    patterns: [
      { metric: 'rapid_deploys', op: 'gte', value: 3 },
      { metric: 'deploy_failures', op: 'gte', value: 1 },
    ],
    recommendation: 'Repeated deploy attempts detected. Check wrangler auth, project config, and network.',
    actions: ['suggest_pause', 'check_auth'],
  },
  {
    id: 'system_silence',
    label: 'System silence anomaly',
    severity: 0.5,
    patterns: [
      { metric: 'silence_minutes', op: 'gt', value: 30 },
    ],
    recommendation: 'No events received for 30+ minutes. System may be idle or unresponsive.',
    actions: ['ping_services'],
  },
  {
    id: 'low_voltage',
    label: 'Low service voltage',
    severity: 0.6,
    patterns: [
      { metric: 'low_voltage_count', op: 'gte', value: 3 },
    ],
    recommendation: 'Multiple services reporting zero voltage. Check yardmaster health.',
    actions: ['ping_services', 'emit_alerts'],
  },
  {
    id: 'cognitive_overload',
    label: 'Cognitive overload detected',
    severity: 0.7,
    patterns: [
      { metric: 'cognitive_load', op: 'gt', value: 0.7 },
      { metric: 'spoon', op: 'lte', value: 3 },
    ],
    recommendation: 'Cognitive load is high and spoon state is suboptimal. Reduce task complexity.',
    actions: ['suggest_delegate', 'lock_production'],
  },
  {
    id: 'high_stress',
    label: 'High stress state',
    severity: 0.6,
    patterns: [
      { metric: 'stress', op: 'gt', value: 0.7 },
      { metric: 'spoon', op: 'lte', value: 3 },
    ],
    recommendation: 'Elevated stress with low spoons. Consider grounding exercise or context switch.',
    actions: ['suggest_break', 'suggest_grounding'],
  },
  {
    id: 'flow_state',
    label: 'Flow state detected',
    severity: -0.3,
    patterns: [
      { metric: 'flow', op: 'gt', value: 0.7 },
      { metric: 'spoon', op: 'gte', value: 3 },
    ],
    recommendation: 'Strong flow state. Protect this time — defer interruptions.',
    actions: ['protect_focus'],
  },
];

const ACTION_LIB = {
  emit_alerts: {
    label: 'Emit diagnostic alerts to bus',
    execute: (diag) => busEmit('healer.alert', { diagnosis: diag.id, severity: diag.severity, message: diag.recommendation }),
  },
  suggest_rollback: {
    label: 'Suggest rolling back recent changes',
    execute: (diag) => busEmit('healer.remediation', { action: 'suggest_rollback', diagnosis: diag.id, message: diag.recommendation }),
  },
  suggest_break: {
    label: 'Suggest operator take a break',
    execute: (diag) => busEmit('healer.remediation', { action: 'suggest_break', diagnosis: diag.id, message: diag.recommendation }),
  },
  lock_production: {
    label: 'Lock production deploys',
    execute: (diag) => busEmit('healer.remediation', { action: 'lock_production', diagnosis: diag.id, message: 'Production deploys locked by self-healer.' }),
  },
  suggest_pause: {
    label: 'Suggest pausing current activity',
    execute: (diag) => busEmit('healer.remediation', { action: 'suggest_pause', diagnosis: diag.id, message: diag.recommendation }),
  },
  check_auth: {
    label: 'Trigger authentication check',
    execute: (diag) => busEmit('healer.remediation', { action: 'check_auth', diagnosis: diag.id, message: diag.recommendation }),
  },
  ping_services: {
    label: 'Ping all services',
    execute: (diag) => busEmit('healer.remediation', { action: 'ping_services', diagnosis: diag.id, message: diag.recommendation }),
  },
  suggest_delegate: {
    label: 'Suggest delegating tasks',
    execute: (diag) => busEmit('healer.remediation', { action: 'suggest_delegate', diagnosis: diag.id, message: diag.recommendation }),
  },
  protect_focus: {
    label: 'Protect focus time',
    execute: (diag) => busEmit('healer.remediation', { action: 'protect_focus', diagnosis: diag.id, message: diag.recommendation }),
  },
  suggest_grounding: {
    label: 'Suggest grounding exercise',
    execute: (diag) => busEmit('healer.remediation', { action: 'suggest_grounding', diagnosis: diag.id, message: 'Try vagal toning: 6s inhale, 6s exhale for 2 minutes.' }),
  },
};

function getSpoonLevel() {
  try {
    const data = JSON.parse(readFileSync(SPOON_PATH, 'utf-8'));
    return typeof data.level === 'number' ? data.level : 4;
  } catch {
    return 4;
  }
}

function getCognitiveState() {
  try {
    if (existsSync(COG_STATE_PATH)) {
      return JSON.parse(readFileSync(COG_STATE_PATH, 'utf-8'));
    }
  } catch {}
  return { cognitive_load: 0.5, fatigue: 0.3, flow: 0.6, creativity: 0.5, stress: 0.2 };
}

function getRecentEvents(limit = 500) {
  if (!existsSync(EVENTS_PATH)) return [];
  const content = readFileSync(EVENTS_PATH, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).slice(-limit).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

function extractMetrics(events) {
  const now = Date.now();
  const window15 = events.filter(e => now - new Date(e.timestamp).getTime() < 15 * 60 * 1000);
  const window60 = events.filter(e => now - new Date(e.timestamp).getTime() < 60 * 60 * 1000);

  const totalEvents = events.length;
  const errorEvents = window60.filter(e => e.type?.includes('fail') || e.type?.includes('error'));
  const errorRate = window60.length > 0 ? errorEvents.length / window60.length : 0;

  const servicesWithLowVoltage = new Set();
  for (const e of window60) {
    if (e.type === 'yardmaster.inspect_voltage' && e.payload?.detail === '0.0') {
      servicesWithLowVoltage.add(e.payload?.service);
    }
  }

  const deployAttempts = window15.filter(e => e.type?.includes('deploy'));
  const deployFailures = deployAttempts.filter(e => e.type?.includes('fail') || e.type?.includes('error'));

  const lastEvent = events[events.length - 1];
  const silenceMinutes = lastEvent ? (now - new Date(lastEvent.timestamp).getTime()) / 60000 : 999;

  const cmdEvents = window15.filter(e => !e.type?.startsWith('yardmaster.inspect') && !e.type?.startsWith('healer.'));
  const cmdFreq = cmdEvents.length / 0.25;

  return {
    error_rate: errorRate,
    services_affected: servicesWithLowVoltage.size,
    spoon: getSpoonLevel(),
    cmd_freq: cmdFreq,
    rapid_deploys: deployAttempts.length,
    deploy_failures: deployFailures.length,
    silence_minutes: silenceMinutes,
    low_voltage_count: servicesWithLowVoltage.size,
    cognitive_load: getCognitiveState().cognitive_load || 0.5,
    stress: getCognitiveState().stress || 0.2,
    flow: getCognitiveState().flow || 0.5,
  };
}

function matchDiagnostics(metrics) {
  const active = [];
  for (const diag of DIAGNOSTIC_KB) {
    let matched = true;
    for (const pattern of diag.patterns) {
      const val = metrics[pattern.metric];
      if (val === undefined) { matched = false; break; }
      switch (pattern.op) {
        case 'gt': if (!(val > pattern.value)) matched = false; break;
        case 'gte': if (!(val >= pattern.value)) matched = false; break;
        case 'lt': if (!(val < pattern.value)) matched = false; break;
        case 'lte': if (!(val <= pattern.value)) matched = false; break;
        case 'eq': if (!(val === pattern.value)) matched = false; break;
      }
      if (!matched) break;
    }
    if (matched) active.push(diag);
  }
  return active;
}

function busEmit(type, payload) {
  const event = {
    type, payload,
    timestamp: new Date().toISOString(),
    id: crypto.randomUUID(),
  };
  try {
    appendFileSync(EVENTS_PATH, JSON.stringify(event) + '\n');
  } catch {}
}

function logHealerEntry(entry) {
  try {
    appendFileSync(HEALER_LOG, JSON.stringify(entry) + '\n');
  } catch {}
}

export function remediate() {
  const spoon = getSpoonLevel();
  const cog = getCognitiveState();
  const events = getRecentEvents(500);
  const metrics = extractMetrics(events);
  const diagnostics = matchDiagnostics(metrics);

  const results = [];

  for (const diag of diagnostics) {
    let permitted = true;
    if (diag.severity > 0) {
      if (spoon <= 1) permitted = false;
      if (spoon <= 2 && !diag.actions.every(a => ['suggest_break', 'emit_alerts', 'suggest_grounding'].includes(a))) {
        if (diag.actions.some(a => ['lock_production', 'check_auth', 'ping_services'].includes(a))) {
          permitted = false;
        }
      }
    }

    const entry = {
      diagnosis: diag.id,
      label: diag.label,
      severity: diag.severity,
      recommendation: diag.recommendation,
      permitted,
      actions_taken: [],
      timestamp: new Date().toISOString(),
    };

    if (permitted && spoon >= 3) {
      for (const actionId of diag.actions) {
        const action = ACTION_LIB[actionId];
        if (action) {
          try {
            action.execute(diag);
            entry.actions_taken.push(actionId);
          } catch (err) {
            entry.actions_taken.push(`${actionId}:failed`);
          }
        }
      }
    } else if (permitted && spoon === 2) {
      for (const actionId of diag.actions) {
        if (['suggest_break', 'emit_alerts', 'suggest_grounding', 'suggest_pause', 'suggest_delegate'].includes(actionId)) {
          const action = ACTION_LIB[actionId];
          if (action) {
            try {
              action.execute(diag);
              entry.actions_taken.push(actionId);
            } catch {}
          }
        }
      }
    } else {
      entry.actions_taken.push('blocked_by_spoon_gate');
    }

    logHealerEntry(entry);
    results.push(entry);
  }

  if (diagnostics.length === 0) {
    const entry = {
      diagnosis: 'none',
      label: 'No issues detected',
      severity: 0,
      recommendation: 'System nominal.',
      permitted: true,
      actions_taken: [],
      timestamp: new Date().toISOString(),
    };
    logHealerEntry(entry);
    results.push(entry);
  }

  busEmit('healer.cycle_complete', {
    diagnostics_found: diagnostics.length,
    actions_taken: results.flatMap(r => r.actions_taken.filter(a => !a.includes('blocked'))).length,
    spoon_state: spoon,
  });

  return results;
}

export function getHealerLog(limit = 20) {
  if (!existsSync(HEALER_LOG)) return [];
  const content = readFileSync(HEALER_LOG, 'utf-8').trim();
  if (!content) return [];
  return content.split('\n').filter(Boolean).slice(-limit).map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || 'run';

  if (cmd === 'run') {
    const results = remediate();
    console.log(`Self-Healer cycle complete. ${results.length} diagnostics evaluated.`);
    for (const r of results) {
      const status = r.permitted ? (r.actions_taken.length > 0 ? 'ACTION' : 'WATCH') : 'BLOCKED';
      console.log(`  [${status}] ${r.label} (severity: ${r.severity})`);
      if (r.actions_taken.length > 0) {
        console.log(`       actions: ${r.actions_taken.filter(a => !a.includes('blocked')).join(', ') || 'none'}`);
      }
      if (!r.permitted) console.log(`       ⛔ blocked by spoon gate`);
    }
  } else if (cmd === 'watch') {
    console.log('Self-Healer watching (every 60s)...');
    remediate();
    setInterval(() => {
      const results = remediate();
      const diags = results.filter(r => r.diagnosis !== 'none');
      if (diags.length > 0) {
        for (const r of diags) {
          const status = r.permitted ? (r.actions_taken.length > 0 ? '⚡' : '👁') : '⛔';
          console.log(`[${new Date().toISOString().slice(11, 19)}] ${status} ${r.label}`);
        }
      }
    }, 60000);
  } else if (cmd === 'log') {
    const log = getHealerLog(parseInt(process.argv[3], 10) || 20);
    console.log(`Self-Healer Log (${log.length} entries):`);
    for (const entry of log) {
      const time = entry.timestamp?.slice(11, 19) || '??:??:??';
      console.log(`  [${time}] ${entry.label} | sev:${entry.severity} | permitted:${entry.permitted} | actions:${entry.actions_taken.join(', ') || 'none'}`);
    }
  } else if (cmd === 'diag') {
    const events = getRecentEvents(200);
    const metrics = extractMetrics(events);
    console.log('Current metrics:');
    for (const [k, v] of Object.entries(metrics)) {
      console.log(`  ${k}: ${typeof v === 'number' ? v.toFixed(3) : v}`);
    }
    console.log('');
    const matches = matchDiagnostics(metrics);
    if (matches.length > 0) {
      console.log('Matching diagnostics:');
      for (const d of matches) {
        console.log(`  [${d.severity >= 0.6 ? 'HIGH' : d.severity >= 0.3 ? 'MED' : 'LOW'}] ${d.label}`);
        console.log(`       ${d.recommendation}`);
      }
    } else {
      console.log('No diagnostics match current state.');
    }
  } else {
    console.log(`PHOS Self-Healer

Usage:
  phos-heal run         Run one remediation cycle
  phos-heal watch       Watch mode (every 60s)
  phos-heal log [n]     Show last n healer log entries
  phos-heal diag        Show current metrics and matching diagnostics
`);
  }
}
