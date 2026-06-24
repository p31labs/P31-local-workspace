export async function ratelimit(ip: string, kv: KVNamespace | undefined): Promise<{ allowed: boolean; retryAfter?: number }> {
  // SEC: Rate limiting is a first line of defense against DoS and abuse.
  // Consider upgrading to Ed25519 HMAC (crypto.subtle) for distributed token validation
  // when rate-limit keys are shared across multiple workers / regions.
  if (!kv) return { allowed: true };
  const key = `ratelimit:${ip}`;
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 60;

  const record = await kv.get(key);
  const timestamps: number[] = record ? JSON.parse(record) : [];
  const recent = timestamps.filter(t => now - t < windowMs);
  if (recent.length >= maxRequests) {
    const oldest = recent[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  recent.push(now);
  await kv.put(key, JSON.stringify(recent), { expirationTtl: 60 });
  return { allowed: true };
}
