import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

const DESIGN_MCP_PATH = '/home/p31/P31-local-workspace/cli/design-mcp-server.js';

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

function spawnDesignMcp() {
  return spawn('node', [DESIGN_MCP_PATH], { stdio: ['pipe', 'pipe', 'pipe'], cwd: '/home/p31/P31-local-workspace' });
}

describe('Design System MCP Server', () => {
  it('initializes with 2026-07-28 protocol', async () => {
    const proc = spawnDesignMcp();
    const res = await sendRPC(proc, 'initialize');
    expect(res.result.protocolVersion).toBe('2026-07-28');
    expect(res.result.serverInfo.name).toBe('p31-design-system');
    expect(res.result.serverInfo.version).toBe('1.0.0');
    proc.kill();
  }, 15000);

  it('lists all 8 tools', async () => {
    const proc = spawnDesignMcp();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/list');
    const names = res.result.tools.map((t) => t.name);
    expect(res.result.tools.length).toBe(8);
    expect(names).toContain('token_resolve');
    expect(names).toContain('token_list');
    expect(names).toContain('component_schema');
    expect(names).toContain('component_usage');
    expect(names).toContain('layout_generate');
    expect(names).toContain('validate_component');
    expect(names).toContain('audit_tokens');
    expect(names).toContain('suggest_fix');
    proc.kill();
  }, 15000);

  it('resolves a token', async () => {
    const proc = spawnDesignMcp();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'token_resolve',
      arguments: { path: 'primitive.color.cyan' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.path).toBe('primitive.color.cyan');
    expect(result.value).toBe('oklch(65% 0.18 195)');
    proc.kill();
  }, 15000);

  it('returns error for unknown tool', async () => {
    const proc = spawnDesignMcp();
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
