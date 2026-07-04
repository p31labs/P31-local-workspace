type StorageBackend = 'local' | 'session' | 'memory';

class SafeStorage {
  private backend: StorageBackend = 'local';
  private memoryStore: Map<string, string> = new Map();

  constructor() {
    this.detectBackend();
  }

  private detectBackend(): void {
    try {
      const testKey = '__p31_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.backend = 'local';
      return;
    } catch {
      // localStorage unavailable (Safari Private, quota, disabled)
    }

    try {
      const testKey = '__p31_storage_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      this.backend = 'session';
      return;
    } catch {
      this.backend = 'memory';
    }
  }

  getItem<T = any>(key: string): T | null {
    try {
      const raw = this.backend === 'local' ? localStorage.getItem(key)
        : this.backend === 'session' ? sessionStorage.getItem(key)
        : this.memoryStore.get(key) || null;

      if (!raw) return null;
      try { return JSON.parse(raw) as T; } catch { return raw as unknown as T; }
    } catch {
      return null;
    }
  }

  setItem(key: string, value: any): boolean {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    try {
      if (this.backend === 'local') { localStorage.setItem(key, serialized); return true; }
      if (this.backend === 'session') { sessionStorage.setItem(key, serialized); return true; }
      this.memoryStore.set(key, serialized);
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.warn(`[storage] Quota exceeded — cannot save ${key}`);
        try { sessionStorage.setItem(key, serialized); return true; } catch {
          this.memoryStore.set(key, serialized);
          return true;
        }
      }
      console.error(`[storage] Failed to save ${key}:`, e);
      return false;
    }
  }

  removeItem(key: string): void {
    try {
      if (this.backend === 'local') localStorage.removeItem(key);
      else if (this.backend === 'session') sessionStorage.removeItem(key);
      else this.memoryStore.delete(key);
    } catch {}
  }
}

export const storage = new SafeStorage();
