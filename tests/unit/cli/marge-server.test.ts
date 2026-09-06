import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import { resolve } from 'path';

const MARGE_PATH = '/home/p31/P31-local-workspace/cli/marge-server.js';

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
    proc.stderr.on('data', (chunk) => {
      // ignore stderr
    });
    proc.stdin.write(JSON.stringify(req) + '\n');
  });
}

function spawnMarge() {
  const proc = spawn('node', [MARGE_PATH], { stdio: ['pipe', 'pipe', 'pipe'], cwd: '/home/p31/P31-local-workspace' });
  return proc;
}

describe('MARGE MCP Server', () => {
  it('initializes correctly', async () => {
    const proc = spawnMarge();
    const res = await sendRPC(proc, 'initialize');
    expect(res.result.protocolVersion).toBe('2026-07-28');
    expect(res.result.serverInfo.name).toBe('p31-marge');
    expect(res.result.serverInfo.version).toBe('2.0.0');
    expect(res.result.serverInfo.upgraded).toBe(true);
    proc.kill();
  }, 15000);

  it('lists all upgraded tools', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/list');
    const names = res.result.tools.map(t => t.name);
    expect(names).toContain('design_expert_audit_surface');
    expect(names).toContain('design_expert_manifest_validate');
    expect(names).toContain('design_expert_wcag_cognitive_check');
    expect(names).toContain('design_expert_neuroadaptive_adapt');
    expect(names.length).toBeGreaterThanOrEqual(14);
    proc.kill();
  }, 15000);

  it('validates manifest against W3C Design Tokens', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_manifest_validate',
      arguments: { manifestPath: resolve(import.meta.dirname, '../../../packages/design-core/manifest.json') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.compliant).toBe(true);
    expect(result.manifest.tokenGroups).toBeGreaterThan(0);
    proc.kill();
  }, 15000);

  it('audits a surface file', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_audit_surface',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.violations)).toBe(true);
    proc.kill();
  }, 15000);

  it('performs WCAG cognitive check', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_wcag_cognitive_check',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/NeuroAdapter.tsx') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.cognitiveScore).toBe('number');
    proc.kill();
  }, 15000);

  it('provides neuroadaptive recommendations', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_neuroadaptive_adapt',
      arguments: {
        signals: {
          dwellSeconds: 5,
          errorRate: 0.1,
          scrollVelocity: 100,
          idleSeconds: 10,
          rageClicks: 5,
        },
      },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(typeof result.spoons).toBe('number');
    expect(result.spoons).toBeGreaterThanOrEqual(0);
    expect(result.spoons).toBeLessThanOrEqual(5);
    expect(result.sizeClass).toBeDefined();
    proc.kill();
  }, 15000);

  it('checks tokens in a file', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_check_tokens',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/design-core/manifest.json') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.violations)).toBe(true);
    proc.kill();
  }, 15000);

  it('suggests fixes with bandit RL context', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_suggest_fix',
      arguments: {
        file: resolve(import.meta.dirname, '../../../packages/design-core/manifest.json'),
        rule: 'D-002',
        context: { spoons: 3, sessionSeconds: 120, cognitiveLoad: 0.4, mode: 'explore' },
      },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.rule).toBe('D-002');
    expect(typeof result.explanation).toBe('string');
    proc.kill();
  }, 15000);

  it('generates design report', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_generate_report',
      arguments: { surfaces: [resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx')] },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.summary.total).toBe('number');
    proc.kill();
  }, 15000);

  it('ephemeralizes in dry-run mode', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_ephemeralize',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx'), dryRun: true },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(result.applied).toBe(false);
    expect(Array.isArray(result.changes)).toBe(true);
    proc.kill();
  }, 15000);

  it('checks contrast ratio', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_check_contrast',
      arguments: { foreground: '#F5F5F7', background: '#0A0A0F' },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.ratio).toBe('number');
    expect(result.wcagAA).toBe(true);
    proc.kill();
  }, 15000);

  it('checks glass surfaces', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_check_glass',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.violations)).toBe(true);
    proc.kill();
  }, 15000);

  it('checks spoon handling', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_check_spoons',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/NeuroAdapter.tsx') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.violations)).toBe(true);
    proc.kill();
  }, 15000);

  it('checks WCAG compliance', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_check_wcag',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.violations)).toBe(true);
    proc.kill();
  }, 15000);

  it('checks accent usage', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_check_accent',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(Array.isArray(result.violations)).toBe(true);
    proc.kill();
  }, 15000);

  it('responds to ping', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'ping');
    expect(res.result).toBeDefined();
    proc.kill();
  }, 15000);

  it('returns error for unknown tool', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'nonexistent_tool',
      arguments: {},
    });
    expect(res.error).toBeDefined();
    expect(res.error.code).toBe(-32602);
    proc.kill();
  }, 15000);

  it('batch ephemeralizes multiple files', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_batch_ephemeralize',
      arguments: {
        files: [resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx')],
        dryRun: true,
      },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.status).toBe('ok');
    expect(typeof result.files).toBe('number');
    proc.kill();
  }, 15000);

  it('includes manifest metadata in audit results', async () => {
    const proc = spawnMarge();
    await sendRPC(proc, 'initialize');
    const res = await sendRPC(proc, 'tools/call', {
      name: 'design_expert_audit_surface',
      arguments: { file: resolve(import.meta.dirname, '../../../packages/ui/src/adaptive/GreyRock.tsx') },
    });
    const result = JSON.parse(res.result.content[0].text);
    expect(result.manifest).toBeDefined();
    expect(result.manifest.version).toBe('2025.10');
    proc.kill();
  }, 15000);
});
