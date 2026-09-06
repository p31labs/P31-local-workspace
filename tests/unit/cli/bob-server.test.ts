import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { resolve } from 'path';

const BOB_PATH = '/home/p31/P31-local-workspace/cli/bob-server.js';

function sendRPC(proc, method, params = {}) {
  return new Promise((res, rej) => {
    const req = { jsonrpc: '2.0', id: Date.now(), method, params };
    let buffer = '';
    const timeout = setTimeout(() => {
      rej(new Error('Timeout waiting for response'));
    }, 15000);
    proc.stdout.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.id === req.id) {
            clearTimeout(timeout);
            res(parsed);
            return;
          }
        } catch {}
      }
    });
    proc.stderr.on('data', () => {});
    proc.stdin.write(JSON.stringify(req) + '\n');
  });
}

function spawnBob() {
  const proc = spawn('node', [BOB_PATH], { stdio: ['pipe', 'pipe', 'pipe'], cwd: '/home/p31/P31-local-workspace' });
  return proc;
}

describe('BOB MCP Server', () => {
  it('initializes correctly', async () => {
    const proc = spawnBob();
    const res = await sendRPC(proc, 'initialize');
    expect(res.result.protocolVersion).toBe('2026-07-28');
    expect(res.result.serverInfo.name).toBe('p31-bob');
    expect(res.result.serverInfo.version).toBe('2.0.0');
    expect(res.result.serverInfo.upgraded).toBe(true);
    proc.kill();
  }, 15000);

  it('lists all upgraded tools', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/list');
    const names = res.result.tools.map(t => t.name);
    expect(names).toContain('structural_entropy_audit');
    expect(names).toContain('structural_k4_entropy_audit');
    expect(names).toContain('structural_feedback_health');
    expect(names).toContain('structural_edge_adapt');
    expect(names).toContain('structural_plasma_history');
    expect(names.length).toBeGreaterThanOrEqual(14);
    proc.kill();
  }, 15000);

  it('performs structural entropy audit', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_entropy_audit',
      arguments: {},
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.entropy).toBe('number');
    expect(typeof result.coupling).toBe('number');
    expect(typeof result.cohesion).toBe('number');
    expect(Array.isArray(result.cycles)).toBe(true);
    expect(Array.isArray(result.isolated)).toBe(true);
    expect(result.k4Invariant).toBeDefined();
    proc.kill();
  }, 15000);

  it('includes K4 tetrahedral invariant in entropy audit', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_entropy_audit',
      arguments: {},
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.k4Invariant.vertices).toBe(4);
    expect(result.k4Invariant.edges).toBe(6);
    expect(typeof result.k4Invariant.isComplete).toBe('boolean');
    expect(typeof result.k4Invariant.isPlanar).toBe('boolean');
    proc.kill();
  }, 15000);

  it('generates service call graph in mermaid format', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'service_call_graph_visualise',
      arguments: { format: 'mermaid' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.format).toBe('mermaid');
    expect(typeof result.graph).toBe('string');
    expect(result.graph).toContain('graph TD');
    proc.kill();
  }, 15000);

  it('generates service call graph in dot format', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'service_call_graph_visualise',
      arguments: { format: 'dot' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.format).toBe('dot');
    expect(typeof result.graph).toBe('string');
    expect(result.graph).toContain('digraph');
    proc.kill();
  }, 15000);

  it('detects schema drift with PLASMA history', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'schema_drift_detect',
      arguments: {},
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.tables).toBe('number');
    expect(Array.isArray(result.drift)).toBe(true);
    expect(typeof result.plasmaEvents).toBe('number');
    proc.kill();
  }, 15000);

  it('retrieves PLASMA schema mutation history', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    // First trigger some schema drift to populate history
    await sendRPC(proc, 'tools/call', { name: 'schema_drift_detect', arguments: {} });
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_plasma_history',
      arguments: { limit: 5 },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.events)).toBe(true);
    expect(typeof result.totalEvents).toBe('number');
    expect(typeof result.canUndo).toBe('boolean');
    proc.kill();
  }, 15000);

  it('audits MCP contract surfaces', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'contract_surface_audit',
      arguments: {},
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.servers).toBe('number');
    expect(typeof result.tools).toBe('number');
    expect(Array.isArray(result.details)).toBe(true);
    proc.kill();
  }, 15000);

  it('validates known state machines', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'state_machine_validate',
      arguments: { state_machine: 'care_contract' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.state_machine).toBe('care_contract');
    expect(result.valid).toBe(true);
    expect(result.states.length).toBeGreaterThan(0);
    proc.kill();
  }, 15000);

  it('lists all known state machines', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'state_machine_validate',
      arguments: {},
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.known_machines)).toBe(true);
    expect(result.known_machines.length).toBeGreaterThanOrEqual(3);
    proc.kill();
  }, 15000);

  it('audits configuration topology', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'configuration_topology_audit',
      arguments: {},
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.workers).toBe('number');
    expect(typeof result.d1Databases).toBe('number');
    expect(Array.isArray(result.crons)).toBe(true);
    proc.kill();
  }, 15000);

  it('suggests structural fixes', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_suggest_fix',
      arguments: { violation_id: 'S-001' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.suggestion).toBeDefined();
    expect(typeof result.suggestion).toBe('string');
    proc.kill();
  }, 15000);

  it('performs structural reshape dry-run', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_reshape',
      arguments: { file: 'wrangler.toml', dryRun: true },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('error');
    expect(result.error).toContain('not found');
    proc.kill();
  }, 15000);

  it('detects dependency bumps', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'dependency_bump_detect',
      arguments: { package: 'react' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.affected)).toBe(true);
    proc.kill();
  }, 15000);

  it('generates structural health report in markdown', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_report_generate',
      arguments: { format: 'markdown' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.format).toBe('markdown');
    expect(typeof result.report).toBe('string');
    expect(result.report).toContain('Structural Health Report');
    proc.kill();
  }, 45000);

  it('generates structural health report in JSON', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_report_generate',
      arguments: { format: 'json' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.format).toBe('json');
    expect(result.entropy).toBeDefined();
    expect(result.k4).toBeDefined();
    proc.kill();
  }, 45000);

  it('performs K4 entropy audit', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_k4_entropy_audit',
      arguments: {},
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.k4).toBeDefined();
    expect(typeof result.k4.tetrahedrality).toBe('number');
    expect(typeof result.recommendation).toBe('string');
    proc.kill();
  }, 15000);

  it('tracks feedback health', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_feedback_health',
      arguments: { currentEntropy: 0.2, currentCoupling: 0.3 },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.feedback).toBeDefined();
    expect(typeof result.trend).toBe('string');
    expect(['improving', 'degrading']).toContain(result.trend);
    proc.kill();
  }, 15000);

  it('provides edge adaptation recommendations', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'structural_edge_adapt',
      arguments: { entropy: 0.5, coupling: 0.6, driftIssues: 3 },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(typeof result.spoons).toBe('number');
    expect(typeof result.motion).toBe('string');
    proc.kill();
  }, 15000);

  it('responds to ping', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'ping');
    expect(res.result).toBeDefined();
    proc.kill();
  }, 15000);

  it('returns error for unknown tool', async () => {
    const proc = spawnBob();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'nonexistent_tool',
      arguments: {},
    });
    expect(res.error).toBeDefined();
    expect(res.error.code).toBe(-32602);
    proc.kill();
  }, 15000);
});
