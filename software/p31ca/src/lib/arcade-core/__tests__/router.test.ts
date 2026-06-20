import { describe, it, expect, vi, beforeEach } from 'vitest';

const fetchMock = vi.fn();

beforeEach(() => {
  vi.resetModules();
  fetchMock.mockReset();
  (globalThis as any).fetch = fetchMock;
  delete (process.env as any).LITELLM_KEY;
  delete (process.env as any).OPENROUTER_API_KEY;
});

describe('router.mjs', () => {
  it('throws when no keys are configured and network fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    const { dispatchLLM } = await import('../../../../tools/phos-forge/router.mjs');
    await expect(dispatchLLM('system', 'user', { task: 'research' })).rejects.toThrow(/All availability avenues failed/);
  });

  it('falls back to OpenRouter from LiteLLM failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('proxy down'));
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'openrouter answer' } }] }),
    });
    const { dispatchLLM } = await import('../../../../tools/phos-forge/router.mjs');
    (process.env as any).OPENROUTER_API_KEY = 'sk-or';
    const text = await dispatchLLM('sys', 'prompt', { task: 'research' });
    expect(text).toBe('openrouter answer');
  });

  it('uses fallback model for synthesis task', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'ok' } }] }),
    });
    const { dispatchLLM } = await import('../../../../tools/phos-forge/router.mjs');
    (process.env as any).OPENROUTER_API_KEY = 'sk-or';
    const text = await dispatchLLM('sys', 'prompt', { task: 'synthesis' });
    const body = JSON.parse((fetchMock.mock.calls[0] as any)[1].body as string);
    expect(body.model).toContain('sonnet');
    expect(text).toBe('ok');
  });
});
