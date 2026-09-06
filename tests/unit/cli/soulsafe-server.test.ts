import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

const SERVER_PATH = '/home/p31/P31-local-workspace/cli/soulsafe-server.js';

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

function spawnServer() {
  const proc = spawn('node', [SERVER_PATH], { stdio: ['pipe', 'pipe', 'pipe'], cwd: '/home/p31/P31-local-workspace' });
  return proc;
}

function tool(proc, name, arguments_) {
  return sendRPC(proc, 'tools/call', { name, arguments: arguments_ || {} });
}

function parseResult(res) {
  return JSON.parse(res.result.content[0].text);
}

describe('SOULSAFE MCP Server', () => {
  it('initializes correctly', async () => {
    const proc = spawnServer();
    const res = await sendRPC(proc, 'initialize');
    expect(res.result.protocolVersion).toBe('2026-07-28');
    expect(res.result.serverInfo.name).toBe('p31-soulsafe');
    expect(res.result.serverInfo.version).toBe('2.0.0');
    expect(res.result.serverInfo.upgraded).toBe(true);
    proc.kill();
  }, 15000);

  it('lists 14 protocol tools', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/list');
    const names = res.result.tools.map(t => t.name);
    expect(names).toContain('soulsafe_tagout');
    expect(names).toContain('soulsafe_redboard_detect');
    expect(names).toContain('soulsafe_zero_work');
    expect(names).toContain('soulsafe_oqe_classify');
    expect(names).toContain('soulsafe_gate1_self_review');
    expect(names).toContain('soulsafe_gate2_cross_review');
    expect(names).toContain('soulsafe_gate3_full');
    expect(names).toContain('soulsafe_run_protocol');
    expect(names.length).toBe(14);
    proc.kill();
  }, 15000);

  it('tags out to the owning expert for a surface', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_tagout', { task: 'fix care score layout', surface: 'apps/phos/src/pages/DashboardPage.tsx', agent: 'sandbox-artisan' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.owning_expert).toBe('home-guardian');
    expect(result.response).toContain('Tagging out');
    proc.kill();
  }, 15000);

  it('detects Red Board burnout from signals', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_redboard_detect', { text: 'quality declining, many typos', signals: { latencyMs: 90000 } });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.detected.some(d => d.mode === 'burnout')).toBe(true);
    expect(result.detected[0].response).toContain('Halt');
    proc.kill();
  }, 15000);

  it('classifies zero-work statements as hazardous', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_zero_work', { statement: "It'll work out." });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.hazardous).toBe(true);
    expect(result.classification).toBe('zero-work hazard');
    expect(typeof result.replacement).toBe('string');
    proc.kill();
  }, 15000);

  it('classifies OQE evidence for source code claims', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_oqe_classify', { claim: 'Care score formula is at DashboardPage.tsx:66-72' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.category).toBe('Source Code');
    expect(result.traceable).toBe(true);
    proc.kill();
  }, 15000);

  it('grades critical severity with deploy block', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_severity', { finding: 'verify gate fails: secret leak in logs' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.severity).toBe('critical');
    expect(result.table.action).toBe('Blocks deploy; halt');
    proc.kill();
  }, 15000);

  it('looks up protocol policy sections', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_policy', { section: 'zero_work' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.found).toBe(true);
    expect(result.content).toContain('system hazards');
    proc.kill();
  }, 15000);

  it('gate 1 returns a self-review checklist with OQE', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_gate1_self_review', { change: 'add contrast fix', claims: ['contrast now 7:1'] });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.gate).toBe(1);
    expect(Array.isArray(result.checklist)).toBe(true);
    expect(result.claims[0].oqe.category).toBeDefined();
    proc.kill();
  }, 15000);

  it('gate 2 enforces the information barrier', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_gate2_cross_review', { change: 'add contrast fix', reviewer: 'bob', generatorConfidence: 0.99 });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.informationBarrier).toBe(true);
    expect(result.generatorConfidenceStripped).toBe(true);
    expect(result.note).toContain('discarded');
    proc.kill();
  }, 15000);

  it('gate 3 returns the full verify checklist', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_gate3_full', { change: 'add contrast fix' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.gate).toBe(3);
    expect(result.runTwice).toBe(true);
    expect(result.verifyChecklist.length).toBeGreaterThanOrEqual(5);
    expect(result.blockingRule).toContain('blocks deployment');
    proc.kill();
  }, 15000);

  it('runs the full 3-gate protocol with a deploy verdict', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_run_protocol', { change: 'fix spacing on dashboard card', surface: 'apps/phos/src/pages/DashboardPage.tsx' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.gates).toHaveLength(3);
    expect(result.verdict).toMatch(/CLEARED|BLOCKED/);
    proc.kill();
  }, 15000);

  it('lists crew agents from the manifest', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_manifest', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.count).toBeGreaterThanOrEqual(1);
    expect(result.agents.map(a => a.name)).toContain('soulsafe-architect');
    proc.kill();
  }, 15000);

  it('checks competence boundary for an agent', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_competence_check', { agent: 'home-guardian', surface: 'apps/phos/src/pages/DashboardPage.tsx' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.in_lane).toBe(true);
    proc.kill();
  }, 15000);

  it('reports toolchain invariants', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'soulsafe_verify_invariants', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.count).toBeGreaterThanOrEqual(4);
    proc.kill();
  }, 15000);

  it('responds to ping and errors on unknown tool', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const pong = await sendRPC(proc, 'ping');
    expect(pong.result).toBeDefined();
    const err = await tool(proc, 'nonexistent_tool', {});
    expect(err.error).toBeDefined();
    expect(err.error.code).toBe(-32602);
    proc.kill();
  }, 15000);
});
