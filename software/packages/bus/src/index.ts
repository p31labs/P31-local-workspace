/**
 * @p31labs/bus — Cross-tab event bus for the P31 ecosystem.
 *
 * Zero-dependency. ~4KB gzipped.
 *
 * Provides two adapters:
 * - BroadcastAdapter: uses BroadcastChannel API (preferred, fast)
 * - LocalStorageAdapter: uses localStorage + storage event (fallback, cross-origin)
 *
 * Usage:
 * ```ts
 * import { Bus } from '@p31labs/bus';
 * const bus = new Bus({ namespace: 'p31' });
 * bus.on('spoons', (value) => console.log('Spoons:', value));
 * bus.emit('spoons', 3);
 * ```
 */

export type BusEventCallback = (value: unknown, key: string) => void;

export interface BusOptions {
  readonly namespace?: string;
  readonly forceLocalStorage?: boolean;
}

export interface BusAdapter {
  on(key: string, fn: BusEventCallback): () => void;
  emit(key: string, value: unknown): void;
  destroy(): void;
}

// ─── BroadcastChannel Adapter ───────────────────────────────────────

export class BroadcastAdapter implements BusAdapter {
  private _channel: BroadcastChannel | null = null;
  private _listeners = new Map<string, Set<BusEventCallback>>();
  private _globalHandler: ((e: MessageEvent) => void) | null = null;

  constructor(private _channelName: string) {
    if (typeof BroadcastChannel !== 'undefined') {
      this._channel = new BroadcastChannel(_channelName);
      this._globalHandler = (e: MessageEvent) => {
        const { key, value } = e.data ?? {};
        if (key !== undefined) {
          const fns = this._listeners.get(key as string);
          if (fns) fns.forEach(fn => fn(value, key as string));
        }
      };
      this._channel.onmessage = this._globalHandler;
    }
  }

  on(key: string, fn: BusEventCallback): () => void {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key)!.add(fn);
    return () => { this._listeners.get(key)?.delete(fn); };
  }

  emit(key: string, value: unknown): void {
    if (this._channel) {
      this._channel.postMessage({ key, value });
    }
    const fns = this._listeners.get(key);
    if (fns) fns.forEach(fn => fn(value, key));
  }

  destroy(): void {
    if (this._channel) {
      this._channel.onmessage = null;
      this._channel.close();
      this._channel = null;
    }
    this._listeners.clear();
    this._globalHandler = null;
  }
}

// ─── LocalStorage Adapter ───────────────────────────────────────────

const LS_PREFIX = 'p31:bus:';

export class LocalStorageAdapter implements BusAdapter {
  private _listeners = new Map<string, Set<BusEventCallback>>();
  private _storageHandler: ((e: StorageEvent) => void) | null = null;

  constructor(private _namespace: string) {
    this._storageHandler = (e: StorageEvent) => {
      if (!e.key?.startsWith(this._storageKey(''))) return;
      if (!e.newValue) return;
      const busKey = e.key.slice(this._storageKey('').length);
      try {
        const value = JSON.parse(e.newValue);
        const fns = this._listeners.get(busKey);
        if (fns) fns.forEach(fn => fn(value, busKey));
      } catch { /* ignore parse errors */ }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this._storageHandler);
    }
  }

  private _storageKey(key: string): string {
    return `${LS_PREFIX}${this._namespace}:${key}`;
  }

  on(key: string, fn: BusEventCallback): () => void {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key)!.add(fn);
    return () => { this._listeners.get(key)?.delete(fn); };
  }

  emit(key: string, value: unknown): void {
    try {
      const fullKey = this._storageKey(key);
      localStorage.setItem(fullKey, JSON.stringify(value));
      localStorage.removeItem(fullKey);
    } catch { /* storage full — silent */ }

    const fns = this._listeners.get(key);
    if (fns) fns.forEach(fn => fn(value, key));
  }

  destroy(): void {
    if (this._storageHandler && typeof window !== 'undefined') {
      window.removeEventListener('storage', this._storageHandler);
    }
    this._listeners.clear();
    this._storageHandler = null;
  }
}

// ─── Main Bus ───────────────────────────────────────────────────────

const DEFAULT_NAMESPACE = 'p31';

export class Bus {
  private _adapters: BusAdapter[] = [];

  constructor(options: BusOptions = {}) {
    const namespace = options.namespace ?? DEFAULT_NAMESPACE;

    if (options.forceLocalStorage || typeof BroadcastChannel === 'undefined') {
      this._adapters.push(new LocalStorageAdapter(namespace));
    } else {
      this._adapters.push(new BroadcastAdapter(namespace));
      this._adapters.push(new LocalStorageAdapter(namespace));
    }
  }

  on(key: string, fn: BusEventCallback): () => void {
    const unsubs = this._adapters.map(a => a.on(key, fn));
    return () => unsubs.forEach(u => u());
  }

  emit(key: string, value: unknown): void {
    this._adapters.forEach(a => a.emit(key, value));
  }

  destroy(): void {
    this._adapters.forEach(a => a.destroy());
    this._adapters = [];
  }
}
