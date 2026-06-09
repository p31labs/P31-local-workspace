// Vitest setup — polyfill Web Crypto API for Node.js
import { webcrypto } from 'node:crypto';
// Define crypto as a writable property if it doesn't exist or is not readonly
if (typeof global.crypto === 'undefined' || typeof global.crypto === 'object') {
  Object.defineProperty(global, 'crypto', {
    value: webcrypto,
    writable: true
  });
}
// Also expose SubtleCrypto globally if needed
if (typeof global.SubtleCrypto === 'undefined') {
  Object.defineProperty(global, 'SubtleCrypto', {
    value: webcrypto.subtle,
    writable: true
  });
}
