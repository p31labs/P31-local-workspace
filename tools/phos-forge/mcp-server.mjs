import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { EventEmitter } from 'events';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PHOS_CLI = join(__dirname, 'cli.mjs');
const BUS_CLI = join(__dirname, 'bus.mjs');
const COG_ESTIMATOR = join(__dirname, 'cognitive-estimator.mjs');
const SELF_HEALER = join(__dirname, 'self-healer.mjs');

export default class PhosMCPServer extends EventEmitter {
  constructor() {
    super();
    this.tools = {
      'phos-adopt': {
        description: 'Classify and move unclassified files to canonical locations. Use --dry-run to preview.',
        inputSchema: {
          type: 'object',
          properties: {
            dry_run: { type: 'boolean', description: 'Preview without executing' },
          },
        },
      },
      'phos-status': {
        description: 'Show manifest stats, recent activity, and unclassified files.',
        inputSchema: { type: 'object', properties: {} },
      },
      'phos-classify': {
        description: 'Classify a single file and show its canonical destination.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Absolute path to the file' },
          },
          required: ['path'],
        },
      },
      'phos-learn': {
        description: 'Infer a draft canonical map for a project by scanning its structure.',
        inputSchema: {
          type: 'object',
          properties: {
            dir: { type: 'string', description: 'Project directory (default: .)' },
          },
        },
      },
      'phos-rollback': {
        description: 'Roll back the last N file moves.',
        inputSchema: {
          type: 'object',
          properties: {
            count: { type: 'number', description: 'Number of moves to roll back (default: 1)' },
          },
        },
      },
      'phos-watch': {
        description: 'Start the background file watcher (vibe mode) — returns immediately.',
        inputSchema: { type: 'object', properties: {} },
      },
      'bus-emit': {
        description: 'Emit an event to the PHOS Forge event bus (JSONL + Unix socket).',
        inputSchema: {
          type: 'object',
          properties: {
            type: { type: 'string', description: 'Event type (e.g. deploy.started)' },
            payload: { type: 'object', description: 'Event payload' },
          },
          required: ['type', 'payload'],
        },
      },
      'yardmaster-inspect': {
        description: 'Inspect yardmaster daemon status (Bash orchestration).',
        inputSchema: { type: 'object', properties: {} },
      },
      'nexus-state': {
        description: 'Get current nexus cross-domain state.',
        inputSchema: { type: 'object', properties: {} },
      },
      'phos-deploy': {
        description: 'Deploy a Cloudflare Pages or Worker project with spoon-aware gating.',
        inputSchema: {
          type: 'object',
          properties: {
            target: { type: 'string', description: 'Project path or name (e.g. phos, bonding)' },
            force: { type: 'boolean', description: 'Override cognitive safety gate' },
          },
          required: ['target'],
        },
      },
      'cognitive-state': {
        description: 'Get the current estimated cognitive state (5-dimensional vector).',
        inputSchema: { type: 'object', properties: {} },
      },
      'cognitive-estimate': {
        description: 'Run a fresh estimate cycle and return updated cognitive state.',
        inputSchema: { type: 'object', properties: {} },
      },
      'healer-remediate': {
        description: 'Run a self-healer remediation cycle (checks diagnostics, may take actions).',
        inputSchema: { type: 'object', properties: {} },
      },
      'jitterbug-run': {
        description: 'Run the fractal research workflow. Splits a problem into N facets, researches in parallel, converges, repeats to depth.',
        inputSchema: {
          type: 'object',
          properties: {
            problem: { type: 'string', description: 'Research problem statement' },
            factor: { type: 'number', description: 'Branch factor (default: 4, spoon-gated)' },
            depth: { type: 'number', description: 'Convergence depth (default: 3, spoon-gated)' },
            dry_run: { type: 'boolean', description: 'Preview without executing LLM calls' },
          },
          required: ['problem'],
        },
      },
      'phos-aura': {
        description: 'Render terminal particle visualization of cognitive state. Particle field by default, --compact for 5-char bar display.',
        inputSchema: {
          type: 'object',
          properties: {
            once: { type: 'boolean', description: 'Single frame output' },
            verbose: { type: 'boolean', description: 'Show labels and bars overlay' },
            compact: { type: 'boolean', description: 'Use compact 5-char bar display instead of particle field' },
            share: { type: 'boolean', description: 'Save to file' },
            output_path: { type: 'string', description: 'Output path for --share (default: /tmp/phos-aura-frame.txt)' },
          },
        },
      },
      'healer-log': {
        description: 'Show recent self-healer activity log.',
        inputSchema: { type: 'object', properties: {} },
      },
      'reflex-status': {
        description: 'Show Reflex Arc status, pattern cooldowns, and recent firings.',
        inputSchema: {
          type: 'object',
          properties: {
            history: { type: 'number', description: 'Number of history entries to show (default: 5)' },
          },
        },
      },
      'tide-status': {
        description: 'Show Tide temporal pattern learning model — circadian rhythms, error tides, flow windows.',
        inputSchema: { type: 'object', properties: {} },
      },
      'kappa-status': {
        description: 'Show Kappa outcome-aware weights and adjusted diagnostic thresholds.',
        inputSchema: {
          type: 'object',
          properties: {
            learn: { type: 'boolean', description: 'Run a learn cycle before returning status' },
          },
        },
      },
      'cartographer-query': {
        description: 'Semantic codebase search via TF-IDF. Find files by meaning, not just name.',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Search text (natural language or keywords)' },
            n: { type: 'number', description: 'Number of results (default: 10)' },
          },
          required: ['query'],
        },
      },
      'cartographer-trace': {
        description: 'Find all files that reference a symbol (function, variable, class).',
        inputSchema: {
          type: 'object',
          properties: {
            symbol: { type: 'string', description: 'Symbol name to trace' },
          },
          required: ['symbol'],
        },
      },
      'cartographer-related': {
        description: 'Find files semantically related to a given file via TF-IDF cosine similarity.',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'File path relative to workspace' },
            n: { type: 'number', description: 'Number of results (default: 10)' },
          },
          required: ['path'],
        },
      },
      'logbook-status': {
        description: 'Show Logbook session memory state — current session, event count, healer actions.',
        inputSchema: { type: 'object', properties: {} },
      },
      'logbook-today': {
        description: 'Show today\'s auto-generated session log (markdown).',
        inputSchema: { type: 'object', properties: {} },
      },
    };
  }

  runPhos(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [PHOS_CLI, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('close', (code) => {
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(`phos ${args.join(' ')} failed (${code}): ${stderr.trim()}`));
      });
      child.on('error', reject);
    });
  }

  runBus(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [BUS_CLI, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.on('close', (code) => {
        if (code === 0) {
          try { resolve(JSON.parse(stdout.trim())); }
          catch { resolve({ raw: stdout.trim() }); }
        } else {
          reject(new Error(`bus ${args.join(' ')} failed (${code})`));
        }
      });
      child.on('error', reject);
    });
  }

  getSpoonState() {
    try {
      const data = JSON.parse(readFileSync('/home/p31/P31-local-workspace/spoon-state.json', 'utf-8'));
      const level = typeof data.level === 'number' ? data.level : 4;
      this.spoonState = level;
      return level;
    } catch {
      this.spoonState = 4;
      return 4;
    }
  }

  getNexusState() {
    const nexusPath = join(__dirname, '..', '..', 'scripts', 'nexus-daemon.py');
    return new Promise((resolve) => {
      const child = spawn('python3', [nexusPath, 'status'], {
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.on('close', () => {
        resolve({ content: [{ type: 'text', text: stdout.trim() || 'Nexus returned no output.' }] });
      });
      child.on('error', (err) => {
        resolve({ content: [{ type: 'text', text: `Nexus execution failed: ${err.message}` }] });
      });
    });
  }

  async callTool(name, args) {
    this.spoonState = this.getSpoonState();
    switch (name) {
      case 'phos-adopt': {
        const dryRun = args?.dry_run;
        const auto = this.spoonState <= 2 && !dryRun;
        const out = await this.runPhos(['adopt', ...(auto ? ['--dry-run'] : [])]);
        return {
          content: [{
            type: 'text',
            text: `[Cognitive Gate: Spoons at Level ${this.spoonState} | Force dry-run: ${auto}]\n\n${out}`,
          }],
        };
      }
      case 'phos-status': {
        const out = await this.runPhos(['status']);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'phos-classify': {
        if (!args?.path) throw new Error('Missing required param: path');
        const out = await this.runPhos(['classify', args.path]);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'phos-learn': {
        const target = args?.dir || '.';
        const out = await this.runPhos(['learn', target]);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'phos-rollback': {
        const count = args?.count ?? 1;
        const out = await this.runPhos(['rollback', String(count)]);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'phos-watch': {
        const out = await this.runPhos(['watch']);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'bus-emit': {
        if (!args?.type || !args?.payload) throw new Error('Missing required params: type, payload');
        const payload = JSON.stringify(args.payload);
        const out = await this.runBus(['emit', args.type, payload]);
        return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] };
      }
      case 'yardmaster-inspect': {
        return {
          content: [{
            type: 'text',
            text: `Yardmaster: scripts/p31-yardmaster.sh\nBus-instrumented: yes\nSpoon level: ${this.spoonState}`,
          }],
        };
      }
      case 'nexus-state': {
        return await this.getNexusState();
      }
      case 'phos-deploy': {
        const target = args.target;
        const force = args?.force || false;
        if (this.spoonState <= 2 && !force) {
          return {
            content: [{
              type: 'text',
              text: `[DEPLOYMENT BLOCKED] Cognitive Gate: Spoons at Level ${this.spoonState}. You are cognitively depleted. Deployment is locked to prevent production errors.`,
            }],
          };
        }
        this.runBus(['emit', 'phos.deploy_initiated', JSON.stringify({ target, spoons: this.spoonState, force })]);
        const out = await this.runPhos(['deploy', target]);
        return { content: [{ type: 'text', text: `[DEPLOY SUCCESS] Spoons: ${this.spoonState}\n\n${out}` }] };
      }
      case 'cognitive-state': {
        const out = await this.runCog(['state']);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'cognitive-estimate': {
        const out = await this.runCog(['estimate']);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'healer-remediate': {
        const out = await this.runHeal(['run']);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'jitterbug-run': {
        if (!args?.problem) throw new Error('Missing required param: problem');
        const { runJitterbug, getGatedConfig } = await import('./jitterbug.mjs');
        if (args?.dry_run) {
          const gated = getGatedConfig(args.factor || 4, args.depth || 3);
          return {
            content: [{ type: 'text', text: JSON.stringify({
              mode: 'DRY-RUN', problem: args.problem,
              requested: { factor: args.factor || 4, depth: args.depth || 3 },
              gated, estimatedCalls: gated.depth * (gated.factor + 1),
              status: gated.depth > 0 ? 'READY' : 'BLOCKED',
            }, null, 2) }],
          };
        }
        const result = await runJitterbug(args.problem, { factor: args.factor, depth: args.depth });
        if (result.error) throw new Error(result.error);
        return { content: [{ type: 'text', text: result.output }] };
      }
      case 'phos-aura': {
        const flags = [];
        if (args?.once) flags.push('--once');
        if (args?.share) {
          flags.push('--share');
          if (args?.output_path) flags.push(args.output_path);
        }
        if (args?.verbose) flags.push('--verbose');
        if (args?.compact) flags.push('--compact');
        const out = await this.runPhos(['aura', ...flags]);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'healer-log': {
        const out = await this.runHeal(['log', '10']);
        return { content: [{ type: 'text', text: out }] };
      }
      case 'reflex-status': {
        const { getStatus, getHistory } = await import('./reflex-arc.mjs');
        const s = getStatus();
        const hist = getHistory(args?.history || 5);
        const lines = [
          `Reflex Arc — Uptime: ${s.uptime_s}s | Ticks: ${s.ticks} | Window: ${s.window_size} | Spoon: ${s.spoon}/5 | Last event: ${s.last_event_ago_ms}ms ago`,
        ];
        for (const [id, p] of Object.entries(s.patterns)) {
          const mute = p.muted ? ' [MUTED]' : '';
          const cd = p.cooldown_remaining_ms > 0 ? ` (cooldown ${p.cooldown_remaining_ms}ms)` : '';
          lines.push(`  ${id}: ${p.label}${mute}${cd}`);
        }
        if (hist.length > 0) {
          lines.push('Recent firings:');
          for (const h of hist) {
            const status = h.permitted ? 'ALLOWED' : 'BLOCKED';
            const time = (h.timestamp || '').slice(11, 19) || '??:??';
            lines.push(`  ${time} ${h.label} sev:${h.severity?.toFixed(2)} ${status} → ${h.actions_taken?.join(', ') || 'none'}`);
          }
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'tide-status': {
        const { tide, getTideState } = await import('./tide.mjs');
        tide();
        const s = getTideState();
        if (!s) return { content: [{ type: 'text', text: 'Tide: no data yet (event bus empty)' }] };
        const lines = [
          `Tide — Temporal Pattern Learning`,
          `  Total events: ${s.temporal_model.total_events} | Window: ${s.temporal_model.window_events} events | Uptime: ${s.current.uptime_hours}h`,
          `  Current: hour ${s.current.hour_bin}:00, ${s.current.events_this_hour} events, ${s.current.errors_this_hour} errors, trend ${s.current.activity_trend}`,
          `  Peak: ${s.patterns.peak_activity_hour}:00 | Flow: ${s.patterns.peak_flow_hour}:00`,
        ];
        if (s.patterns.error_prone_hours.length > 0) lines.push(`  Error hours: ${s.patterns.error_prone_hours.map(h => h + ':00').join(', ')}`);
        if (s.patterns.silence_windows.length > 0) lines.push(`  Silence: ${s.patterns.silence_windows.map(w => w.start + ':00-' + w.end + ':00').join(', ')}`);
        if (s.patterns.cascade_precursors.length > 0) lines.push(`  Precursors: ${s.patterns.cascade_precursors.map(p => `${p.type} (${p.count}x)`).join(', ')}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'kappa-status': {
        const { learn, getWeights, getAdjustedDiagnostics } = await import('./kappa.mjs');
        if (args?.learn) learn();
        const w = getWeights();
        const samples = Object.keys(w.weights).map(id => ({ id, threshold: 0.8 }));
        const adj = getAdjustedDiagnostics(samples);
        const lines = [
          `Kappa — Outcome-Aware Learning`,
          `  Trials: ${w.total_trials || 0} | Last: ${w.last_update || 'never'}`,
        ];
        for (const d of adj) {
          const eff = (0.8 * d.kappa_mult).toFixed(2);
          lines.push(`  ${d.id.padEnd(22)} w:${d.kappa_weight.toFixed(2)} mult:${d.kappa_mult} eff:${eff}`);
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'cartographer-query': {
        if (!args?.query) throw new Error('Missing required param: query');
        const { query: cq } = await import('./cartographer.mjs');
        const results = cq(args.query, args?.n || 10);
        if (!results.length) return { content: [{ type: 'text', text: 'No matches found.' }] };
        const lines = [`Cartographer — "${args.query}"`];
        for (const r of results) {
          const ex = r.exports?.length ? ` [${r.exports.slice(0, 4).join(', ')}]` : '';
          lines.push(`  ${(r.score * 100).toFixed(0).padStart(2)}%  ${r.path}${ex}`);
        }
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'cartographer-trace': {
        if (!args?.symbol) throw new Error('Missing required param: symbol');
        const { traceSymbol: ts } = await import('./cartographer.mjs');
        const results = ts(args.symbol);
        if (!results.length) return { content: [{ type: 'text', text: `No references to "${args.symbol}" found.` }] };
        const lines = [`"${args.symbol}" — ${results.length} references`];
        for (const r of results) lines.push(`  ${r.path}  (${r.matches.join(', ')})`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'cartographer-related': {
        if (!args?.path) throw new Error('Missing required param: path');
        const { findRelated: fr } = await import('./cartographer.mjs');
        const results = fr(args.path, args?.n || 10);
        if (!results.length) return { content: [{ type: 'text', text: 'No related files found.' }] };
        const lines = [`Related to: ${args.path}`];
        for (const r of results) lines.push(`  ${(r.score * 100).toFixed(0).padStart(2)}%  ${r.path}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'logbook-status': {
        const { getLogbookState, listLogs } = await import('./logbook.mjs');
        const s = getLogbookState();
        const logs = listLogs();
        const sess = s.current_session;
        const lines = [`Logbook — ${logs.length} logs`];
        if (sess) {
          const elapsed = Date.now() - new Date(sess.start).getTime();
          const h = Math.floor(elapsed / 3600000);
          const m = Math.floor((elapsed % 3600000) / 60000);
          lines.push(`  Session ${sess.id}: ${h}h ${m}m, ${sess.events?._total || 0} events, ${sess.healer_actions?.length || 0} healer actions, ${sess.reflex_firings || 0} reflex firings`);
        } else { lines.push('  No active session'); }
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      }
      case 'logbook-today': {
        const { readLog } = await import('./logbook.mjs');
        const content = readLog();
        if (!content) return { content: [{ type: 'text', text: 'No log for today yet.' }] };
        return { content: [{ type: 'text', text: content }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  runCog(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [COG_ESTIMATOR, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('close', (code) => {
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(`cognitive-estimator ${args.join(' ')} failed (${code}): ${stderr.trim()}`));
      });
      child.on('error', reject);
    });
  }

  runHeal(args) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [SELF_HEALER, ...args], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '0' },
      });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => (stdout += d.toString()));
      child.stderr.on('data', (d) => (stderr += d.toString()));
      child.on('close', (code) => {
        if (code === 0) resolve(stdout.trim());
        else reject(new Error(`self-healer ${args.join(' ')} failed (${code}): ${stderr.trim()}`));
      });
      child.on('error', reject);
    });
  }

  async handleRequest(request) {
    if (request.method === 'initialize') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'phos-forge-mcp', version: '2.0.0' },
        },
      };
    }

    if (request.method === 'tools/list') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          tools: Object.entries(this.tools).map(([name, def]) => ({ name, ...def })),
        },
      };
    }

    if (request.method === 'tools/call') {
      const { name, arguments: args } = request.params;
      try {
        const result = await this.callTool(name, args);
        return { jsonrpc: '2.0', id: request.id, result };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true },
        };
      }
    }

    return { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: 'Method not found' } };
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = new PhosMCPServer();
  server.on('error', (err) => console.error('MCP Server error:', err));
  console.error('PHOS Forge MCP server ready (stdio transport)');
  console.error('Supports tools:', Object.keys(server.tools).join(', '));
  const chunks = [];
  process.stdin.on('data', (d) => chunks.push(d));
  process.stdin.on('end', async () => {
    const lines = Buffer.concat(chunks).toString().trim().split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const request = JSON.parse(line);
        const response = await server.handleRequest(request);
        if (response) process.stdout.write(JSON.stringify(response) + '\n');
      } catch (e) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' } }) + '\n');
      }
    }
  });
}
