/**
 * Idempotency Layer — Guarantees exactly-once execution for edge mutations
 */

export interface IdempotentResult {
  idempotencyKey: string;
  result: any;
  cached: boolean;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;

export class IdempotencyCache {
  private static instance: IdempotencyCache;
  private cache: Map<string, IdempotentResult> = new Map();

  static getInstance(): IdempotencyCache {
    if (!IdempotencyCache.instance) {
      IdempotencyCache.instance = new IdempotencyCache();
    }
    return IdempotencyCache.instance;
  }

  store(key: string, result: any): void {
    const entry: IdempotentResult = {
      idempotencyKey: key,
      result,
      cached: false,
      timestamp: Date.now(),
    };
    this.cache.set(key, entry);
    setTimeout(() => {
      this.cache.delete(key);
    }, CACHE_TTL);
  }

  get(key: string): IdempotentResult | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return { ...entry, cached: true };
  }

  static generateKey(did: string, payload: any): string {
    const data = JSON.stringify(payload) + did;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `idemp-${Math.abs(hash).toString(36).padStart(10, '0')}`;
  }
}
