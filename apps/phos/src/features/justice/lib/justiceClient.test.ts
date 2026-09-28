import { describe, it, expect, vi, afterEach } from 'vitest';
import { justiceRpc, sha256 } from './justiceClient';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('justiceClient', () => {
  it('parses MCP content[0].text into a JSON object', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        result: { content: [{ type: 'text', text: JSON.stringify({ entryId: 'x', valid: true }) }] },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )));
    const out = await justiceRpc('justice_evidence_verify', { entryId: 'x' });
    expect(out).toEqual({ entryId: 'x', valid: true });
  });

  it('throws on a non-ok hub response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'Method not found' } }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )));
    await expect(justiceRpc('nope', {})).rejects.toThrow(/Justice hub responded 400/);
  });

  it('computes a real SHA-256 hex digest', async () => {
    const h = await sha256('abc');
    expect(h).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });
});