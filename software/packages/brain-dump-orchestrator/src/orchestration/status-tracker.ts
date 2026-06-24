import type { StatusEntry } from '../types/index.js';

export interface StatusTracker {
  write(batchId: string, entries: StatusEntry[]): Promise<void>;
  read(batchId: string): Promise<StatusEntry[]>;
  append(batchId: string, entry: StatusEntry): Promise<void>;
}

export class KVStatusTracker implements StatusTracker {
  constructor(private kv: { get: (key: string) => Promise<string | null>; put: (key: string, value: string) => Promise<void> }) {}

  async write(batchId: string, entries: StatusEntry[]): Promise<void> {
    await this.kv.put(`BRAIN_DUMP_STATUS:${batchId}`, JSON.stringify(entries));
  }

  async read(batchId: string): Promise<StatusEntry[]> {
    const raw = await this.kv.get(`BRAIN_DUMP_STATUS:${batchId}`);
    if (!raw) return [];
    return JSON.parse(raw);
  }

  async append(batchId: string, entry: StatusEntry): Promise<void> {
    const entries = await this.read(batchId);
    entries.push(entry);
    await this.write(batchId, entries);
  }
}

export class D1StatusTracker implements StatusTracker {
  constructor(private db: { prepare: (sql: string) => { bind: (...args: any[]) => { run: () => Promise<any>; all: () => Promise<{ results: any[] }> } } }) {}

  async write(batchId: string, entries: StatusEntry[]): Promise<void> {
    await this.db.prepare(
      `INSERT INTO status_entries (batch_id, axis_id, status, updated_at, message) VALUES (?, ?, ?, ?, ?)`
    ).bind(batchId, entries[0]?.axisId || '', entries[0]?.status || 'unknown', entries[0]?.updatedAt || new Date().toISOString(), entries[0]?.message || '').run();
  }

  async read(batchId: string): Promise<StatusEntry[]> {
    const result = await this.db.prepare(
      'SELECT axis_id, status, updated_at, message FROM status_entries WHERE batch_id = ?'
    ).bind(batchId).all();
    if (!result.results?.length) return [];
    return result.results.map(row => ({
      axisId: row.axis_id,
      status: row.status,
      updatedAt: row.updated_at,
      message: row.message,
    }));
  }

  async append(batchId: string, entry: StatusEntry): Promise<void> {
    await this.db.prepare(
      `INSERT INTO status_entries (batch_id, axis_id, status, updated_at, message) VALUES (?, ?, ?, ?, ?)`
    ).bind(batchId, entry.axisId, entry.status, entry.updatedAt, entry.message || '').run();
  }
}

export class InMemoryStatusTracker implements StatusTracker {
  private store: Map<string, StatusEntry[]> = new Map();

  async write(batchId: string, entries: StatusEntry[]): Promise<void> {
    this.store.set(batchId, entries);
  }

  async read(batchId: string): Promise<StatusEntry[]> {
    return this.store.get(batchId) || [];
  }

  async append(batchId: string, entry: StatusEntry): Promise<void> {
    const entries = this.store.get(batchId) || [];
    entries.push(entry);
    this.store.set(batchId, entries);
  }
}

export function createStatusTracker(type: 'kv' | 'd1' | 'in-memory', config?: any): StatusTracker {
  switch (type) {
    case 'kv':
      if (!config?.kv) throw new Error('KV binding required for kv status tracker');
      return new KVStatusTracker(config.kv);
    case 'd1':
      if (!config?.db) throw new Error('D1 binding required for d1 status tracker');
      return new D1StatusTracker(config.db);
    case 'in-memory':
      return new InMemoryStatusTracker();
    default:
      throw new Error(`Unsupported status tracker type: ${type}`);
  }
}
