import type { GameStore } from '../types/GameStore.js';

const PREFIX = 'p31:arcade:';

export class LocalStorageGameStore implements GameStore {
  async save<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
    } catch { /* quota exceeded — silently fail */ }
  }

  async load<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch { return null; }
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(PREFIX + key);
  }

  async keys(): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) out.push(k.slice(PREFIX.length));
    }
    return out;
  }

  async sync(): Promise<void> {
    // no-op for local; D1 sync goes here later
  }
}

export const store = new LocalStorageGameStore();
