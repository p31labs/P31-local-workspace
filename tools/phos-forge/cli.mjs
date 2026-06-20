#!/usr/bin/env node

import { resolve, join } from 'path';
import { existsSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { classifyFile, scanRepo } from './classifier.mjs';
import { getRecentEntries, getStats, rollbackEntries } from './manifest.mjs';
import { updateAllImports } from './importer.mjs';
import { learnProject, formatMap } from './learner.mjs';
import { dashboard } from './dashboard.mjs';
import { estimate, getState } from './cognitive-estimator.mjs';
import { remediate, getHealerLog } from './self-healer.mjs';
import { renderAura, animateAura, captureAura } from './aura.mjs';
import { runJitterbug } from './jitterbug.mjs';
import { getStatus as getReflexStatus, mutePattern, unmutePattern, getHistory } from './reflex-arc.mjs';
import { tide, getTideState } from './tide.mjs';
import { learn as kappaLrn, getWeights as kappaW, resetWeights as kappaRst, getAdjustedDiagnostics } from './kappa.mjs';
import { buildIndex, query, findRelated, traceSymbol, getMap } from './cartographer.mjs';
import { page as lbPage, getLogbookState, listLogs, readLog } from './logbook.mjs';
import { processBrainDump, getSessions } from './brain.mjs';

const [nodePath, scriptPath, command, ...args] = process.argv;
const __dirname = resolve(new URL('.', import.meta.url).pathname);

async function cmdAdopt() {
  console.log('🔍 Scanning repo for unclassified files...');
  const result = await scanRepo();

  console.log(`\n📊 Scan complete:`);
  console.log(`   Total files: ${result.total}`);
  console.log(`   Classified:  ${result.classified}`);
  console.log(`   Unclassified: ${result.unclassified}`);
  console.log(`   Needs move:  ${result.needsMove}`);

  if (result.needsMove > 0) {
    console.log(`\n📋 Files that need to be moved:`);
    for (const item of result.items) {
      if (item.classified && item.oldPath !== item.newPath) {
        console.log(`   ${item.oldPath}`);
        console.log(`   → ${item.newPath}`);
        console.log(`   (${item.group}:${item.type})`);
        console.log('');
      }
    }

    if (!args.includes('--dry-run')) {
      console.log('🔄 Moving files...');
      const { renameSync, mkdirSync } = await import('fs');
      const { addEntry } = await import('./manifest.mjs');
      let moved = 0;
      let failed = 0;

      for (const item of result.items) {
        if (!item.classified || item.oldPath === item.newPath) continue;

        try {
          const destDir = item.newPath.substring(
            0,
            item.newPath.lastIndexOf('/')
          );
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }

          if (existsSync(item.newPath)) {
            console.log(`   ⚠️  Conflict: ${item.newPath}`);
            failed++;
            continue;
          }

          renameSync(item.oldPath, item.newPath);

          const importResult = await updateAllImports(
            item.oldPath,
            item.newPath,
            resolve(new URL('../../', import.meta.url).pathname)
          );

          addEntry({
            oldPath: item.oldPath,
            newPath: item.newPath,
            classification: item.type,
            group: item.group,
            status: 'moved',
            importsUpdated: importResult.updatedFiles,
            importChanges: importResult.totalChanges,
            reason: 'phos_adopt',
          });

          moved++;
          if (importResult.totalChanges > 0) {
            console.log(
              `   ✅ Moved → ${item.newPath} (updated ${importResult.totalChanges} imports)`
            );
          } else {
            console.log(`   ✅ Moved → ${item.newPath}`);
          }
        } catch (err) {
          console.error(`   ❌ Failed: ${item.oldPath} → ${err.message}`);
          failed++;
        }
      }

      console.log(`\n📊 Move complete: ${moved} moved, ${failed} failed`);
    } else {
      console.log('\n🏁 Dry run — no files moved. Use `phos adopt` without --dry-run to execute.');
    }
  } else {
    console.log('\n✨ All files are in their canonical locations.');
  }
}

async function cmdStatus() {
  const stats = getStats();
  const recent = getRecentEntries(10);

  console.log(`📊 Manifest stats:`);
  console.log(`   Total entries: ${stats.total}`);
  console.log(`   Moved:         ${stats.moved}`);
  console.log(`   Failed:        ${stats.failed}`);
  console.log(`   Rolled back:   ${stats.rolledBack}`);
  console.log(`   Unclassified:  ${stats.unclassified}`);

  if (recent.length > 0) {
    console.log(`\n📋 Recent activity:`);
    for (const entry of recent) {
      const time = new Date(entry.timestamp).toLocaleString();
      console.log(`   [${time}] ${entry.status}: ${entry.oldPath}`);
      if (entry.newPath && entry.newPath !== entry.oldPath) {
        console.log(`           → ${entry.newPath}`);
      }
      if (entry.importChanges) {
        console.log(`           (${entry.importChanges} imports updated)`);
      }
      console.log('');
    }
  }

  console.log('🔍 Checking for unclassified files...');
  const result = await scanRepo();
  const unclassifiedItems = result.items.filter((i) => !i.classified);
  if (unclassifiedItems.length > 0) {
    console.log(`\n⚠️  ${unclassifiedItems.length} unclassified files found:`);
    for (const item of unclassifiedItems.slice(0, 20)) {
      console.log(`   • ${item.oldPath || item.reason}`);
    }
    if (unclassifiedItems.length > 20) {
      console.log(`   ... and ${unclassifiedItems.length - 20} more`);
    }
    console.log('\n   Run `phos adopt` to classify and move them.');
  } else {
    console.log('\n✨ No unclassified files.');
  }
}

async function cmdRollback() {
  const count = parseInt(args[0], 10) || 1;
  const entries = rollbackEntries(count);
  if (entries.length === 0) {
    console.log('No entries to roll back.');
    return;
  }

  console.log(`↩️  Rolling back ${entries.length} move(s)...`);
  for (const entry of entries) {
    try {
      const { renameSync, mkdirSync } = await import('fs');
      const destDir = entry.newPath.substring(
        0,
        entry.newPath.lastIndexOf('/')
      );
      if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
      renameSync(entry.oldPath, entry.newPath);
      console.log(`   ✅ ${entry.oldPath} ← ${entry.newPath}`);
    } catch (err) {
      console.error(`   ❌ ${entry.oldPath}: ${err.message}`);
    }
  }
}

async function cmdClassify() {
  const target = args[0];
  if (!target) {
    console.error('Usage: phos classify <file-path>');
    process.exit(1);
  }
  const absPath = resolve(target);
  if (!existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }
  const result = await classifyFile(absPath);
  if (result.classified) {
    console.log(`📋 Classification:`);
    console.log(`   Type:  ${result.type}`);
    console.log(`   Group: ${result.group}`);
    console.log(`   From:  ${result.oldPath}`);
    console.log(`   To:    ${result.newPath}`);
  } else {
    console.log(`❓ Unclassified: ${result.reason}`);
  }
}

async function cmdWatch() {
  console.log('👀 Starting file watcher (vibe mode)...');
  console.log('   Watching repo root + drop zones for new files.');
  console.log('   Press Ctrl+C to stop.\n');

  const { createWatcher } = await import('./watcher.mjs');
  const { watcher, close } = createWatcher();

  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping watcher...');
    close();
    process.exit(0);
  });

  await new Promise(() => {});
}

async function cmdLearn() {
  const target = args[0] || '.';
  const repoRoot = resolve(new URL('../', import.meta.url).pathname);
  const projectDir = resolve(target);

  console.log(`🔬 Learning project: ${projectDir}`);
  const draft = learnProject(projectDir, repoRoot);

  console.log(`\n📋 Draft canonical map:`);
  console.log(`   Project:  ${draft.project}`);
  console.log(`   Base:     ${draft.base}`);
  console.log(`   Framework: ${draft.framework}`);
  console.log(`   Patterns: ${draft.patterns.length}`);
  console.log(`\n   Output:  ${formatMap(draft)}\n`);

  const outFile = resolve(projectDir, '.phos-map-draft.json');
  const outContent = JSON.stringify(draft, null, 2);
  await writeFile(outFile, outContent, 'utf-8');
  console.log(`✅ Draft saved to ${outFile}`);
}

async function cmdDashboard() {
  await dashboard();
}

async function cmdDeploy() {
  const target = args[0];
  if (!target) {
    console.error('Usage: phos deploy <project>');
    process.exit(1);
  }
  const spoonPath = '/home/p31/P31-local-workspace/spoon-state.json';
  let spoonLevel = 4;
  try {
    const data = JSON.parse(await readFile(spoonPath, 'utf-8'));
    if (typeof data.level === 'number') spoonLevel = data.level;
  } catch {}
  if (spoonLevel <= 2) {
    console.log(`[Cognitive Gate] Spoons at Level ${spoonLevel}. Deploy blocked.`);
    process.exit(1);
  }
  console.log(`[Deploy] Target: ${target} | Spoons: ${spoonLevel}`);
  const deployScript = resolve(new URL('../', import.meta.url).pathname, 'scripts/deploy-workers.sh');
  if (existsSync(deployScript)) {
    const { spawn } = await import('child_process');
    const child = spawn('bash', [deployScript, '--project', target], { stdio: 'inherit' });
    await new Promise((resolve, reject) => {
      child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`deploy exited ${code}`)));
    });
  } else {
    console.log(`Deploy script not found at ${deployScript}`);
  }
}

async function cmdAura() {
  const extra = args.filter(a => a.startsWith('--') || a.startsWith('-'));
  const positional = args.filter(a => !a.startsWith('-'));
  const opts = {
    verbose: extra.includes('--verbose') || extra.includes('-v'),
    compact: extra.includes('--compact') || extra.includes('-c'),
  };

  if (extra.includes('--once') || extra.includes('-1')) {
    const { getState } = await import('./cognitive-estimator.mjs');
    const state = getState();
    console.log(renderAura(state, opts));
  } else if (extra.includes('--share') || extra.includes('-s')) {
    const outPath = positional[0];
    const path = captureAura({ output: outPath, ...opts });
    console.log(`Aura frame saved to ${path}`);
  } else {
    animateAura(opts);
  }
}

async function cmdJitterbug() {
  const extra = args.filter(a => a.startsWith('--') || a.startsWith('-'));
  const positional = args.filter(a => !a.startsWith('--') && !a.startsWith('-') && a !== '-f' && a !== '-d' && a !== '-n');
  const fi = args.findIndex(a => a === '--factor' || a === '-f');
  const factor = fi >= 0 && fi + 1 < args.length ? parseInt(args[fi + 1], 10) || 4 : 4;
  const di = args.findIndex(a => a === '--depth' || a === '-d');
  const depth = di >= 0 && di + 1 < args.length ? parseInt(args[di + 1], 10) || 3 : 3;

  if (extra.includes('--dry-run') || extra.includes('-n')) {
    const { getGatedConfig } = await import('./jitterbug.mjs');
    const gated = getGatedConfig(factor, depth);
    console.log(JSON.stringify({
      mode: 'DRY-RUN',
      requested: { factor, depth },
      gated,
      estimatedCalls: gated.depth * (gated.factor + 1),
      status: gated.depth > 0 ? 'READY' : 'BLOCKED',
    }, null, 2));
    return;
  }

  const problem = positional.join(' ').trim();
  if (!problem) {
    console.error('Usage: phos jitterbug "<problem>" [--factor N] [--depth N] [--dry-run]');
    return;
  }

  const result = await runJitterbug(problem, { factor, depth });
  if (result.error) { console.error(result.error); return; }
  console.log(result.output);
  console.log(`\n---\nSession: ${result.session} | Spoons: ${result.gated.spoon}/5 (${result.gated.tier})`);
}

async function cmdReflex() {
  const sub = args[0];
  if (sub === 'status') {
    const s = getReflexStatus();
    console.log(`Reflex Arc Status`);
    console.log(`  Uptime:    ${s.uptime_s}s`);
    console.log(`  Ticks:     ${s.ticks}`);
    console.log(`  Window:    ${s.window_size} events`);
    console.log(`  Silence:   ${s.last_event_ago_ms}ms since last event`);
    console.log(`  Spoon:     ${s.spoon}/5`);
    for (const [id, p] of Object.entries(s.patterns)) {
      const mute = p.muted ? ' [MUTED]' : '';
      const cooldown = p.cooldown_remaining_ms > 0 ? ` (cooldown: ${p.cooldown_remaining_ms}ms)` : '';
      console.log(`  ${id}: ${p.label}${mute}${cooldown}`);
      if (p.last_fired) console.log(`    last fired: ${p.last_fired}`);
    }
  } else if (sub === 'mute') {
    const id = args[1];
    if (!id) { console.error('Usage: phos reflex mute <pattern-id>'); return; }
    console.log(mutePattern(id) ? `Muted: ${id}` : `Unknown pattern: ${id}`);
  } else if (sub === 'unmute') {
    const id = args[1];
    if (!id) { console.error('Usage: phos reflex unmute <pattern-id>'); return; }
    console.log(unmutePattern(id) ? `Unmuted: ${id}` : `Unknown pattern: ${id}`);
  } else if (sub === 'history') {
    const limit = parseInt(args[1], 10) || 10;
    const history = getHistory(limit);
    if (!history.length) { console.log('No reflex firings recorded.'); return; }
    for (const h of history) {
      const time = (h.timestamp || '').slice(11, 19) || '??:??:??';
      const status = h.permitted ? '⚡' : '⛔';
      console.log(`  ${time} ${status} ${h.label} (${h.diagnostic}) sev:${h.severity?.toFixed(2)} actions:${h.actions_taken?.join(', ') || 'none'}`);
    }
  } else {
    console.log(`PHOS Reflex Arc — Sub-cycle Fast Loop

Patterns:
  error_cascade       ≥3 errors in 5s window (cooldown: 30s)
  high_cognitive_load cognitive_load > 0.8 (cooldown: 30s)
  bus_silence         no events for 60s (cooldown: 60s)

Usage:
  phos reflex status         Show arc state and pattern cooldowns
  phos reflex mute <id>      Disable a pattern for this session
  phos reflex unmute <id>    Re-enable a pattern
  phos reflex history [n]    Show last N reflex firings
`);
  }
}

async function cmdTide() {
  const sub = args[0];
  if (sub === 'status') {
    tide();
    const s = getTideState();
    if (!s) { console.log('Tide: no data yet'); return; }
    console.log(`Tide — Temporal Pattern Learning`);
    console.log(`  Total events: ${s.temporal_model.total_events}`);
    console.log(`  Window:       ${s.temporal_model.window_events} events`);
    console.log(`  Uptime:       ${s.current.uptime_hours}h`);
    console.log(`  Current hour: ${s.current.hour_bin}:00 (${s.current.events_this_hour} ev, ${s.current.errors_this_hour} err, trend: ${s.current.activity_trend})`);
    console.log(`  Peak hour:    ${s.patterns.peak_activity_hour}:00`);
    console.log(`  Flow hour:    ${s.patterns.peak_flow_hour}:00`);
    if (s.patterns.error_prone_hours.length > 0) console.log(`  Error hours:  ${s.patterns.error_prone_hours.map(h => h + ':00').join(', ')}`);
    if (s.patterns.silence_windows.length > 0) console.log(`  Silence:      ${s.patterns.silence_windows.map(w => w.start + ':00-' + w.end + ':00').join(', ')}`);
    if (s.patterns.cascade_precursors.length > 0) console.log(`  Precursors:   ${s.patterns.cascade_precursors.map(p => `${p.type} (${p.count}x)`).join(', ')}`);
  } else if (sub === 'hourly') {
    tide();
    const s = getTideState();
    if (!s) { console.log('Tide: no data'); return; }
    console.log('Hour│Events Err Wrn Cyc│Rate  ');
    console.log('────┼──────────────────┼──────');
    for (const h of s.temporal_model.hourly) {
      const bar = '█'.repeat(Math.min(Math.round(h.events / 5), 20));
      console.log(`${String(h.hour).padStart(2)}:00 │${String(h.events).padStart(4)} ${String(h.errors).padStart(3)} ${String(h.warnings).padStart(3)} ${String(h.cycles).padStart(3)}│${h.error_rate.toFixed(2)} ${bar}`);
    }
  } else if (sub === 'reset') {
    const { tide } = await import('./tide.mjs');
    tide.reset?.();
    console.log('Tide: reset complete');
  } else {
    console.log(`PHOS Tide — Temporal Pattern Learning

Detects circadian rhythms, error tides, flow windows, and cascade precursors.

Usage:
  phos tide status     Show temporal model and detected patterns
  phos tide hourly     Per-hour bar chart breakdown
  phos tide reset      Clear all temporal data and restart
`);
  }
}

async function cmdKappa() {
  const sub = args[0];
  if (sub === 'learn') {
    const r = kappaLrn();
    console.log(`Kappa — learn cycle`);
    console.log(`  New learnings: ${r.new_learnings}`);
    console.log(`  State delta:   ${r.delta !== null ? r.delta.toFixed(3) : 'N/A'}`);
    if (r.adjusted?.length > 0) {
      console.log(`  Adjusted:`);
      for (const a of r.adjusted) console.log(`    ${a.diagnostic} → ${a.actions.join(', ')}`);
    }
  } else if (sub === 'weights') {
    const w = kappaW();
    console.log(`Kappa — Outcome Weights`);
    console.log(`  Trials: ${w.total_trials || 0} | Last: ${w.last_update || 'never'}`);
    for (const [id, wt] of Object.entries(w.weights).sort((a, b) => b[1] - a[1])) {
      const bar = '\u2588'.repeat(Math.round(wt * 10)) + '\u2591'.repeat(10 - Math.round(wt * 10));
      console.log(`  ${id.padEnd(24)} ${bar} ${wt.toFixed(3)}`);
    }
  } else if (sub === 'diagnostics') {
    const samples = Object.keys(kappaW().weights).map(id => ({ id, threshold: 0.8 }));
    const adj = getAdjustedDiagnostics(samples);
    console.log(`Kappa — Adjusted Diagnostics`);
    for (const d of adj) {
      const eff = (0.8 * d.kappa_mult).toFixed(2);
      console.log(`  ${d.id.padEnd(24)} w:${d.kappa_weight.toFixed(2)} mult:${d.kappa_mult} → ${eff}`);
    }
  } else if (sub === 'reset') {
    kappaRst();
    console.log('Kappa: weights reset to 0.5');
  } else {
    console.log(`PHOS Kappa — Outcome-Aware Healer Learning

Tracks healer actions, correlates with state changes, adjusts weights.

Usage:
  phos kappa learn        Run a learning cycle
  phos kappa weights      Show current outcome weights
  phos kappa diagnostics  Show effective thresholds
  phos kappa reset        Reset all weights to 0.5
`);
  }
}

async function cmdCartographer() {
  const sub = args[0];
  if (sub === 'index' || sub === 'rebuild') {
    const path = args[1];
    buildIndex(path ? [resolve(process.cwd(), path)] : null);
    const m = getMap();
    console.log(`Cartographer — index built`);
    console.log(`  Files indexed: ${m.total}`);
    console.log(`  By type:       ${Object.entries(m.byExt).map(([e, c]) => `${e}: ${c}`).join(', ')}`);
  } else if (sub === 'query') {
    const text = args.slice(1).join(' ');
    if (!text) { console.error('Usage: phos cartographer query "<text>"'); return; }
    const results = query(text, 15);
    if (!results.length) { console.log('No matches.'); return; }
    console.log(`Query: "${text}"`);
    for (const r of results) {
      const ex = r.exports?.length ? ` [${r.exports.slice(0, 4).join(', ')}]` : '';
      console.log(`  ${(r.score * 100).toFixed(0).padStart(2)}%  ${r.path}${ex}`);
    }
  } else if (sub === 'related') {
    const path = args[1];
    if (!path) { console.error('Usage: phos cartographer related <file>'); return; }
    const results = findRelated(path, 15);
    if (!results.length) { console.log('No related files.'); return; }
    console.log(`Related to: ${path}`);
    for (const r of results) console.log(`  ${(r.score * 100).toFixed(0).padStart(2)}%  ${r.path}`);
  } else if (sub === 'trace') {
    const symbol = args[1];
    if (!symbol) { console.error('Usage: phos cartographer trace <symbol>'); return; }
    const results = traceSymbol(symbol);
    if (!results.length) { console.log(`No references to "${symbol}"`); return; }
    console.log(`"${symbol}" — ${results.length} references`);
    for (const r of results) console.log(`  ${r.path}  (${r.matches.join(', ')})`);
  } else if (sub === 'status') {
    const m = getMap();
    console.log(`Cartographer — Semantic Codebase Map`);
    console.log(`  Files indexed: ${m.total}`);
    console.log(`  Built:         ${m.built || 'never'}`);
    console.log(`  By type:       ${Object.entries(m.byExt || {}).map(([e, c]) => `${e}: ${c}`).join(', ')}`);
    console.log(`  Top terms:     ${(m.top_terms || []).join(', ')}`);
  } else {
    console.log(`PHOS Cartographer — Semantic Codebase Map

Indexes source files with TF-IDF vectors for semantic search.

Usage:
  phos cartographer status                Show index statistics
  phos cartographer index [path]          Build/rebuild index
  phos cartographer query "<text>"        Semantic search
  phos cartographer related <file>        Find related files
  phos cartographer trace <symbol>        Find symbol references
`);
  }
}

async function appendFamilyCycles() {
  try {
    const { existsSync, readFileSync } = await import('fs');
    const { join } = await import('path');
    const __dirname = resolve(new URL('.', import.meta.url).pathname);
    const fp = join(__dirname, 'family-tree.json');
    if (!existsSync(fp)) return '';
    const tree = JSON.parse(readFileSync(fp, 'utf-8'));
    if (!tree.cycles?.length) return '';
    let md = '\n\n## OHANA — Family Lineage\n\n';
    for (const c of tree.cycles) {
      md += `### ${c.name}\n${c.description}\n\n`;
      if (c.phos_analog) md += `*PHOS analog: ${c.phos_analog}*\n\n`;
    }
    return md;
  } catch { return ''; }
}

async function cmdLogbook() {
  const sub = args[0];
  const hasFamily = args.includes('--family');
  if (sub === 'page' || sub === 'update') {
    const r = lbPage();
    console.log(`Logbook — page written`);
    console.log(`  Session: ${r.session}`);
    console.log(`  Events:  ${r.events}`);
    console.log(`  Elapsed: ${r.duration}`);
  } else if (sub === 'today') {
    const content = readLog();
    if (content) console.log(content + (hasFamily ? await appendFamilyCycles() : ''));
    else console.log('No log for today. Run `phos logbook page` first.');
  } else if (sub === 'read') {
    const date = args[1];
    const content = readLog(date);
    if (content) console.log(content + (hasFamily ? await appendFamilyCycles() : ''));
    else console.log(`No log for ${date || 'today'}.`);
  } else if (sub === 'status') {
    const s = getLogbookState();
    const sess = s.current_session;
    const logs = listLogs();
    console.log(`Logbook — Session Memory`);
    console.log(`  Logs:      ${logs.length} entries`);
    if (sess) {
      const elapsed = Date.now() - new Date(sess.start).getTime();
      const h = Math.floor(elapsed / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      console.log(`  Session:   ${sess.id} (${h}h ${m}m)`);
      console.log(`  Events:    ${sess.events?._total || 0}`);
      console.log(`  Healer:    ${sess.healer_actions?.length || 0} actions`);
      console.log(`  Reflex:    ${sess.reflex_firings || 0} firings`);
    } else console.log('  Session:   none active');
  } else {
    console.log(`PHOS Logbook — Auto-Generated Session Memory

Usage:
  phos logbook page         Write a page (aggregate new events)
  phos logbook today [--family]        Show today's log (with family lineage)
  phos logbook read <date> [--family]  Show a specific date's log (with family lineage)
  phos logbook list                    List available logs
  phos logbook status                  Show logbook state
`);
  }
}

async function cmdCalibrate() {
  const { calibrate } = await import('./calibrate.mjs');
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      if (['spoon', 'load', 'fatigue', 'flow', 'stress', 'creativity'].includes(key)) {
        opts[key] = val;
        if (val !== true) i++;
      }
    }
  }
  const result = calibrate(opts);
  console.log(`Calibration logged.`);
  console.log(`  Spoon: ${result.estimated.spoon} → ${result.reported.spoon}`);
}

async function cmdState() {
  const sub = args[0];
  if (sub === 'estimate') {
    const s = estimate();
    console.log('Estimated cognitive state:');
    for (const dim of ['cognitive_load', 'fatigue', 'flow', 'creativity', 'stress']) {
      console.log(`  ${dim.padEnd(16)} ${(s[dim] * 100).toFixed(0)}%`);
    }
    console.log(`  spoon              Level ${s.spoon}/5 — ${s.spoon_label}`);
    console.log(`  session            ${s.session_hours.toFixed(1)} hours`);
  } else {
    const s = getState();
    console.log(`Cognitive State (as of ${s.timestamp}):`);
    for (const dim of ['cognitive_load', 'fatigue', 'flow', 'creativity', 'stress']) {
      const bar = '█'.repeat(Math.round(s[dim] * 10)) + '░'.repeat(10 - Math.round(s[dim] * 10));
      console.log(`  ${dim.padEnd(16)} ${bar} ${(s[dim] * 100).toFixed(0)}%`);
    }
    console.log(`  spoon              Level ${s.spoon}/5 — ${s.spoon_label}`);
    console.log(`  session            ${s.session_hours?.toFixed(1) || 0}h`);
  }
}

async function cmdRemediate() {
  const sub = args[0];
  if (sub === 'log') {
    const limit = parseInt(args[1], 10) || 10;
    const log = getHealerLog(limit);
    if (log.length === 0) { console.log('No healer entries yet.'); return; }
    console.log(`Self-Healer Log (${log.length} entries):`);
    for (const entry of log) {
      const time = entry.timestamp?.slice(11, 19) || '??:??:??';
      const status = entry.permitted ? (entry.actions_taken.some(a => !a.includes('blocked') && a !== 'none') ? '⚡' : '👁') : '⛔';
      console.log(`  ${time} ${status} ${entry.label} | sev:${entry.severity} | ${entry.actions_taken.filter(a => !a.includes('blocked')).join(', ') || 'watch-only'}`);
    }
  } else if (sub === 'diag') {
    const { spawn } = await import('child_process');
    const hp = new URL('./self-healer.mjs', import.meta.url).pathname;
    const c = spawn('node', [hp, 'diag'], { stdio: 'inherit' });
    await new Promise((r, j) => { c.on('close', (code) => code === 0 ? r() : j()); c.on('error', j); });
  } else {
    const results = remediate();
    console.log(`Self-Healer cycle complete. ${results.length} diagnostics evaluated.`);
    for (const r of results) {
      const status = r.permitted ? (r.actions_taken.length > 0 && !r.actions_taken[0].includes('blocked') ? '⚡' : '👁') : '⛔';
      console.log(`  ${status} ${r.label} (severity: ${r.severity})`);
      const taken = r.actions_taken.filter(a => !a.includes('blocked'));
      if (taken.length > 0) console.log(`       actions: ${taken.join(', ')}`);
      if (!r.permitted) console.log(`       blocked by spoon gate`);
    }
  }
}

async function cmdBrain() {
  const flagValues = new Set();
  const flagNames = ['--factor', '-f', '--depth', '-d', '--file'];
  for (let i = 0; i < args.length; i++) {
    if (flagNames.includes(args[i]) && i + 1 < args.length) flagValues.add(i + 1);
  }
  const fi = args.findIndex(a => a === '--factor' || a === '-f');
  const factor = fi >= 0 && fi + 1 < args.length ? parseInt(args[fi + 1], 10) || 2 : 2;
  const di = args.findIndex(a => a === '--depth' || a === '-d');
  const depth = di >= 0 && di + 1 < args.length ? parseInt(args[di + 1], 10) || 1 : 1;

  const sub = args[0];
  if (sub === 'sessions' || sub === 'status') {
    const count = parseInt(args[1], 10) || 5;
    const sessions = getSessions(count);
    if (sessions.length === 0) { console.log('No brain dump sessions today.'); return; }
    console.log(`Brain Dump Sessions:`);
    for (const s of sessions) {
      console.log(`  ${s.session} | ${s.mode} | ${s.themes} themes | ${s.thoughts} thoughts | ${s.duration} | spoon ${s.spoon}/5`);
    }
    return;
  }

  if (sub === 'session') {
    const { spawn } = await import('child_process');
    const brainScript = join(__dirname, 'brain.mjs');
    const args = [brainScript, 'session'];
    if (hasFamily) args.push('--family');
    const child = spawn('node', args, { stdio: 'inherit' });
    await new Promise((r, j) => { child.on('close', (code) => code === 0 ? r() : j()); child.on('error', j); });
    return;
  }

  if (sub === 'diff') {
    const { spawn } = await import('child_process');
    const brainScript = join(__dirname, 'brain.mjs');
    const child = spawn('node', [brainScript, 'diff', args[1] || '', args[2] || ''], { stdio: 'inherit' });
    await new Promise((r, j) => { child.on('close', (code) => code === 0 ? r() : j()); child.on('error', j); });
    return;
  }

  const extra = args.filter(a => a.startsWith('--'));
  const hasFamily = extra.includes('--family');
  let mode = 'quick';
  if (extra.includes('--deep')) mode = 'deep';
  else if (extra.includes('--full')) mode = 'full';

  const fileIdx = args.findIndex(a => a === '--file');
  let text;
  if (fileIdx >= 0) {
    const { readFileSync, existsSync } = await import('fs');
    const filePath = args[fileIdx + 1];
    if (!filePath || !existsSync(filePath)) { console.error('File not found:', filePath); return; }
    text = readFileSync(filePath, 'utf-8');
  } else {
    text = args.filter((a, i) => !a.startsWith('--') && !flagValues.has(i)).join(' ').trim();
  }

  if (!text) {
    console.log(`PHOS Brain Dump — Quantum Thought Processor

Pipeline: parse raw text → elaborate fragments → organize themes → research (optional) → synthesize → archive

Usage:
  phos brain "<text>" [--quick|--deep|--full] [--factor N] [--depth N]
  phos brain --file <path> [--quick|--deep|--full]
  phos brain sessions [n]

Modes:
  --quick   Elaborate + organize only (~3-5 min)
  --deep    + Jitterbug research per theme (~10-15 min)
  --full    + Cartographer code links + Tide context (~15-20 min)
  --family  + Family lineage context (cycles, ghost nodes, Spoonemore echo) -- full only
`);
    return;
  }

  console.log(`🧠 Brain dump starting — mode: ${mode}${hasFamily ? ' + family' : ''}`);
  const result = await processBrainDump(text, { mode, factor, depth, family: hasFamily });
  if (result.error) { console.error(result.error); return; }
  console.log(result.output);
  console.log(`\n---\nSession: ${result.session} | Mode: ${result.mode} | Spoons: ${result.spoon}/5 | ${result.duration}`);
}

async function main() {
  const commandMap = {
    adopt: cmdAdopt,
    status: cmdStatus,
    rollback: cmdRollback,
    classify: cmdClassify,
    watch: cmdWatch,
    learn: cmdLearn,
    dashboard: cmdDashboard,
    deploy: cmdDeploy,
    state: cmdState,
    remediate: cmdRemediate,
    calibrate: cmdCalibrate,
    aura: cmdAura,
    jitterbug: cmdJitterbug,
    reflex: cmdReflex,
    tide: cmdTide,
    kappa: cmdKappa,
    cartographer: cmdCartographer,
    logbook: cmdLogbook,
    brain: cmdBrain,
  };

  const handler = commandMap[command];
  if (!handler) {
    console.log(`PHOS Forge — Autonomic File Organization

Usage:
  phos adopt              Classify and move all unclassified files to canonical locations
  phos adopt --dry-run      Preview moves without executing
  phos status             Show manifest stats, recent activity, and unclassified files
  phos rollback [n]       Roll back the last N moves (default: 1)
  phos classify <path>    Classify a single file and show its destination
  phos watch              Start the background file watcher (vibe mode)
  phos learn [dir]        Infer a draft canonical map for a project
  phos dashboard          Show convergence dashboard
  phos deploy <project>   Deploy a Cloudflare Pages/Worker project
  phos state              Show estimated cognitive state (5-dimensional)
  phos state estimate     Run a fresh cognitive state estimate
  phos remediate          Run self-healer remediation cycle
  phos remediate log      Show self-healer activity log
  phos remediate diag     Show current metrics and matching diagnostics
  phos calibrate --spoon <0-5>  Self-report spoon level
  phos calibrate --interactive   Interactive calibration
  phos aura [--once|--verbose|--share]  Terminal particle visualization of cognitive state
  phos jitterbug "<problem>" [--factor N] [--depth N] [--dry-run]  Fractal research workflow (spawn N agents, converge, repeat)
  phos reflex [status|mute|unmute|history]  Sub-cycle fast loop (pattern matching, cooldown, spoon gating)
  phos tide [status|hourly|reset]           Temporal pattern learning (circadian rhythms, error tides, flow windows)
  phos kappa [learn|weights|diagnostics|reset]  Outcome-aware healer learning (Bayesian weight updates)
  phos cartographer [status|index|query|related|trace]  Semantic codebase map (TF-IDF vector search)
  phos logbook [page|today|read|list|status]          Auto-generated session memory (markdown + JSON)
  phos brain "<text>" [--quick|--deep|--full] [--family]  Quantum brain dump pipeline (elaborate → organize → research → archive)
  phos brain --file <path> [--quick|--deep|--full] [--family]  Brain dump from file
  phos brain sessions [n]                              Show recent brain dump sessions
  phos brain session [--family]                        Interactive stdin capture (Ctrl+D to submit)
  phos brain diff <id1> <id2>                          Compare two sessions
`);
    process.exit(1);
  }

  try { await handler(); }
  catch (err) { console.error('Error:', err.message); process.exit(1); }
}

main();
