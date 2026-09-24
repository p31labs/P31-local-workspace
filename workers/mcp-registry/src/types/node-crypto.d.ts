/**
 * Minimal type shim for node:crypto under the Workers runtime (nodejs_compat).
 * Keeps global Request/fetch types from @cloudflare/workers-types intact by
 * NOT loading @types/node globally — only this module's surface is declared.
 */
declare module 'node:crypto' {
  export type KeyObject = unknown
  export function createPrivateKey(options: unknown): unknown
  export function createPublicKey(key: unknown): unknown
  export function sign(algorithm: string | null, data: Uint8Array | string, key: unknown): Buffer
  export function verify(algorithm: string | null, data: Uint8Array | string, key: unknown, signature: Uint8Array): boolean
}

interface Buffer extends Uint8Array {
  toString(encoding?: string): string
}