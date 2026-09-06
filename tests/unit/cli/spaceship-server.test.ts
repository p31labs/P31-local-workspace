import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { join } from 'path';
import { writeFileSync, mkdtempSync, readFileSync } from 'fs';

const SERVER_PATH = '/home/p31/P31-local-workspace/cli/spaceship-server.js';

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

describe('Spaceship MCP Server', () => {
  it('initializes correctly', async () => {
    const proc = spawnServer();
    const res = await sendRPC(proc, 'initialize');
    expect(res.result.protocolVersion).toBe('2026-07-28');
    expect(res.result.serverInfo.name).toBe('p31-spaceship');
    expect(res.result.serverInfo.version).toBe('1.0.0');
    proc.kill();
  }, 15000);

  it('lists 4 spaceship tools', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/list');
    const names = res.result.tools.map((t) => t.name);
    expect(names).toContain('duna_status');
    expect(names).toContain('system_health');
    expect(names).toContain('dome_structure');
    expect(names).toContain('neo_pixel_control');
    expect(names.length).toBe(4);
    proc.kill();
  }, 15000);

  it('returns the docking-dome structure facts', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'dome_structure', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.dome.layers).toBe(4);
    expect(result.dome.mode).toBe('docking-dome');
    expect(result.dome.radius).toBe(12);
    expect(result.dome.outerEdges).toBe(480);
    expect(result.dome.ports).toBe(120);
    expect(result.dome.neoPixelSegments).toBe(9600);
    expect(result.dome.tetraFrame).toBe(6);
    expect(result.dome.innerDome).toBe(true);
    proc.kill();
  }, 15000);

  it('returns DUNA status shape', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'duna_status', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(typeof result.members).toBe('number');
    expect(typeof result.target).toBe('number');
    expect(typeof result.progress).toBe('number');
    expect(typeof result.readiness).toBe('string');
    expect(result.active_ships).toBe(result.members);
    proc.kill();
  }, 15000);

  it('returns system health shape', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'system_health', {});
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.coherence).toBeGreaterThanOrEqual(0);
    expect(result.coherence).toBeLessThanOrEqual(1);
    expect(result.spoons).toBeGreaterThanOrEqual(0);
    expect(result.spoons).toBeLessThanOrEqual(5);
    expect(typeof result.mesh).toBe('string');
    proc.kill();
  }, 15000);

  it('persists neo_pixel_control to a scratch state file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'spaceship-state-'));
    const scratch = join(dir, 'spaceship-state.json');
    writeFileSync(scratch, JSON.stringify({ led: { mode: 'rainbow', speed: 5, color: '#22d3ee', brightness: 80 } }));
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'neo_pixel_control', {
      mode: 'breath',
      brightness: 55,
      file: scratch,
    });
    const result = parseResult(res);
    expect(result.status).toBe('ok');
    expect(result.persisted).toBe(true);
    expect(result.led.mode).toBe('breath');
    expect(result.led.brightness).toBe(55);
    const onDisk = JSON.parse(readFileSync(scratch, 'utf-8'));
    expect(onDisk.led.mode).toBe('breath');
    expect(onDisk.led.brightness).toBe(55);
    proc.kill();
  }, 15000);

  it('rejects invalid neo_pixel_control values', async () => {
    const proc = spawnServer();
    await sendRPC(proc, 'initialize');
    const res = await tool(proc, 'neo_pixel_control', {
      mode: 'strobe-not-a-mode',
      speed: 99,
      color: 'not-a-color',
    });
    const result = parseResult(res);
    expect(result.status).toBe('error');
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
    expect(result.message).toContain('mode');
    expect(result.message).toContain('speed');
    expect(result.message).toContain('color');
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
