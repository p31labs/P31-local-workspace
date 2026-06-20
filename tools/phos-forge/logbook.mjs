#!/usr/bin/env node

import { readFileSync, existsSync, writeFileSync, appendFileSync, readdirSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = '/tmp/phos-logbook';
const STATE_PATH = '/tmp/phos-cognitive-state.json';
const EVENTS_PATH = '/tmp/phos-forge/events.jsonl';
const HEALER_LOG = '/tmp/phos-forge/healer-log.jsonl';
const LB_STATE = '/tmp/phos-logbook-state.json';
const SESSION_TIMEOUT_MS = 1800000; // 30 min

function today() { return new Date().toISOString().slice(0, 10); }
function tsNow() { return new Date().toISOString(); }
function timeStr(d) { return d.toISOString().slice(11, 19); }

function readJSON(path) {
  try { if (!existsSync(path)) return null; return JSON.parse(readFileSync(path, 'utf-8')); } catch { return null; }
}

function initState() {
  return {
    current_session: null,
    last_event_time: null,
    session_count: 0,
    last_page: null,
    event_cursor: 0,
    healer_cursor: 0,
  };
}

function getState() { return readJSON(LB_STATE) || initState(); }
function saveState(s) { try { mkdirSync(LOG_DIR, { recursive: true }); writeFileSync(LB_STATE, JSON.stringify(s)); } catch {} }

function fmtDuration(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function readEvents(cursor) {
  try {
    if (!existsSync(EVENTS_PATH)) return { events: [], cursor: 0 };
    const raw = readFileSync(EVENTS_PATH, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    if (lines.length <= cursor) return { events: [], cursor: lines.length };
    const newLines = lines.slice(cursor);
    const events = newLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    return { events, cursor: lines.length };
  } catch { return { events: [], cursor }; }
}

function readHealerEntries(cursor) {
  try {
    if (!existsSync(HEALER_LOG)) return { entries: [], cursor: 0 };
    const raw = readFileSync(HEALER_LOG, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    if (lines.length <= cursor) return { entries: [], cursor: lines.length };
    const newLines = lines.slice(cursor);
    const entries = newLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
    return { entries, cursor: lines.length };
  } catch { return { entries: [], cursor }; }
}

function getStateSnapshot() {
  const s = readJSON(STATE_PATH);
  if (!s) return null;
  return {
    cognitive_load: s.cognitive_load, fatigue: s.fatigue, flow: s.flow,
    creativity: s.creativity, stress: s.stress,
    spoon: s.spoon,
  };
}

function categorizeEvent(type) {
  if (!type) return 'other';
  if (type.includes('error') || type.includes('fail') || type.includes('crash')) return 'error';
  if (type.includes('deploy')) return 'deploy';
  if (type.includes('calibrat')) return 'calibrate';
  if (type.includes('jitterbug') || type.includes('research')) return 'jitterbug';
  if (type.includes('healer') || type.includes('remediat')) return 'healer';
  if (type.includes('nexus') || type.includes('cycle') || type.includes('tick')) return 'cycle';
  if (type.includes('learn') || type.includes('kappa')) return 'learning';
  if (type.includes('reflex')) return 'reflex';
  if (type.includes('brain') || type.includes('dump')) return 'brain';
  return 'other';
}

export function page() {
  const state = getState();
  const now = new Date();
  const dateKey = today();
  const logPath = join(LOG_DIR, `${dateKey}.md`);
  const jsonPath = join(LOG_DIR, `${dateKey}.json`);

  mkdirSync(LOG_DIR, { recursive: true });

  // Session management
  const isNewDay = state.last_page && state.last_page.slice(0, 10) !== dateKey;
  const isTimedOut = state.last_event_time && (Date.now() - state.last_event_time) > SESSION_TIMEOUT_MS;

  if (isNewDay || isTimedOut || !state.current_session) {
    state.session_count++;
    state.current_session = {
      id: state.session_count,
      start: tsNow(),
      start_state: getStateSnapshot(),
      events: {},
      healer_actions: [],
      key_moments: [],
      reflex_firings: 0,
      state_snapshots: [],
    };
  }

  const sess = state.current_session;

  // Read new events
  const { events, cursor } = readEvents(state.event_cursor);
  state.event_cursor = cursor;

  for (const ev of events) {
    const cat = categorizeEvent(ev.type);
    sess.events[cat] = (sess.events[cat] || 0) + 1;
    sess.events._total = (sess.events._total || 0) + 1;
    state.last_event_time = Date.now();

    if (cat === 'error') sess.key_moments.push(`[${timeStr(new Date(ev.timestamp))}] error: ${ev.type} ${ev.payload ? JSON.stringify(ev.payload).slice(0, 80) : ''}`);
    if (cat === 'deploy') sess.key_moments.push(`[${timeStr(new Date(ev.timestamp))}] deploy: ${ev.type}`);
    if (cat === 'calibrate') sess.key_moments.push(`[${timeStr(new Date(ev.timestamp))}] calibrate`);
    if (cat === 'reflex') sess.reflex_firings++;
  }

  // Read healer entries
  const { entries, cursor: hCursor } = readHealerEntries(state.healer_cursor);
  state.healer_cursor = hCursor;

  for (const entry of entries) {
    if (entry.diagnostic && entry.actions_taken?.length > 0) {
      sess.healer_actions.push({
        time: entry.timestamp?.slice(11, 19) || '??:??',
        diagnostic: entry.diagnostic,
        action: entry.actions_taken.join(', '),
        permitted: entry.permitted,
        reflex: entry.reflex,
      });
      if (entry.reflex) sess.reflex_firings++;
    }
  }

  // Snapshot state
  const snap = getStateSnapshot();
  if (snap) {
    sess.state_snapshots.push({ ...snap, time: tsNow() });
    if (sess.state_snapshots.length > 60) sess.state_snapshots.shift();
  }

  // Build markdown page
  const startTime = new Date(sess.start);
  const elapsed = Date.now() - startTime.getTime();
  const endState = snap || {};

  let md = `# Logbook — ${dateKey}\n\n`;
  md += `## Session ${sess.id} (${timeStr(startTime)} — ${timeStr(now)}, ${fmtDuration(elapsed)})\n\n`;

  // Events
  const cats = Object.entries(sess.events).filter(([k]) => k !== '_total').sort((a, b) => b[1] - a[1]);
  if (cats.length > 0) {
    md += `### Events\n`;
    for (const [cat, count] of cats) md += `- ${cat}: ${count}\n`;
    md += `- **total**: ${sess.events._total || 0}\n\n`;
  }

  // Cognitive state
  const firstSnap = sess.state_snapshots[0];
  if (firstSnap || endState.cognitive_load !== undefined) {
    md += `### Cognitive State\n`;
    if (firstSnap) md += `- Start: load ${(firstSnap.cognitive_load * 100).toFixed(0)}%, flow ${(firstSnap.flow * 100).toFixed(0)}%, stress ${(firstSnap.stress * 100).toFixed(0)}%, spoon ${firstSnap.spoon}\n`;
    if (endState.cognitive_load !== undefined) md += `- End:   load ${(endState.cognitive_load * 100).toFixed(0)}%, flow ${(endState.flow * 100).toFixed(0)}%, stress ${(endState.stress * 100).toFixed(0)}%, spoon ${endState.spoon}\n`;
    const peakLoad = sess.state_snapshots.reduce((p, s) => (s.cognitive_load > (p?.cognitive_load || 0) ? s : p), null);
    if (peakLoad) md += `- Peak load: ${(peakLoad.cognitive_load * 100).toFixed(0)}% at ${peakLoad.time.slice(11, 19)}\n`;
    md += '\n';
  }

  // Healer actions
  if (sess.healer_actions.length > 0) {
    md += `### Healer Actions\n`;
    for (const a of sess.healer_actions) {
      const reflex = a.reflex ? ' [reflex]' : '';
      const allowed = a.permitted ? 'allowed' : 'blocked';
      md += `- ${a.time} ${a.diagnostic} → ${a.action} (${allowed})${reflex}\n`;
    }
    md += '\n';
  }

  // Key moments (limited)
  if (sess.key_moments.length > 0) {
    const shown = sess.key_moments.slice(-15);
    md += `### Key Moments\n`;
    for (const m of shown) md += `- ${m}\n`;
    if (shown.length < sess.key_moments.length) md += `- … and ${sess.key_moments.length - shown.length} more\n`;
    md += '\n';
  }

  // Reflex summary
  if (sess.reflex_firings > 0) md += `- **Reflex firings**: ${sess.reflex_firings}\n\n`;

  // Persist
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    writeFileSync(logPath, md);
    // Also write JSON version
    const jsonData = {
      date: dateKey,
      session: sess.id,
      start: sess.start,
      end: tsNow(),
      duration_ms: elapsed,
      events: sess.events,
      state_snapshots: sess.state_snapshots,
      healer_actions: sess.healer_actions,
      key_moments: sess.key_moments,
      reflex_firings: sess.reflex_firings,
    };
    writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
  } catch {}

  state.last_page = tsNow();
  saveState(state);

  return { session: sess.id, events: sess.events._total || 0, duration: fmtDuration(elapsed), path: logPath };
}

export function getLogbookState() { return getState(); }

export function listLogs() {
  try {
    if (!existsSync(LOG_DIR)) return [];
    return readdirSync(LOG_DIR)
      .filter(f => f.endsWith('.md') && f !== 'README.md')
      .sort()
      .reverse()
      .slice(0, 30)
      .map(f => {
        const p = join(LOG_DIR, f);
        const st = existsSync(p) ? readFileSync(p, 'utf-8').length : 0;
        return { file: f, size: st, path: p };
      });
  } catch { return []; }
}

export function readLog(date) {
  const d = date || today();
  const p = join(LOG_DIR, `${d}.md`);
  try { return readFileSync(p, 'utf-8'); } catch { return null; }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cmd = process.argv[2] || 'status';

  if (cmd === 'page' || cmd === 'update') {
    const r = page();
    console.log(`Logbook — page written`);
    console.log(`  Session: ${r.session}`);
    console.log(`  Events:  ${r.events}`);
    console.log(`  Elapsed: ${r.duration}`);
    console.log(`  Path:    ${r.path}`);
  } else if (cmd === 'today') {
    const content = readLog();
    if (content) console.log(content);
    else console.log('No log for today yet. Run `phos logbook page` first.');
  } else if (cmd === 'list') {
    const logs = listLogs();
    if (logs.length === 0) { console.log('No logbook entries.'); process.exit(0); }
    console.log(`Logbook — ${logs.length} entries`);
    for (const l of logs) {
      const size = l.size > 1024 ? `${(l.size / 1024).toFixed(1)}KB` : `${l.size}B`;
      console.log(`  ${l.file.padEnd(16)} ${size}`);
    }
  } else if (cmd === 'read') {
    const date = process.argv[3];
    const content = readLog(date);
    if (content) console.log(content);
    else console.log(`No log for ${date || today()}.`);
  } else if (cmd === 'status') {
    const s = getState();
    const sess = s.current_session;
    const logs = listLogs();
    console.log(`Logbook — Session Memory`);
    console.log(`  Logs:      ${logs.length} entries`);
    if (sess) {
      const elapsed = Date.now() - new Date(sess.start).getTime();
      console.log(`  Session:   ${sess.id} (${fmtDuration(elapsed)})`);
      console.log(`  Events:    ${sess.events?._total || 0}`);
      console.log(`  Healer:    ${sess.healer_actions?.length || 0} actions`);
      console.log(`  Reflex:    ${sess.reflex_firings || 0} firings`);
    } else {
      console.log('  Session:   none active');
    }
    console.log(`  State:     ${s.last_page ? 'active' : 'never written'}`);
  } else {
    console.log(`PHOS Logbook — Auto-Generated Session Memory

Archives work sessions to markdown + JSON daily logs.

Usage:
  phos logbook page         Write a page (aggregate new events into current session)
  phos logbook today        Show today's log
  phos logbook read <date>  Show a specific date's log (YYYY-MM-DD)
  phos logbook list         List available log entries
  phos logbook status       Show logbook state and current session
`);
  }
}
