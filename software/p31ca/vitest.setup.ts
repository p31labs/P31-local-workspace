// vitest.setup.ts
// Global test setup — polyfills IndexedDB with a pure-JS in-memory implementation.

import { indexedDB } from 'fake-indexeddb';
Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB, writable: true });
