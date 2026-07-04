/**
 * @file offlineQueue — IndexedDB-backed action queue for relay disconnect resilience.
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
  type: string;
  payload: unknown;
  ts: number;
  retries: number;
}

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { autoIncrement: true });
    };
    req.onsuccess = () => { _db = req.result; resolve(_db!); };
    req.onerror   = () => reject(req.error);
  });
}

/** Append an action to the end of the queue. Returns the auto-assigned key. */
export async function enqueue(action: Omit<QueuedAction, 'retries'>): Promise<IDBValidKey> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).add({ ...action, retries: 0 });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

/**
 * Drain all queued actions in FIFO order and clear the store.
 * Returns the list so the caller can replay them.
 */
export async function drainQueue(): Promise<Array<{ key: IDBValidKey; action: QueuedAction }>> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const results: Array<{ key: IDBValidKey; action: QueuedAction }> = [];
    const tx      = db.transaction(STORE_NAME, 'readwrite');
    const store   = tx.objectStore(STORE_NAME);
    const cursor  = store.openCursor();

    cursor.onsuccess = () => {
      const c = cursor.result;
      if (c) {
        results.push({ key: c.key, action: c.value as QueuedAction });
        c.delete();   // remove as we iterate (FIFO drain)
        c.continue();
      }
    };
    tx.oncomplete = () => resolve(results);
    tx.onerror    = () => reject(tx.error);
  });
}

/** Return the current queue depth without modifying the store. */
export async function queueSize(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
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
