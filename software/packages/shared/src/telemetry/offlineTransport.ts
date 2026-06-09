/**
 * Offline-First Sentry Transport for P31 Labs
 * 
 * Provides air-gapped error reporting by queueing events locally
 * and flushing when network becomes available.
 */

import type { Event, Transport, TransportMakeRequestResponse } from '@sentry/types';
import { CircuitBreaker, createP31CircuitBreaker } from './circuitBreaker';

interface OfflineTransportOptions {
  /** Maximum events to queue offline */
  maxQueueSize?: number;
  /** How often to flush queue (ms) */
  flushTimeout?: number;
  /** Sentry DSN for sending events */
  dsn?: string;
  /** Enable circuit breaker protection */
  enableCircuitBreaker?: boolean;
  /** Enable exponential backoff */
  enableExponentialBackoff?: boolean;
}

/**
 * Enhanced offline transport with circuit breaker and retry logic
 */
export function makeBrowserOfflineTransport(options: OfflineTransportOptions = {}): Transport {
  const maxQueueSize = options.maxQueueSize ?? 30;
  const flushTimeout = options.flushTimeout ?? 5000;
  const dsn = options.dsn;
  const enableCircuitBreaker = options.enableCircuitBreaker ?? true;
  const enableExponentialBackoff = options.enableExponentialBackoff ?? true;
  
  const queue: Event[] = [];
  let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;
  let circuitBreaker: CircuitBreaker | null = null;
  let retryAttempts = new Map<string, number>();

  // Initialize circuit breaker if enabled
  if (enableCircuitBreaker && dsn) {
    circuitBreaker = createP31CircuitBreaker('sentry-transport', {
      failureThreshold: 3,
      recoveryThreshold: 2,
      timeout: 10000,
      resetTimeout: 30000
    });
  }

  async function sendWithRetry(event: Event, retries = 0): Promise<TransportMakeRequestResponse> {
    const eventId = event.event_id || Math.random().toString(36);
    const maxRetries = enableExponentialBackoff ? 3 : 1;
    const baseDelay = 1000;

    try {
      if (circuitBreaker) {
        await circuitBreaker.execute(async () => {
          const response = await fetch(dsn!, {
            method: 'POST',
            body: JSON.stringify(event),
            headers: { 
              'Content-Type': 'application/json',
              'X-Sentry-Auth': `Sentry sentry_version=7,token=undefined`
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        });
      } else {
        const response = await fetch(dsn!, {
          method: 'POST',
          body: JSON.stringify(event),
          headers: { 
            'Content-Type': 'application/json',
            'X-Sentry-Auth': `Sentry sentry_version=7,token=undefined`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }

      // Success - clear retry attempts for this event
      retryAttempts.delete(eventId);
      return { status: 'ok' } as TransportMakeRequestResponse;
    } catch (error) {
      retryAttempts.set(eventId, retries + 1);
      
      if (retries < maxRetries && enableExponentialBackoff) {
        const delay = baseDelay * Math.pow(2, retries);
        await new Promise(resolve => setTimeout(resolve, delay));
        return sendWithRetry(event, retries + 1);
      }
      
      // Max retries exceeded or circuit breaker open
      throw error;
    }
  }

  function flushQueue(): void {
    if (queue.length === 0) return;
    
    const events = [...queue];
    queue.length = 0;
    
    if (isOnline && dsn) {
      // Process events with retry logic
      for (const event of events) {
        sendWithRetry(event).catch(() => {
          // Put back in queue on failure
          queue.unshift(event);
        });
      }
    } else if (!isOnline) {
      // Keep events queued when offline
      queue.unshift(...events);
    }
  }

  // Setup online/offline listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      isOnline = true;
      flushQueue();
    });
    
    window.addEventListener('offline', () => {
      isOnline = false;
    });
  }

  // Auto-flush timer
  if (flushTimer) {
    clearTimeout(flushTimer);
  }
  flushTimer = setTimeout(flushQueue, flushTimeout);

  return {
    sendEvent(event: Event): Promise<TransportMakeRequestResponse> {
      // Add to queue
      if (queue.length >= maxQueueSize) {
        queue.shift(); // Drop oldest
      }
      queue.push(event);
      
      // Try to flush if online
      if (isOnline) {
        flushQueue();
      }
      
      return Promise.resolve({ status: 'ok' } as TransportMakeRequestResponse);
    },
    
    sendEnvelope(_envelope: unknown): Promise<TransportMakeRequestResponse> {
      // Same logic for envelopes
      if (isOnline) {
        flushQueue();
      }
      return Promise.resolve({ status: 'ok' } as TransportMakeRequestResponse);
    },
    
    flush(_timeout?: number): Promise<boolean> {
      flushQueue();
      return Promise.resolve(true);
    }
  } as unknown as Transport;
}

/**
 * Creates an offline transport that stores to IndexedDB
 * for persistent offline queuing.
 */
export function makeIndexedDBOfflineTransport(options: OfflineTransportOptions = {}): Transport {
  const _maxQueueSize = options.maxQueueSize ?? 100;
  const _flushTimeout = options.flushTimeout ?? 10000;
  const dsn = options.dsn;
  
  let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  let db: IDBDatabase | null = null;
  
  // Initialize IndexedDB
  async function initDB(): Promise<IDBDatabase> {
    if (db) return db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('p31-offline-queue', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains('events')) {
          database.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async function storeEvent(event: Event): Promise<void> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      
      const request = store.add({
        event,
        timestamp: Date.now()
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async function flushStoredEvents(): Promise<Event[]> {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(['events'], 'readwrite');
      const store = transaction.objectStore('events');
      const request = store.getAll();
      
      request.onsuccess = () => {
        const events = request.result.map((r: { event: Event }) => r.event);
        // Clear the store
        store.clear();
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Setup online/offline listeners
  if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
      isOnline = true;
      if (dsn) {
        const events = await flushStoredEvents();
        for (const event of events) {
          fetch(dsn, {
            method: 'POST',
            body: JSON.stringify(event),
            headers: { 'Content-Type': 'application/json' }
          }).catch(() => {});
        }
      }
    });
    
    window.addEventListener('offline', () => {
      isOnline = false;
    });
  }

  return {
    async sendEvent(event: Event): Promise<TransportMakeRequestResponse> {
      if (isOnline && dsn) {
        try {
          const response = await fetch(dsn, {
            method: 'POST',
            body: JSON.stringify(event),
            headers: { 'Content-Type': 'application/json' }
          });
          return { status: response.ok ? 'ok' : 'failed' } as TransportMakeRequestResponse;
        } catch {
          // Fall through to offline storage
        }
      }
      
      // Store offline
      await storeEvent(event);
      return { status: 'ok' } as TransportMakeRequestResponse;
    },
    
    async sendEnvelope(_envelope: unknown): Promise<TransportMakeRequestResponse> {
      return { status: 'ok' } as TransportMakeRequestResponse;
    },
    
    async flush(_timeout?: number): Promise<boolean> {
      return true;
    }
  } as unknown as Transport;
}

export default makeBrowserOfflineTransport;
