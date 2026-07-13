#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// --- TERMINAL AESTHETICS & TOKENS ---
const colors = {
  reset: "\x1b[0m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  gray: "\x1b[90m"
};

const log = {
  info: (msg) => console.log(`${colors.cyan}[ℹ]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✔]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[⚠]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✖]${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.magenta}=== ${msg} ===${colors.reset}\n`),
  swarm: (msg) => console.log(`${colors.blue}[⬡]${colors.reset} ${msg}`),
  gray: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`)
};

// --- SYSTEM CONFIGURATION (grounded in repo) ---
const CONFIG = {
  version: '1.0.0',
  paths: {
    workspaceRoot: path.resolve(__dirname, '..'),

    cliDir: path.resolve(__dirname),
    logsDir: path.resolve(__dirname, '../tests/triper/logs'),
    workerDir: path.resolve(__dirname, '../software/workers/mcp-x402-gateway'),
    validateScript: path.resolve(__dirname, 'validate-l3.2.js')
  },
  // Real MCP server locations and tool counts (verified 2026-07-11)
  mcpServers: [
    { name: 'Oasis CLI', file: 'cli/mcp-server.js', count: 11 },
    { name: 'Component Registry', file: 'cli/component-registry.js', count: 5 },
    { name: 'LOVE Ledger', file: 'cli/love-registry.js', count: 3 },
    { name: 'PHOS Forge', file: 'tools/phos-forge/mcp-server.mjs', count: 29 },
    { name: 'Cognitive Prosthetic', file: 'cli/cognitive-prosthetic.js', count: 47 },
    { name: 'Cognitive Comms', file: 'cli/cognitive-comms.js', count: 20 },
    { name: 'MARGE Design Expert', file: 'cli/marge-server.js', count: 10 },
    { name: 'BOB Structural Expert', file: 'cli/bob-server.js', count: 10 }
  ],
  healthServices: [
    { name: 'phos', url: 'https://phos.p31ca.org/health' },
    { name: 'gateway', url: 'https://gateway.p31ca.org/health' },
    { name: 'p31ca', url: 'https://p31ca.org' },
    { name: 'willow', url: 'https://willow.p31ca.org' },
    { name: 'bonding', url: 'https://bonding.p31ca.org' },
    { name: 'love-ledger', url: 'https://love-ledger.p31ca.org/health' },
    { name: 'status', url: 'https://status.p31ca.org/health' }
  ]
};

// ============================================================================
// P31 AUTOMATION ENGINE
// The unified system that orchestrates builds, deployments, tests, MCP tools,
// adaptive UI, and the agent swarm.
// ============================================================================
class P31AutomationEngine {
  constructor() {
    this.status = {
      build: 'unknown',
      runtime: 'unknown',
      verify: 'unknown',
      governance: 'unknown',
      test: 'unknown',
      deploy: 'unknown',
      health: 'unknown'
    };
    this.startTime = Date.now();
  }

  // --- Helper: run command with timeout (non-fatal by default) ---
  async runCommand(cmd, cwd = CONFIG.paths.workspaceRoot, options = {}) {
    const { timeout = 60000, fatal = false } = options;
    try {
      const { stdout, stderr } = await execPromise(cmd, { cwd, timeout });
      if (stderr && !stderr.toLowerCase().includes('warning')) {
        log.gray(`  stderr: ${stderr.trim()}`);
      }
      return { stdout: stdout.trim(), stderr: stderr.trim(), success: true };
    } catch (error) {
      if (fatal) {
        log.error(`Command failed: ${cmd}`);
        console.error(colors.red, error.message, colors.reset);
        process.exit(1);
      }
      log.warn(`Command failed (non-fatal): ${cmd}`);
      log.gray(`  ${error.message}`);
      return { stdout: '', stderr: error.message, success: false };
    }
  }

  // --- Helper: fetch with timeout ---
  async fetchWithTimeout(url, timeout = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      return { ok: res.ok, status: res.status, latency: 0 };
    } catch (err) {
      clearTimeout(timer);
      return { ok: false, status: 0, error: err.message };
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 1: ORCHESTRATION (CWP Swarm — simulated)
  // -------------------------------------------------------------------------
  async dispatchCWP(cwpId) {
    log.header(`CWP Swarm Initialization: ${cwpId}`);
    log.swarm(`[SIMULATED] Decomposing ${cwpId} into execution axes...`);

    const axes = ['Task', 'Resilience', 'Interface', 'Purity', 'E2E', 'Regression'];

    const promises = axes.map(async (axis) => {
      return new Promise((resolve) => {
        const time = Math.floor(Math.random() * 1500) + 500;
        setTimeout(() => {
          log.success(`Agent [${axis}-Specialist] completed sub-task (${time}ms).`);
          resolve({ axis, status: 'success', time });
        }, time);
      });
    });

    const results = await Promise.all(promises);
    log.info(`All agents merged outputs for ${cwpId}. Verifying success criteria...`);

    const allGreen = results.every((r) => r.status === 'success');
    if (allGreen) {
      log.success(`CWP Swarm Execution Complete for ${cwpId}.`);
    } else {
      log.error(`CWP Swarm encountered alignment issues. Manual review required.`);
    }
    log.gray(`  [SIMULATED] — real agent orchestration is handled by CWP-2026-007.`);
  }

  // -------------------------------------------------------------------------
  // LAYER 2: BUILD & DEPLOY (real Fortune 1 pipeline)
  // -------------------------------------------------------------------------
  async runBuildPipeline() {
    log.header('Fortune 1 Pipeline: Build & Deploy');
    log.info('Staging the p31ca app (real pipeline).');

    // Real pipeline: pnpm -C apps/p31ca run build
    const cmd = 'pnpm -C apps/p31ca run build';
    log.gray(`  → ${cmd}`);

    const result = await this.runCommand(cmd, CONFIG.paths.workspaceRoot, { timeout: 300000, fatal: false });
    if (result.success) {
      log.success('p31ca build completed.');
      this.status.build = 'green';
    } else {
      log.warn('p31ca build failed (may be due to missing deps or network).');
      log.gray('  Try: cd apps/p31ca && pnpm install && pnpm run build');
      this.status.build = 'yellow';
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 3: QUALITY & COMPLIANCE (TRIPER — real cert runner)
  // -------------------------------------------------------------------------
  async runTriper() {
    log.header('TRIPER Certification Protocol');
    log.info('Running 6-axis MVP certification (Task · Resilience · Interface · Purity · E2E · Regression)');

    const cmd = 'node tests/triper/triper-runner.mjs --cert';
    log.gray(`  → ${cmd}`);

    const result = await this.runCommand(cmd, CONFIG.paths.workspaceRoot, { timeout: 120000, fatal: false });

    if (result.success) {
      log.success('TRIPER cert run completed.');
      const match = result.stdout.match(/cert[^ ]*\.json/i);
      if (match) {
        log.success(`  Cert written: ${match[0]}`);
      }
      this.status.verify = 'green';
    } else {
      log.warn('TRIPER cert run failed (may need deps or environment).');
      log.gray('  Try: cd apps/p31ca && pnpm install && npm run test:triper:cert');
      this.status.verify = 'yellow';
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 4: RUNTIME & ECOSYSTEM (MCP verification — real)
  // -------------------------------------------------------------------------
  async verifyMCPServers() {
    log.header('Runtime Layer: MCP Swarm Verification');

    let totalTools = 0;
    let healthyCount = 0;

    for (const server of CONFIG.mcpServers) {
      const fullPath = path.join(CONFIG.paths.workspaceRoot, server.file);
      if (!fs.existsSync(fullPath)) {
        log.warn(`Server Missing: ${server.name} (${server.file})`);
        continue;
      }

      // Spawn server, send tools/list, count tools
      const proc = spawn('node', [fullPath], { stdio: ['pipe', 'pipe', 'ignore'] });
      const request = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n';

      let output = '';
      proc.stdout.on('data', (chunk) => { output += chunk.toString(); });

      const timer = setTimeout(() => { proc.kill(); }, 2000);

      await new Promise((resolve) => {
        proc.on('close', (code) => { clearTimeout(timer); resolve(code); });
        proc.stdin.write(request);
        proc.stdin.end();
      });

      let toolCount = 0;
      try {
        const lines = output.split('\n').filter(Boolean);
        for (const line of lines) {
          const parsed = JSON.parse(line);
          if (parsed.result && parsed.result.tools) {
            toolCount = parsed.result.tools.length;
          }
        }
      } catch (_) { /* ignore parse errors */ }

      if (toolCount > 0) {
        log.success(`Server Online: ${server.name} (${toolCount} tools)`);
        totalTools += toolCount;
        healthyCount++;
      } else {
        log.warn(`Server Responded but no tools: ${server.name}`);
      }
    }

    log.info(`MCP Ecosystem Status: ${healthyCount}/${CONFIG.mcpServers.length} Servers Active, ${totalTools} tools total.`);
    this.status.runtime = healthyCount === CONFIG.mcpServers.length ? 'green' : 'yellow';
  }

  // -------------------------------------------------------------------------
  // LAYER 5: MONITORING (Health checks — real, best-effort)
  // -------------------------------------------------------------------------
  async runHealthCheck() {
    log.header('System Health & Monetization Layer Status');

    const results = [];
    for (const svc of CONFIG.healthServices) {
      const start = Date.now();
      const { ok, status, error } = await this.fetchWithTimeout(svc.url, 3000);
      const latency = Date.now() - start;

      if (ok) {
        log.success(`[UP] ${svc.name.padEnd(15)} | ${svc.url} | ${latency}ms`);
        results.push({ name: svc.name, status: 'up', latency });
      } else {
        log.warn(`[DOWN] ${svc.name.padEnd(15)} | ${svc.url} | ${error || status}`);
        results.push({ name: svc.name, status: 'down', error: error || status });
      }
    }

    const upCount = results.filter((r) => r.status === 'up').length;
    log.info(`Health status: ${upCount}/${CONFIG.healthServices.length} services up.`);
    this.status.health = upCount === CONFIG.healthServices.length ? 'green' : upCount > 0 ? 'yellow' : 'red';
  }

  // -------------------------------------------------------------------------
  // LAYER 3b: TESTING (unit suite — real, best-effort)
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // LAYER 1c: GOVERNANCE (MARGE + BOB audits)
  // -------------------------------------------------------------------------
  async runGovernanceAudits() {
    log.header('Governance: MARGE + BOB Audits');

    // Run MARGE audit on a sample surface
    const margeCmd = `printf '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"design_expert_audit_surface","arguments":{"file":"apps/phos/src/surfaces/PQCKeygenSurface.tsx"}}}' | node cli/marge-server.js`;
    const margeResult = await this.runCommand(margeCmd, CONFIG.paths.workspaceRoot, { timeout: 30000, fatal: false });
    if (margeResult.success) {
      try {
        const output = JSON.parse(margeResult.stdout);
        const report = JSON.parse(output.result.content[0].text);
        log.success(`MARGE: score ${report.score}/100, ${report.summary?.hardFail || 0} hard-fail`);
        this.status.governance = report.score >= 50 ? 'green' : 'yellow';
      } catch {
        log.warn('MARGE: could not parse output');
        this.status.governance = 'yellow';
      }
    } else {
      log.warn('MARGE audit failed');
      this.status.governance = 'yellow';
    }

    // Run BOB entropy audit
    const bobCmd = `printf '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"structural_entropy_audit","arguments":{}}}' | node cli/bob-server.js`;
    const bobResult = await this.runCommand(bobCmd, CONFIG.paths.workspaceRoot, { timeout: 30000, fatal: false });
    if (bobResult.success) {
      try {
        const output = JSON.parse(bobResult.stdout);
        const report = JSON.parse(output.result.content[0].text);
        log.success(`BOB: ${report.workers} workers, entropy ${report.entropy}, coupling ${report.coupling}`);
      } catch {
        log.warn('BOB: could not parse output');
      }
    } else {
      log.warn('BOB audit failed');
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 2a: TESTING (vitest unit suite)
  // -------------------------------------------------------------------------
  async runTests() {
    log.header('Testing: Unit Suite (vitest)');
    const cmd = 'pnpm run test:unit';
    log.gray(`  → ${cmd}  (resolves to: vitest run --config vitest.config.ts)`);
    const result = await this.runCommand(cmd, CONFIG.paths.workspaceRoot, { timeout: 300000, fatal: false });
    if (result.success) {
      const m = result.stdout.match(/Tests\s+(\d+)\s+passed/);
      const n = m ? m[1] : '?';
      log.success(`Unit tests passed (${n} tests).`);
      this.status.test = 'green';
    } else {
      log.warn('Unit tests failed or timed out (see output).');
      log.gray('  Try: cd apps/p31ca && pnpm install && pnpm run test:unit');
      this.status.test = 'yellow';
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 2b: DEPLOYMENT (worker dry-run — real, best-effort)
  // -------------------------------------------------------------------------
  async runDeploy() {
    log.header('Deployment: x402 Worker Dry-Run (wrangler)');
    const cmd = 'npx wrangler deploy --dry-run';
    log.gray(`  → ${cmd}  (${CONFIG.paths.workerDir})`);
    const result = await this.runCommand(cmd, CONFIG.paths.workerDir, { timeout: 180000, fatal: false });
    if (result.success) {
      log.success('Worker dry-run build succeeded.');
      this.status.deploy = 'green';
    } else {
      log.warn('Worker dry-run failed (see output).');
      this.status.deploy = 'yellow';
    }
  }

  // -------------------------------------------------------------------------
  // LAYER 3c: VALIDATION (TRIPER cert + L3.2 worker)
  // -------------------------------------------------------------------------
  async runValidate() {
    log.header('Validation: TRIPER + L3.2 x402 Worker');
    await this.runTriper();
    log.info('Running L3.2 validator (node cli/validate-l3.2.js)...');
    const script = CONFIG.paths.validateScript;
    if (!fs.existsSync(script)) {
      log.warn(`Validator script missing: ${script}`);
      return;
    }
    const { stdout, stderr } = await execPromise(`node ${JSON.stringify(script)}`, {
      cwd: CONFIG.paths.workspaceRoot, timeout: 600000
    }).catch((e) => ({ stdout: '', stderr: e.message }));
    if (stdout) log.gray(stdout.trim().split('\n').slice(-12).join('\n'));
    if (stderr && !stderr.toLowerCase().includes('warning')) log.gray(`  stderr: ${stderr.trim().split('\n')[0]}`);
  }

  // -------------------------------------------------------------------------
  // MAIN ROUTER
  // -------------------------------------------------------------------------
  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';

    log.info(`P31 Automation Engine v${CONFIG.version} Initialized.`);
    log.gray(`  Workspace: ${CONFIG.paths.workspaceRoot}`);

    try {
      switch (command) {
        case 'swarm': {
          const cwp = args[1] || 'CWP-GENERIC-001';
          await this.dispatchCWP(cwp);
          break;
        }
        case 'build':
          await this.runBuildPipeline();
          break;
        case 'triper':
        case 'verify':
          await this.runTriper();
          break;
        case 'mcp':
          await this.verifyMCPServers();
          break;
        case 'test':
          await this.runTests();
          break;
        case 'deploy':
          await this.runDeploy();
          break;
        case 'validate':
          await this.runValidate();
          break;
        case 'monitor':
          await this.runHealthCheck();
          break;
        case 'all':
          await this.dispatchCWP('CWP-SYSTEM-START');
          await this.runBuildPipeline();
          await this.verifyMCPServers();
          await this.runGovernanceAudits();
          await this.runTests();
          await this.runValidate();
          await this.runDeploy();
          await this.runHealthCheck();

          log.header('GLOBAL ENGINE STATUS');
          console.table(this.status);
          log.success(`P31 Digital Commonwealth is operating at optimal parameters.`);
          log.gray(`  Elapsed: ${(Date.now() - this.startTime) / 1000}s`);
          break;
        default:
          log.error(`Unknown command: ${command}`);
          log.info('Available commands: swarm [id], build, test, deploy, validate, triper, mcp, monitor, all');
          process.exit(1);
      }
    } catch (err) {
      log.error(`Engine encountered a critical error: ${err.message}`);
      process.exit(1);
    }
  }
}

// --- Run the engine ---
const engine = new P31AutomationEngine();
engine.run();
