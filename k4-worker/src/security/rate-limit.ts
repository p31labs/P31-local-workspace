/**
 * Rate limiting using Workers KV
 * Per-IP: 100 requests per minute
 * Per-API-key: 1000 requests per minute
 */

export async function checkRateLimit(
  key: string,
  env: { K4_KV_STORE: KVNamespace },
  limit: number = 100,
  window: number = 60
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowKey = `ratelimit:${key}:${Math.floor(now / window)}`;

  const current = (await env.K4_KV_STORE.get(windowKey, 'json')) as number | null;
  const count = current ?? 0;

  if (count >= limit) {
    const reset = (Math.floor(now / window) + 1) * window;
    return { allowed: false, remaining: 0, reset };
  }

  await env.K4_KV_STORE.put(windowKey, JSON.stringify(count + 1), { expirationTtl: window });
  return { allowed: true, remaining: limit - count - 1, reset: (Math.floor(now / window) + 1) * window };
}
