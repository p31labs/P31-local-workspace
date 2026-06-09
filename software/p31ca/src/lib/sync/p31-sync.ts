// src/lib/sync/p31-sync.ts
// P31 Multi-Device Sync Module - Yjs CRDT + IndexedDB + Cloudflare Worker
// Implements Gap B: PGLite Sync Strategy (Cross-Device Offline-First)

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { set, get, del, keys as idbKeys } from 'idb-keyval';

const SYNC_ENDPOINT = 'https://api.p31ca.org/sync';
const QUEUE_PREFIX = 'p31-queue-';

export const NAMESPACES = [
  'p31:operator',
  'p31:family:cage',
  'p31:child:sj',
  'p31:child:wj',
  'p31:legal',
] as const;

export type Namespace = typeof NAMESPACES[number];

// Sync event types for monitoring/debugging
export interface SyncEvent {
  type: 'push' | 'pull' | 'conflict' | 'offline' | 'online';
  namespace: Namespace;
  timestamp: number;
  deviceId: string;
  error?: string;
}

// One Yjs doc per namespace, one IndexedDB persistence per doc
const docs = new Map<Namespace, Y.Doc>();
const providers = new Map<Namespace, IndexeddbPersistence>();

// Event listeners for sync monitoring
const eventListeners: Set<(event: SyncEvent) => void> = new Set();

export function addSyncListener(callback: (event: SyncEvent) => void): () => void {
  eventListeners.add(callback);
  return () => eventListeners.delete(callback);
}

function emitEvent(event: SyncEvent): void {
  eventListeners.forEach(cb => {
    try {
      cb(event);
    } catch {
      // Listener errors should not break sync
    }
  });
}

/**
 * Initialize sync for specified namespaces
 * @param deviceId - Unique device identifier (from passkey or local storage)
 * @param authorizedNamespaces - Which namespaces this device can access
 */
export async function initSync(
  deviceId: string,
  authorizedNamespaces: Namespace[]
): Promise<void> {
  authorizedNamespaceMap.set(deviceId, authorizedNamespaces);
  for (const ns of authorizedNamespaces) {
    const doc = new Y.Doc({ guid: ns });
    const provider = new IndexeddbPersistence(`p31-sync-${ns}`, doc);

    // Wait for IndexedDB to load local state before attempting remote sync
    await provider.whenSynced;

    docs.set(ns, doc);
    providers.set(ns, provider);

    // Register update handler — push to server on every local change
    doc.on('update', (update: Uint8Array, origin: unknown) => {
      if (origin !== 'remote') {
        pushUpdate(ns, update, deviceId);
      }
    });
  }

  // Pull any server updates we missed while offline
  await pullUpdates(deviceId, authorizedNamespaces);
}

/**
 * Get Yjs document for a namespace (for data access)
 */
export function getDoc(ns: Namespace): Y.Doc | undefined {
  return docs.get(ns);
}

/**
 * Push a single update to the server
 */
async function pushUpdate(
  ns: Namespace,
  update: Uint8Array,
  deviceId: string
): Promise<void> {
  if (!navigator.onLine) {
    await queueUpdate(ns, update, deviceId);
    emitEvent({ type: 'offline', namespace: ns, timestamp: Date.now(), deviceId });
    return;
  }

  try {
    const response = await fetch(`${SYNC_ENDPOINT}/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-P31-Namespace': ns,
        'X-P31-Device': deviceId,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: new Blob([update as any]),
      // 30 second timeout for 1 Mbps constraint per EXEC-01 requirements
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    emitEvent({ type: 'push', namespace: ns, timestamp: Date.now(), deviceId });
  } catch (error) {
    await queueUpdate(ns, update, deviceId);
    emitEvent({
      type: 'offline',
      namespace: ns,
      timestamp: Date.now(),
      deviceId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Pull updates from server for specified namespaces
 */
async function pullUpdates(
  deviceId: string,
  namespaces: Namespace[]
): Promise<void> {
  for (const ns of namespaces) {
    const doc = docs.get(ns);
    if (!doc) continue;

    const stateVector = Y.encodeStateVector(doc);

    try {
      const response = await fetch(`${SYNC_ENDPOINT}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-P31-Namespace': ns,
          'X-P31-Device': deviceId,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: new Blob([stateVector as any]),
        signal: AbortSignal.timeout(30000),
      });

      if (response.ok) {
        const diff = await response.arrayBuffer();
        if (diff.byteLength > 0) {
          Y.applyUpdate(doc, new Uint8Array(diff), 'remote');
          emitEvent({ type: 'pull', namespace: ns, timestamp: Date.now(), deviceId });
        }
      }
    } catch {
      // Offline — local state is authoritative until reconnect
    }
  }
}

/**
 * Queue an update for later when offline
 * Stores in idb-keyval with device ID for conflict detection
 */
async function queueUpdate(
  ns: Namespace,
  update: Uint8Array,
  deviceId: string
): Promise<void> {
  const key = `${QUEUE_PREFIX}${ns}-${deviceId}-${Date.now()}`;
  await set(key, update);
}

/**
 * Flush all queued updates when coming back online
 * Then pull to merge any remote changes made while offline
 */
export async function flushOfflineQueue(deviceId: string): Promise<number> {
  const allKeys = await idbKeys();
  const queueKeys = (allKeys as string[]).filter(key =>
    typeof key === 'string' && key.startsWith(QUEUE_PREFIX)
  );

  let flushedCount = 0;

  for (const key of queueKeys) {
    const update = await get(key);
    if (update instanceof Uint8Array) {
      // Extract namespace from key format: p31-queue-{ns}-{deviceId}-{timestamp}
      const match = (key as string).match(new RegExp(`${QUEUE_PREFIX}(.+)-${deviceId}-\\d+`));
      if (match && match[1]) {
        const ns = match[1] as Namespace;
        await pushUpdate(ns, update, deviceId);
        flushedCount++;
      }
      await del(key);
    }
  }

  // After pushing all local changes, pull remote changes for authorized namespaces only
  const authorized = authorizedNamespaceMap.get(deviceId) ?? [...NAMESPACES];
  await pullUpdates(deviceId, authorized);

  emitEvent({
    type: 'online',
    namespace: 'p31:operator',
    timestamp: Date.now(),
    deviceId
  });

  return flushedCount;
}

// Store authorized namespaces per device for scoped flush
const authorizedNamespaceMap = new Map<string, Namespace[]>();

/**
 * Network status monitoring — returns cleanup function
 */
export function setupNetworkMonitoring(deviceId: string): () => void {
  const handler = () => { flushOfflineQueue(deviceId); };
  window.addEventListener('online', handler);
  return () => window.removeEventListener('online', handler);
}

/**
 * Periodic sync (every 10 minutes as per EXEC-01 spec)
 */
export function startPeriodicSync(deviceId: string, intervalMs = 600000): () => void {
  const interval = setInterval(() => {
    if (navigator.onLine) {
      const authorized = authorizedNamespaceMap.get(deviceId) ?? [...NAMESPACES];
      pullUpdates(deviceId, authorized);
    }
  }, intervalMs);

  return () => clearInterval(interval);
}