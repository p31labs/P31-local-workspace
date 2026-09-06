import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, mkdtempSync, readFileSync } from 'fs';

const SERVER_PATH = '/home/p31/P31-local-workspace/cli/ground-truth-server.js';

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

describe('Ground-Truth MCP Server', () => {
  it('initializes correctly', async () => {
    const proc = spawnServer();
    const res = await sendRPC(proc, 'initialize');
    expect(res.result.protocolVersion).toBe('2026-07-28');
    expect(res.result.serverInfo.name).toBe('p31-ground-truth');
    expect(res.result.serverInfo.version).toBe('2.0.0');
    expect(res.result.serverInfo.upgraded).toBe(true);
    proc.kill();
  }, 15000);

  it('lists 14 registry tools', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/list');
    const names = res.result.tools.map(t => t.name);
    expect(names).toContain('truth_lookup');
    expect(names).toContain('truth_file_map');
    expect(names).toContain('truth_verify_baseline');
    expect(names).toContain('truth_register_fact');
    expect(names).toContain('truth_health');
    expect(names.length).toBe(14);
    proc.kill();
  }, 15000);

  it('looks up a verified fact by key', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_lookup', { key: 'care-score-formula' });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.found).toBe(true);
    expect(result.fact.key).toBe('care-score-formula');
    expect(result.fact.verified).toBe(true);
    proc.kill();
  }, 15000);

  it('returns the canonical file map', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_file_map', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.real.identity).toBe('src/lib/identity.ts');
    expect(Array.isArray(result.hallucinated)).toBe(true);
    proc.kill();
  }, 15000);

  it('returns toolchain invariants', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_invariants', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.count).toBeGreaterThanOrEqual(4);
    expect(result.invariants.join(' ')).toContain('direct binaries');
    proc.kill();
  }, 15000);

  it('returns care-score formula and weights', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_care_score', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.weights.spoons).toBe(40);
    expect(result.formula).toContain('spoons');
    proc.kill();
  }, 15000);

  it('returns design tokens and layout gates', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const tok = parseResult(await tool(proc, 'truth_design_tokens', {}));
    expect(tok.status).toBe('ok');
    expect(tok.tokens.headerHeight).toBe('61px');
    const layout = parseResult(await tool(proc, 'truth_layout_gates', {}));
    expect(layout.status).toBe('ok');
    expect(layout.layout.dashboardGrid).toContain('3-column');
    proc.kill();
  }, 15000);

  it('reports verify baseline and known flakes', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_verify_baseline', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.runTwice).toBe(true);
    expect(result.baseline).toContain('186');
    expect(Array.isArray(result.knownFlakes)).toBe(true);
    proc.kill();
  }, 15000);

  it('registers a fact into a scratch registry (paid write)', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'truth-reg-'));
    const scratch = join(dir, 'ground-truth.json');
    writeFileSync(scratch, JSON.stringify({ $schema: 'p31-ground-truth-1.0', facts: [] }));
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_register_fact', {
      key: 'test-fact',
      claim: 'Test claim is verified',
      evidence: 'Source Code',
      citation: 'src/test.ts:1',
      file: scratch,
    });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.persisted).toBe(true);
    expect(result.factCount).toBe(1);
    const onDisk = JSON.parse(readFileSync(scratch, 'utf-8'));
    expect(onDisk.facts[0].key).toBe('test-fact');
    expect(onDisk.facts[0].verified).toBe(true);
    proc.kill();
  }, 15000);

  it('rejects duplicate fact keys', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'truth-dup-'));
    const scratch = join(dir, 'ground-truth.json');
    writeFileSync(scratch, JSON.stringify({ $schema: 'p31-ground-truth-1.0', facts: [{ key: 'dup', claim: 'x', evidence: 'y', citation: 'z', verified: true }] }));
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_register_fact', {
      key: 'dup',
      claim: 'x',
      evidence: 'y',
      citation: 'z',
      file: scratch,
    });
    const result = parseResult(res);
    expect(result.status).toBe('error');
    expect(result.error).toContain('already exists');
    proc.kill();
  }, 15000);

  it('returns the full facts list', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_facts', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.count).toBeGreaterThanOrEqual(6);
    proc.kill();
  }, 15000);

  it('returns canonical root paths', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_paths', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.paths.agentsRoot).toContain('p31-agents');
    proc.kill();
  }, 15000);

  it('reports registry health', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'truth_health', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.sections_present).toBe(10);
    expect(result.missing_sections).toEqual([]);
    expect(result.healthy).toBe(true);
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
