/**
 * @file KV-backed distributed rate limiter.
 * Replaces the old in-memory Map with a token-bucket backed by Cloudflare KV.
 *
 * Design: sliding window counter stored in KV.
 * Key: `rl:<ip>`, TTL: window seconds.
 * Value: JSON { count: number, reset: number }
 */

import type { KVNamespace } from '@cloudflare/workers-types';

export interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
  burstMultiplier: number;
  burstWindowSeconds: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  limit: 100,
  windowSeconds: 60,
  burstMultiplier: 2,
  burstWindowSeconds: 10,
};

const PER_BINDING_CONFIG: Record<string, RateLimitConfig> = {
  phos_ai_proxy: { limit: 100, windowSeconds: 60, burstMultiplier: 2, burstWindowSeconds: 10 },
  jitterbug_api: { limit: 100, windowSeconds: 60, burstMultiplier: 2, burstWindowSeconds: 10 },
  k4_cage: { limit: 50, windowSeconds: 60, burstMultiplier: 5, burstWindowSeconds: 10 },
  genesis_spark: { limit: 50, windowSeconds: 60, burstMultiplier: 5, burstWindowSeconds: 10 },
  command_center: { limit: 50, windowSeconds: 60, burstMultiplier: 5, burstWindowSeconds: 10 },
  love_ledger: { limit: 200, windowSeconds: 60, burstMultiplier: 3, burstWindowSeconds: 10 },
  federation_bridge: { limit: 100, windowSeconds: 60, burstMultiplier: 2, burstWindowSeconds: 10 },
  dads: { limit: 100, windowSeconds: 60, burstMultiplier: 2, burstWindowSeconds: 10 },
  bros: { limit: 200, windowSeconds: 60, burstMultiplier: 3, burstWindowSeconds: 10 },
  justice_hub: { limit: 50, windowSeconds: 60, burstMultiplier: 2, burstWindowSeconds: 10 },
};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  burstRemaining?: number;
}

export async function checkRateLimit(ip: string, kv: KVNamespace, bindingName = 'default', config?: RateLimitConfig): Promise<RateLimitResult> {
  const cfg = config ?? PER_BINDING_CONFIG[bindingName] ?? DEFAULT_CONFIG;
  const key = `rl:${ip}:${bindingName}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    const raw = await kv.get(key, 'json');
    let entry: { count: number; reset: number };

    if (!raw || typeof raw !== 'object' || !('count' in raw) || !('reset' in raw)) {
      entry = { count: 0, reset: now + cfg.windowSeconds };
    } else {
      entry = raw as { count: number; reset: number };
    }

    // Reset window if expired
    if (now >= entry.reset) {
      entry = { count: 0, reset: now + cfg.windowSeconds };
    }

    const windowAge = now - (entry.reset - cfg.windowSeconds);
    const inBurstWindow = windowAge < cfg.burstWindowSeconds;
    const effectiveLimit = inBurstWindow ? Math.floor(cfg.limit * cfg.burstMultiplier) : cfg.limit;

    if (entry.count >= effectiveLimit) {
      return { allowed: false, remaining: 0, reset: entry.reset, burstRemaining: 0 };
    }

    entry.count += 1;

    await kv.put(key, JSON.stringify(entry), {
      expirationTtl: Math.max(cfg.windowSeconds, cfg.burstWindowSeconds),
    });

    return {
      allowed: true,
      remaining: effectiveLimit - entry.count,
      reset: entry.reset,
      burstRemaining: inBurstWindow ? Math.max(0, effectiveLimit - entry.count) : undefined,
    };
  } catch {
    return { allowed: true, remaining: cfg.limit, reset: now + cfg.windowSeconds, burstRemaining: Math.floor(cfg.limit * cfg.burstMultiplier) };
  }
}
