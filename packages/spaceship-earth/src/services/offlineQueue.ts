/**
 * @file offlineQueue — IndexedDB-backed action queue for relay disconnect resilience.
 *
 * Schema aligned with shell's `lib/outbox.ts`:
 *   id (UUID), kind, payload, created_at, attempts, status, last_attempt_at
 *
 * When the relay WebSocket is unavailable, actions are persisted here and
 * replayed in FIFO order on reconnect.
 *
 * DB:    "p31-relay-queue"
 * Store: "actions"
 * Key:   auto-increment integer (preserves insertion order)
 *
 * Design: module-level singleton. Lazy-opens the DB on first use.
 * Operates as a FIFO queue via IDBObjectStore autoIncrement + cursor iteration.
 */

const DB_NAME    = 'p31-relay-queue';
const STORE_NAME = 'actions';
const DB_VERSION = 1;

export interface QueuedAction {
  id: string;
  kind: 'mesh-broadcast' | 'ledger-append' | 'mesh-message';
  payload: unknown;
  created_at: number;
  attempts: number;
  status: 'pending' | 'sent' | 'failed';
  last_attempt_at?: number;
}

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE_NAME, { autoIncrement: true });
      store.createIndex('status', 'status', { unique: false });
      store.createIndex('created_at', 'created_at', { unique: false });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db!); };
    req.onerror   = () => reject(req.error);
  });
}

/** Append an action to the end of the queue. Returns the auto-assigned key. */
export async function enqueue(kind: QueuedAction['kind'], payload: unknown): Promise<IDBValidKey> {
  const db = await openDB();
  const entry: QueuedAction = {
    id: crypto.randomUUID(),
    kind,
    payload,
    created_at: Date.now(),
    attempts: 0,
    status: 'pending',
  };
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).add(entry);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Drain all pending actions in FIFO order (newer-wins: ordered by created_at).
 * Returns the list so the caller can replay them.
 */
export async function drainQueue(): Promise<Array<{ key: IDBValidKey; action: QueuedAction }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const results: Array<{ key: IDBValidKey; action: QueuedAction }> = [];
    const tx      = db.transaction(STORE_NAME, 'readwrite');
    const store   = tx.objectStore(STORE_NAME);
    const index   = store.index('status');
    const cursor  = index.openCursor('pending');

    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) {
        results.push({ key: c.key, action: c.value as QueuedAction });
        c.delete();
        c.continue();
      }
    };
    tx.oncomplete = () => resolve(results);
    tx.onerror    = () => reject(tx.error);
  });
}

/** Return the current pending queue depth without modifying the store. */
export async function queueSize(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const idx = tx.objectStore(STORE_NAME).index('status');
    const req = idx.count('pending');
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/** Mark an entry as sent or failed after an attempt. */
export async function markAttempt(key: IDBValidKey, success: boolean): Promise<void> {
  const db = await openDB();
  const now = Date.now();
  const status = success ? 'sent' : 'pending';
  const attempts = success ? 0 : 1; // caller should read current and increment

  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => {
      const entry = req.result as QueuedAction | undefined;
      if (!entry) return resolve();
      const newAttempts = entry.attempts + 1;
      const newStatus = success ? 'sent' : (newAttempts >= 5 ? 'failed' : 'pending');
      const updateReq = tx.objectStore(STORE_NAME).put({
        ...entry,
        attempts: newAttempts,
        status: newStatus,
        last_attempt_at: now,
      });
      updateReq.onsuccess = () => resolve();
      updateReq.onerror   = () => reject(updateReq.error);
    };
    req.onerror = () => reject(req.error);
  });
}

/** Wipe the entire queue (e.g., after too many retries or manual reset). */
export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).clear();
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Clear sent entries older than 7 days (cleanup).
 */
export async function cleanup(): Promise<void> {
  const db = await openDB();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE_NAME, 'readwrite');
    const store   = tx.objectStore(STORE_NAME);
    const index   = store.index('created_at');
    const range   = IDBKeyRange.upperBound(cutoff);
    const cursor  = index.openCursor(range);

    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) {
        const entry = c.value as QueuedAction;
        if (entry.status === 'sent') c.delete();
        c.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });
}
