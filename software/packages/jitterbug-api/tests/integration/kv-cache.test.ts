import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

const PSK = 'test-psk-123';

describe('KV Cache Integration', () => {
  it('GET /brain-dump/:id/status caches response for 60s', async () => {
    const id = '5aa8b750-f534-453a-818f-9ab399453749';

    // First call — cache miss
    const response1 = await SELF.fetch(`https://jitterbug-api/brain-dump/${id}/status`, {
      headers: { Authorization: `Bearer ${PSK}` },
    });
    expect(response1.status).toBe(200);
    expect(response1.headers.get('X-Cache')).toBe('MISS');

    // Second call — cache hit
    const response2 = await SELF.fetch(`https://jitterbug-api/brain-dump/${id}/status`, {
      headers: { Authorization: `Bearer ${PSK}` },
    });
    expect(response2.status).toBe(200);
    expect(response2.headers.get('X-Cache')).toBe('HIT');
  });
});
