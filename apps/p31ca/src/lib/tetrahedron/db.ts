// src/lib/tetrahedron/db.ts
// Dedicated IndexedDB store for legal/personal data (visitation logs, ADA documents, etc.)
// Completely isolated from arcade PGLite and passport storage.

const DB_NAME = 'p31-tetrahedron';
const DB_VERSION = 1;

export interface VisitLog {
  id: string;
  date: string;
  duration: number;
  supervisor: string;
  childrenState: string;
  deviations: string;
  reaction: string;
  audioBlob?: Blob;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('visitation_logs')) {
        const store = db.createObjectStore('visitation_logs', { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVisitLog(log: VisitLog): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('visitation_logs', 'readwrite');
  tx.objectStore('visitation_logs').put(log);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getVisitLogs(limit = 50): Promise<VisitLog[]> {
  const db = await openDB();
  const tx = db.transaction('visitation_logs', 'readonly');
  const index = tx.objectStore('visitation_logs').index('createdAt');
  const results: VisitLog[] = [];
  await new Promise<void>((resolve, reject) => {
    const request = index.openCursor(null, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
  db.close();
  return results;
}

export async function deleteVisitLog(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('visitation_logs', 'readwrite');
  tx.objectStore('visitation_logs').delete(id);
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export function generateId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}
