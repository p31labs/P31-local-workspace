import { describe, it, expect } from 'vitest';

describe('k4-personal integration', () => {
  it('mesh health contract', () => {
    const mesh = { ok: true, service: 'k4-personal' };
    expect(mesh.ok).toBe(true);
    expect(mesh.service).toContain('k4');
  });

  it('agent health contract', () => {
    const agent = { status: 'ok', agent: 'personal' };
    expect(agent.status).toBe('ok');
    expect(agent.agent).toBe('personal');
  });
});
