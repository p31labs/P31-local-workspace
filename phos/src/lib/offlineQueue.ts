export interface QueuedAction {
  id: string;
  surface: string;
  action: string;
  payload: unknown;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
}

type ActionHandler = (action: QueuedAction) => Promise<void>;
const handlers = new Map<string, ActionHandler>();

const DB_NAME = 'phos-offline-queue';
const STORE_NAME = 'actions';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function registerActionHandler(surface: string, handler: ActionHandler) {
  handlers.set(surface, handler);
}

export function unregisterActionHandler(surface: string) {
  handlers.delete(surface);
}

async function registerSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;
    reg.sync.register('sync-actions').catch(() => {});
  }
}

export async function enqueueAction(
  surface: string,
  action: string,
  payload: unknown
): Promise<string> {
  const db = await openDB();
  const id = crypto.randomUUID();
  const item: QueuedAction = {
    id,
    surface,
    action,
    payload,
    timestamp: Date.now(),
    status: 'pending',
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(item);
    tx.oncomplete = () => {
      registerSync();
      resolve(id);
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingActions(): Promise<QueuedAction[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const index = tx.objectStore(STORE_NAME).index('status');
    const request = index.getAll('pending');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateActionStatus(
  id: string,
  status: QueuedAction['status']
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const req = store.get(id);
  req.onsuccess = () => {
    const item = req.result;
    if (item) {
      item.status = status;
      store.put(item);
    }
  };
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeAction(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function processQueue(): Promise<{ processed: number; failed: number }> {
  const actions = await getPendingActions();
  let processed = 0;
  let failed = 0;
  for (const action of actions) {
    await updateActionStatus(action.id, 'syncing');
    const handler = handlers.get(action.surface);
    if (!handler) {
      await updateActionStatus(action.id, 'failed');
      failed++;
      continue;
    }
    try {
      await handler(action);
      await removeAction(action.id);
      processed++;
    } catch {
      await updateActionStatus(action.id, 'failed');
      failed++;
    }
  }
  return { processed, failed };
}

export function listenForOnline() {
  window.addEventListener('online', () => {
    processQueue();
  });
}
