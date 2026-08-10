import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';

export interface KenosisMeshClass {
  getConnectionState(): string;
  isConnected(): boolean;
  getLastError(): string | null;
  connect(roomId: string): Promise<void>;
  disconnect(): void;
  onPeerCount(callback: (count: number) => void): () => void;
}

type ConnectionState = 'disconnected' | 'connecting' | 'handshaking' | 'connected' | 'error';

export class KenosisMesh implements KenosisMeshClass {
  private state: ConnectionState = 'disconnected';
  private lastError: string | null = null;
  private peerCount = 0;
  private peerCallbacks = new Set<(count: number) => void>();
  private ydoc: Y.Doc | null = null;
  private provider: WebrtcProvider | null = null;
  private awareness: WebrtcProvider['awareness'] | null = null;

  getConnectionState(): string {
    return this.state;
  }

  isConnected(): boolean {
    return this.state === 'connected';
  }

  getLastError(): string | null {
    return this.lastError;
  }

  private setState(s: ConnectionState) {
    this.state = s;
  }

  private setError(message: string) {
    this.lastError = message;
    this.setState('error');
  }

  private emitPeers() {
    for (const cb of this.peerCallbacks) {
      cb(this.peerCount);
    }
  }

  async connect(roomId: string): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting' || this.state === 'handshaking') {
      return;
    }

    this.lastError = null;
    this.setState('connecting');

    try {
      this.ydoc = new Y.Doc();
      this.provider = new WebrtcProvider(roomId, this.ydoc, {
        signaling: ['wss://signaling.yjs.dev'],
      });

      this.awareness = this.provider.awareness;

      this.awareness.on('change', () => {
        const count = this.awareness!.getStates().size;
        if (count !== this.peerCount) {
          this.peerCount = count;
          this.emitPeers();
        }
      });

      this.provider.on('synced', () => {
        if (this.state === 'connecting') {
          this.setState('handshaking');
        }
      });

      (this.provider as unknown as { on: (ev: string, cb: () => void) => void }).on('connection-close', () => {
        if (this.state === 'connected' || this.state === 'handshaking') {
          this.lastError = 'Peer connection closed';
          this.setState('disconnected');
          this.peerCount = 0;
          this.emitPeers();
        }
      });

      (this.provider as unknown as { on: (ev: string, cb: () => void) => void }).on('connection-failed', () => {
        this.setError('WebRTC connection failed');
      });

      this.setState('handshaking');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      this.setError(message);
      this.cleanup();
    }
  }

  disconnect(): void {
    this.cleanup();
    this.lastError = null;
    this.setState('disconnected');
    this.peerCount = 0;
    this.emitPeers();
  }

  onPeerCount(callback: (count: number) => void): () => void {
    this.peerCallbacks.add(callback);
    return () => {
      this.peerCallbacks.delete(callback);
    };
  }

  private cleanup() {
    if (this.provider) {
      this.provider.disconnect();
      this.provider.destroy();
      this.provider = null;
      this.awareness = null;
    }
    if (this.ydoc) {
      this.ydoc.destroy();
      this.ydoc = null;
    }
  }
}

let instance: KenosisMesh | null = null;

export function getKenosisMesh(): KenosisMesh {
  if (!instance) instance = new KenosisMesh();
  return instance;
}

export function resetKenosisMesh(): void {
  if (instance) {
    instance.disconnect();
  }
  instance = null;
}
