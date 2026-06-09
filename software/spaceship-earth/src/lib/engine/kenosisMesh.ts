/**
 * @file kenosisMesh.ts — Kenosis Mesh (Delta Topology CRDT Engine)
 * 
 * Hardened with:
 * - Input validation & sanitization
 * - Error boundaries for WebRTC/IndexedDB failures
 * - Connection state tracking
 * - Graceful degradation on offline
 * - Memory leak prevention
 * - Type guards for null/undefined
 */

import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebrtcProvider } from 'y-webrtc';
import { useSovereignStore } from '../../sovereign/useSovereignStore';

export type MeshConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface KenosisMeshConfig {
  signalingServers?: string[];
  maxRemoteSpoons?: number;
  persistenceKey?: string;
}

// Public signaling servers are unreliable — default to local-only (IndexedDB).
// Pass signalingServers in config to enable cross-device WebRTC sync.
const DEFAULT_SIGNALING: string[] = [];
const MAX_SPOONS = 12;
const CONNECTION_TIMEOUT_MS = 15000;

function clampSpoons(value: unknown): number {
  if (typeof value !== 'number' || isNaN(value)) return 0;
  return Math.max(0, Math.min(MAX_SPOONS, Math.floor(value)));
}

function validateRoomName(name: unknown): string {
  if (typeof name !== 'string' || name.length === 0) return 'p31-local-mesh';
  return name.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 64) || 'p31-local-mesh';
}

class KenosisMesh {
  private doc: Y.Doc | null = null;
  private provider: WebrtcProvider | null = null;
  private persistence: IndexeddbPersistence | null = null;
  private stateMap: Y.Map<any> | null = null;
  private telemetryArray: Y.Array<any> | null = null;
  
  private connectionState: MeshConnectionState = 'disconnected';
  private lastError: string | null = null;
  private connectionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.destroy());
    }
  }

  public getConnectionState(): MeshConnectionState {
    return this.connectionState;
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public isConnected(): boolean {
    return this.connectionState === 'connected' && this.provider !== null;
  }

  public async ignite(config?: KenosisMeshConfig): Promise<boolean> {
    if (this.isDestroyed) {
      console.warn('[KenosisMesh] Cannot ignite: instance destroyed');
      return false;
    }

    if (this.connectionState === 'connected' || this.connectionState === 'connecting') {
      console.warn('[KenosisMesh] Already ignited');
      return true;
    }

    const roomName = validateRoomName(config?.persistenceKey || 'p31-mesh');
    const signaling = config?.signalingServers?.filter(s => typeof s === 'string' && s.startsWith('wss://')) || DEFAULT_SIGNALING;

    this.setConnectionState('connecting');
    this.lastError = null;

    try {
      this.doc = new Y.Doc();

      this.stateMap = this.doc.getMap('spaceship-earth-state');
      this.telemetryArray = this.doc.getArray('genesis-telemetry');

      this.persistence = new IndexeddbPersistence(roomName, this.doc);

      this.persistence.on('synced', () => {
        console.log('[KenosisMesh] Local IndexedDB hydrated');
        this.syncToZustand();
      });

      this.persistence.on('error', (err: Error) => {
        console.error('[KenosisMesh] IndexedDB error:', err.message);
        this.lastError = err.message;
      });

      this.stateMap.observeDeep(() => {
        if (!this.isDestroyed) this.syncToZustand();
      });

      if (signaling.length > 0) {
        this.provider = new WebrtcProvider(roomName, this.doc, { signaling });

        this.provider.on('synced', () => {
          console.log('[KenosisMesh] WebRTC synced');
          this.setConnectionState('connected');
          this.clearConnectionTimeout();
          this.syncToZustand();
        });

        this.provider.on('peers', (event: { webrtcPeers: string[] }) => {
          console.log(`[KenosisMesh] Peers: ${event.webrtcPeers?.length || 0}`);
        });

        this.provider.on('status', (event: { connected: boolean }) => {
          if (!event.connected) {
            console.warn('[KenosisMesh] WebRTC disconnected');
            this.setConnectionState('disconnected');
          }
        });

        this.connectionTimeoutId = setTimeout(() => {
          if (this.connectionState === 'connecting') {
            console.warn('[KenosisMesh] Connection timeout, falling back to local-only');
            this.setConnectionState('connected');
          }
        }, CONNECTION_TIMEOUT_MS);
      } else {
        // Local-only mode: IndexedDB persistence without WebRTC
        this.setConnectionState('connected');
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('[KenosisMesh] Failed to ignite:', message);
      this.lastError = message;
      this.setConnectionState('error');
      return false;
    }
  }

  private setConnectionState(state: MeshConnectionState) {
    this.connectionState = state;
  }

  private clearConnectionTimeout() {
    if (this.connectionTimeoutId) {
      clearTimeout(this.connectionTimeoutId);
      this.connectionTimeoutId = null;
    }
  }

  private syncToZustand() {
    if (!this.stateMap || this.isDestroyed) return;

    try {
      const remoteSpoons = clampSpoons(this.stateMap.get('spoons'));
      const remoteStatus = this.stateMap.get('genesisSyncStatus');

      if (remoteSpoons > 0) {
        useSovereignStore.setState({ spoons: Math.max(useSovereignStore.getState().spoons, remoteSpoons) });
      }

      if (typeof remoteStatus === 'string') {
        useSovereignStore.setState({ genesisSyncStatus: remoteStatus as any });
      }
    } catch (err) {
      console.error('[KenosisMesh] Sync error:', err);
    }
  }

  public broadcastState(key: string, value: unknown): boolean {
    if (!this.stateMap || this.connectionState !== 'connected' || this.isDestroyed) {
      return false;
    }

    try {
      const safeKey = String(key).substring(0, 64);
      if (safeKey.length === 0) return false;

      this.stateMap.set(safeKey, value);
      return true;
    } catch (err) {
      console.error('[KenosisMesh] Broadcast error:', err);
      return false;
    }
  }

  public broadcastSpoons(spoons: number): boolean {
    return this.broadcastState('spoons', clampSpoons(spoons));
  }

  public broadcastGenesisStatus(status: string): boolean {
    return this.broadcastState('genesisSyncStatus', String(status).substring(0, 128));
  }

  public halt() {
    this.clearConnectionTimeout();
    
    if (this.provider) {
      try {
        this.provider.disconnect();
      } catch (e) {}
      this.provider = null;
    }

    if (this.persistence) {
      try {
        this.persistence.destroy();
      } catch (e) {}
      this.persistence = null;
    }

    if (this.doc) {
      try {
        this.doc.destroy();
      } catch (e) {}
      this.doc = null;
    }

    this.stateMap = null;
    this.telemetryArray = null;
    this.setConnectionState('disconnected');
    console.log('[KenosisMesh] Halted');
  }

  public destroy() {
    this.isDestroyed = true;
    this.halt();
  }
}

export const mesh = new KenosisMesh();

export const getKenosisMesh = () => mesh;

export type { KenosisMesh as KenosisMeshClass };