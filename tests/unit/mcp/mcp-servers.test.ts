import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import { join } from 'path';

const ROOT = process.cwd();

// ─── Helpers ────────────────────────────────────────────────────────────

function sendRPC(proc: ChildProcess, method: string, params: Record<string, unknown> = {}) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timeout waiting for ${method}`)), 8000);
    let buf = '';
    const onData = (chunk: Buffer) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.id !== undefined) {
            clearTimeout(timeout);
            proc.stdout!.off('data', onData);
            resolve(msg);
          }
        } catch { /* not JSON yet */ }
      }
    };
    proc.stdout!.on('data', onData);
    proc.stdin!.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) + '\n');
  });
}

function spawnServer(scriptPath: string): ChildProcess {
  return spawn('node', [scriptPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0', NODE_NO_WARNINGS: '1' },
  });
}

function killQuietly(proc: ChildProcess) {
  try { proc.kill(); } catch { /* already dead */ }
}

// ─── PHOS Forge MCP (batch stdin mode — one proc per test) ──────────────

describe('PHOS Forge MCP', () => {
  async function callOnce(method: string, params: Record<string, unknown> = {}) {
    const proc = spawnServer(join(ROOT, 'tools/phos-forge/mcp-server.mjs'));
    return new Promise<Record<string, any>>((resolve, reject) => {
      const timeout = setTimeout(() => { killQuietly(proc); reject(new Error(`Timeout: ${method}`)); }, 10000);
      let buf = '';
      proc.stdout!.on('data', (chunk: Buffer) => {
        buf += chunk.toString();
      });
      proc.stdin!.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) + '\n');
      proc.stdin!.end();
      proc.on('close', () => {
        clearTimeout(timeout);
        try {
          const msg = JSON.parse(buf.trim().split('\n')[0]);
          resolve(msg);
        } catch (e) {
          reject(new Error(`Failed to parse PHOS Forge response: ${buf.slice(0, 200)}`));
        }
      });
    });
  }

  it('lists 29+ tools via tools/list', async () => {
    const res = await callOnce('tools/list');
    expect(res.result).toBeDefined();
    expect(res.result.tools.length).toBeGreaterThanOrEqual(29);
  });

  it('every tool has name, description, inputSchema', async () => {
    const res = await callOnce('tools/list');
    for (const tool of res.result.tools) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.description.length).toBeGreaterThan(10);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('uig-generate-dashboard has role enum', async () => {
    const res = await callOnce('tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'uig-generate-dashboard');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.properties.role.enum).toContain('participant');
  });

  it('uig-generate-from-intent requires prompt', async () => {
    const res = await callOnce('tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'uig-generate-from-intent');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.required).toContain('prompt');
    expect(tool.inputSchema.properties.prompt.type).toBe('string');
  });

  it('phos-adopt has dry_run property', async () => {
    const res = await callOnce('tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'phos-adopt');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.properties.dry_run).toBeDefined();
  });

  it('brain-dump has text argument', async () => {
    const res = await callOnce('tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'brain-dump');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.properties.text).toBeDefined();
  });

  it('cognitive-estimate has empty properties (no args required)', async () => {
    const res = await callOnce('tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'cognitive-estimate');
    expect(tool).toBeDefined();
    expect(tool.inputSchema.properties).toEqual({});
  });

  it('initialize returns server info', async () => {
    const res = await callOnce('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '0.0.1' },
    });
    expect(res.result).toBeDefined();
    expect(res.result.serverInfo).toBeDefined();
    expect(res.result.serverInfo.name).toBe('phos-forge-mcp');
  });
});

// ─── Oasis CLI MCP (stdin/stdout JSON-RPC) ──────────────────────────────

describe('Oasis CLI MCP', () => {
  let proc: ChildProcess;

  beforeAll(() => {
    proc = spawnServer(join(ROOT, 'cli/mcp-server.js'));
  });

  afterAll(() => killQuietly(proc));

  it('lists 11 tools via tools/list', async () => {
    const res = await sendRPC(proc, 'tools/list');
    expect(res.result).toBeDefined();
    expect(res.result.tools.length).toBe(11);
    const names = res.result.tools.map((t: any) => t.name);
    expect(names).toContain('oasis_status');
    expect(names).toContain('oasis_save');
    expect(names).toContain('oasis_execute');
  });

  it('each tool has name, description, inputSchema', async () => {
    const res = await sendRPC(proc, 'tools/list');
    for (const tool of res.result.tools) {
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('initialize returns server info', async () => {
    const p = spawnServer(join(ROOT, 'cli/mcp-server.js'));
    try {
      const res = await sendRPC(p, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '0.0.1' },
      });
      expect(res.result).toBeDefined();
      expect(res.result.serverInfo).toBeDefined();
      expect(res.result.serverInfo.name).toBe('p31-oasis-mcp');
    } finally {
      killQuietly(p);
    }
  });
});

// ─── Component Registry MCP ─────────────────────────────────────────────

describe('Component Registry MCP', () => {
  let proc: ChildProcess;

  beforeAll(() => {
    proc = spawnServer(join(ROOT, 'cli/component-registry.js'));
  });

  afterAll(() => killQuietly(proc));

  it('lists 5 tools via tools/list', async () => {
    const res = await sendRPC(proc, 'tools/list');
    expect(res.result).toBeDefined();
    expect(res.result.tools.length).toBe(5);
    const names = res.result.tools.map((t: any) => t.name);
    expect(names).toContain('design_list_components');
    expect(names).toContain('design_get_component');
    expect(names).toContain('design_get_tokens');
    expect(names).toContain('design_search');
    expect(names).toContain('design_spoon_guide');
  });

  it('design_list_components has no required args', async () => {
    const res = await sendRPC(proc, 'tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'design_list_components');
    expect(tool.inputSchema.required).toBeUndefined();
  });

  it('design_get_component requires name', async () => {
    const res = await sendRPC(proc, 'tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'design_get_component');
    expect(tool.inputSchema.required).toContain('name');
  });
});

// ─── LOVE Ledger MCP ────────────────────────────────────────────────────

describe('LOVE Ledger MCP', () => {
  let proc: ChildProcess;

  beforeAll(() => {
    proc = spawnServer(join(ROOT, 'cli/love-registry.js'));
  });

  afterAll(() => killQuietly(proc));

  it('lists 3 tools via tools/list', async () => {
    const res = await sendRPC(proc, 'tools/list');
    expect(res.result).toBeDefined();
    expect(res.result.tools.length).toBe(3);
    const names = res.result.tools.map((t: any) => t.name);
    expect(names).toContain('love_status');
    expect(names).toContain('love_balance');
    expect(names).toContain('love_sync');
  });

  it('love_balance has userId property', async () => {
    const res = await sendRPC(proc, 'tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'love_balance');
    expect(tool.inputSchema.properties.userId).toBeDefined();
    expect(tool.inputSchema.properties.userId.type).toBe('string');
  });

  it('love_status has no required args', async () => {
    const res = await sendRPC(proc, 'tools/list');
    const tool = res.result.tools.find((t: any) => t.name === 'love_status');
    expect(tool.inputSchema.required).toBeUndefined();
  });
});

// ─── Cross-server invariants ────────────────────────────────────────────

describe('MCP cross-server invariants', () => {
  const STREAM_SERVERS = [
    { name: 'Oasis CLI', script: 'cli/mcp-server.js' },
    { name: 'Component Registry', script: 'cli/component-registry.js' },
    { name: 'LOVE Ledger', script: 'cli/love-registry.js' },
  ];

  for (const server of STREAM_SERVERS) {
    it(`${server.name}: all tool names are kebab-case or snake_case`, async () => {
      const proc = spawnServer(join(ROOT, server.script));
      try {
        const res = await sendRPC(proc, 'tools/list');
        for (const tool of res.result.tools) {
          expect(tool.name).toMatch(/^[a-z][a-z0-9_-]*$/);
        }
      } finally {
        killQuietly(proc);
      }
    });
  }

  it('PHOS Forge: all tool names are kebab-case or snake_case', async () => {
    const proc = spawnServer(join(ROOT, 'tools/phos-forge/mcp-server.mjs'));
    const res = await new Promise<Record<string, any>>((resolve, reject) => {
      const timeout = setTimeout(() => { killQuietly(proc); reject(new Error('Timeout')); }, 10000);
      let buf = '';
      proc.stdout!.on('data', (chunk: Buffer) => { buf += chunk.toString(); });
      proc.stdin!.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n');
      proc.stdin!.end();
      proc.on('close', () => {
        clearTimeout(timeout);
        resolve(JSON.parse(buf.trim().split('\n')[0]));
      });
    });
    for (const tool of res.result.tools) {
      expect(tool.name).toMatch(/^[a-z][a-z0-9_-]*$/);
    }
  });

  it('total tool count across all servers >= 46', async () => {
    let total = 0;

    // Stream servers
    for (const server of STREAM_SERVERS) {
      const proc = spawnServer(join(ROOT, server.script));
      try {
        const res = await sendRPC(proc, 'tools/list');
        total += res.result.tools.length;
      } finally {
        killQuietly(proc);
      }
    }

    // PHOS Forge (batch mode)
    const phosProc = spawnServer(join(ROOT, 'tools/phos-forge/mcp-server.mjs'));
    const phosRes = await new Promise<Record<string, any>>((resolve, reject) => {
      const timeout = setTimeout(() => { killQuietly(phosProc); reject(new Error('Timeout')); }, 10000);
      let buf = '';
      phosProc.stdout!.on('data', (chunk: Buffer) => { buf += chunk.toString(); });
      phosProc.stdin!.write(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }) + '\n');
      phosProc.stdin!.end();
      phosProc.on('close', () => {
        clearTimeout(timeout);
        resolve(JSON.parse(buf.trim().split('\n')[0]));
      });
    });
    total += phosRes.result.tools.length;

    expect(total).toBeGreaterThanOrEqual(46);
  });
});
