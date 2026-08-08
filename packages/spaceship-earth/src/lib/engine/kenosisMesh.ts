/**
 * @file kenosisMesh.ts — Kenosis mesh handshake stub.
 *
 * Kenosis (self-emptying) mesh connection lifecycle: starts disconnected,
 * exposes a singleton instance and a stable connection/error surface.
 * Connection is initiated externally (BROS / signaling) — this module owns
 * the observable state contract only.
 */

export interface KenosisMeshClass {
  getConnectionState(): string;
  isConnected(): boolean;
  getLastError(): string | null;
}

export class KenosisMesh implements KenosisMeshClass {
  private lastError: string | null = null;

  getConnectionState(): string {
    return 'disconnected';
  }

  isConnected(): boolean {
    return false;
  }

  getLastError(): string | null {
    return this.lastError;
  }
}

let instance: KenosisMesh | null = null;

/** Lazily-initialized singleton. */
export function getKenosisMesh(): KenosisMesh {
  if (!instance) instance = new KenosisMesh();
  return instance;
}
