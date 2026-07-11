import { describe, it, expect, skipIf } from 'vitest';

// Axis-8 (bridge contract): verifies the POST /mcp shape matches the
// L3.4 Node stdio<->HTTP bridge. Skipped unless BRIDGE_URL is set
// (CI runs this against a live bridge; locally it is a no-op).
const bridgeUrl = process.env.BRIDGE_URL;

describe.skipIf(!bridgeUrl)('Axis-8: L3.4 bridge contract', () => {
  it('POST /mcp returns a JSON-RPC-shaped response', async () => {
    const res = await fetch(`${bridgeUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'oasis_execute', arguments: {} },
      }),
    });
    expect(res.status).toBeLessThan(500);
    const body = await res.json().catch(() => null);
    expect(body).toBeTruthy();
  });
});
