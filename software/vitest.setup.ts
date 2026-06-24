import { indexedDB } from 'fake-indexeddb';
Object.defineProperty(globalThis, 'indexedDB', { value: indexedDB, writable: true });
