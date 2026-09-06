import { Peer, DataConnection } from 'peerjs';

export type MeshMessage = {
  type: 'hello' | 'state' | 'ping' | 'pong' | 'leave';
  payload: {
    did: string;
    name?: string;
    spoons?: number;
    mood?: string | null;
    role?: string;
    timerSeconds?: number;
    symmetry?: number;
    curvature?: number;
    timestamp: number;
    publicKey?: string;
    signature?: string;
    mldsa65Sig?: string;
    mldsa65Pub?: string;
    kelEvents?: unknown[];
  };
};

export type MeshVerifyPayload = {
  did: string;
  timestamp: number;
  publicKey?: string;
  signature?: string;
  mldsa65Sig?: string;
  mldsa65Pub?: string;
};

export type MeshNode = {
  did: string;
  publicKey: string;
  endpoint: string;
  lastSeen: number;
  status: string;
  spoons?: number;
  mood?: string;
  role?: string;
  verified?: boolean;
  verification?: 'pending' | 'verified' | 'failed';
  kelEvents?: unknown[];
};

export class HeartbeatMesh {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private heartbeatInterval: number | null = null;
  private readonly HEARTBEAT_MS = 30000;
  private readonly MAX_PEERS = 3;
  private verification: Map<string, { state: 'pending' | 'verified' | 'failed'; verified?: boolean; lastSeen: number }> = new Map();
  private verifySeq = new Map<string, number>();
  private onStateUpdate?: (state: {
    nodes: Map<string, MeshNode>;
    symmetry: number;
    curvature: number;
    topology: 'delta' | 'wye' | 'isolated';
  }) => void;

  constructor(
    private readonly localDid: string,
    onStateUpdate?: (state: {
      nodes: Map<string, MeshNode>;
      symmetry: number;
      curvature: number;
      topology: 'delta' | 'wye' | 'isolated';
    }) => void,
    private readonly verifyPeer?: (payload: MeshVerifyPayload) => Promise<boolean>
  ) {
    this.onStateUpdate = onStateUpdate;
  }

  async connect(signalingServer = '0.peerjs.com'): Promise<string> {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(this.localDid, {
        host: signalingServer,
        port: 443,
        secure: true,
      });

      this.peer.on('open', (id) => {
        console.log('[Mesh] Connected, peer ID:', id);
        this.startHeartbeat();
        resolve(id);
      });

      this.peer.on('connection', (conn) => {
        this.handleConnection(conn);
      });

      this.peer.on('error', (err) => {
        console.error('[Mesh] PeerJS error:', err);
        reject(err);
      });
    });
  }

  connectToPeer(peerId: string): void {
    if (!this.peer) return;
    if (this.connections.has(peerId)) return;
    if (this.connections.size >= this.MAX_PEERS) {
      console.warn('[Mesh] Max peers reached (K₄ topology)');
      return;
    }
    const conn = this.peer.connect(peerId);
    conn.on('open', () => {
      console.log('[Mesh] Outgoing connection to:', peerId);
      this.connections.set(peerId, conn);
      this.updateMeshState();
      this.sendState(conn);
    });
    conn.on('data', (data) => {
      this.handleMessage(data as MeshMessage, conn);
    });
    conn.on('close', () => {
      console.log('[Mesh] Outgoing connection closed:', peerId);
      this.connections.delete(peerId);
      this.updateMeshState();
    });
  }

  private handleConnection(conn: DataConnection) {
    conn.on('open', () => {
      console.log('[Mesh] Incoming connection from:', conn.peer);
      this.connections.set(conn.peer, conn);
      this.updateMeshState();
      this.sendState(conn);
    });

    conn.on('data', (data) => {
      this.handleMessage(data as MeshMessage, conn);
    });

    conn.on('close', () => {
      console.log('[Mesh] Connection closed:', conn.peer);
      this.connections.delete(conn.peer);
      this.updateMeshState();
    });
  }

  private sendState(conn: DataConnection) {
    // State is sent via the broadcast mechanism; initial hello triggers state pull
    const message: MeshMessage = {
      type: 'hello',
      payload: {
        did: this.localDid,
        timestamp: Date.now(),
      },
    };
    conn.send(message);
  }

  broadcast(message: MeshMessage) {
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message);
      }
    });
  }

  private handleMessage(data: MeshMessage, conn: DataConnection) {
    const { payload } = data;
    switch (data.type) {
      case 'hello':
        console.log('[Mesh] Hello from:', payload.did);
        this.connections.set(payload.did, conn);
        this.updateMeshState();
        // Respond with our state
        this.sendState(conn);
        break;
      case 'state':
        this.verifyPayload(payload);
        if (this.onStateUpdate) {
          this.onStateUpdate({
            nodes: this.buildNodeMap(payload),
            symmetry: payload.symmetry ?? 1.0,
            curvature: payload.curvature ?? 0,
            topology: this.computeTopology(),
          });
        }
        break;
      case 'ping':
        conn.send({ type: 'pong', payload: { timestamp: Date.now() } });
        break;
      case 'leave':
        this.connections.delete(payload.did);
        this.updateMeshState();
        break;
      default:
        break;
    }
  }

  private verifyPayload(payload: MeshMessage['payload']): void {
    if (!this.verifyPeer) return;
    if (!payload.signature && !(payload.mldsa65Sig && payload.mldsa65Pub)) return;
    const seq = (this.verifySeq.get(payload.did) ?? 0) + 1;
    this.verifySeq.set(payload.did, seq);
    this.verification.set(payload.did, {
      state: 'pending',
      verified: this.verification.get(payload.did)?.verified,
      lastSeen: payload.timestamp,
    });
    this.verifyPeer(payload)
      .then((ok) => {
        if (this.verifySeq.get(payload.did) !== seq) return;
        this.verification.set(payload.did, {
          state: ok ? 'verified' : 'failed',
          verified: ok,
          lastSeen: payload.timestamp,
        });
        this.updateMeshState();
      })
      .catch(() => {
        if (this.verifySeq.get(payload.did) !== seq) return;
        this.verification.set(payload.did, {
          state: 'failed',
          verified: false,
          lastSeen: payload.timestamp,
        });
        this.updateMeshState();
      });
  }

  private buildNodeMap(payload: MeshMessage['payload']): Map<string, MeshNode> {
    const nodes = new Map<string, MeshNode>();
    const v = this.verifyPeer ? this.verification.get(payload.did) : undefined;
    nodes.set(payload.did, {
      did: payload.did,
      publicKey: payload.publicKey ?? '',
      endpoint: '',
      lastSeen: payload.timestamp,
      status: 'online',
      spoons: payload.spoons,
      mood: payload.mood ?? undefined,
      role: payload.role,
      verified: this.verifyPeer ? (v?.verified ?? false) : !!payload.signature,
      verification: this.verifyPeer && (payload.signature || (payload.mldsa65Sig && payload.mldsa65Pub))
        ? (v?.state ?? 'pending')
        : undefined,
      kelEvents: payload.kelEvents as unknown[],
    });
    return nodes;
  }

  private computeTopology(): 'delta' | 'wye' | 'isolated' {
    const connected = this.connections.size;
    if (connected >= 3) return 'delta';
    if (connected > 0) return 'wye';
    return 'isolated';
  }

  private updateMeshState() {
    if (!this.onStateUpdate) return;
    const nodes = new Map<string, MeshNode>();
    this.connections.forEach((conn, peerId) => {
      const v = this.verification.get(peerId);
      nodes.set(peerId, {
        did: peerId,
        publicKey: '',
        endpoint: conn.peer,
        lastSeen: Date.now(),
        status: 'online',
        verified: v?.verified,
        verification: v?.state,
      });
    });

    this.onStateUpdate({
      nodes,
      symmetry: this.computeSymmetry(),
      curvature: this.computeCurvature(),
      topology: this.computeTopology(),
    });
  }

  private computeSymmetry(): number {
    const connected = this.connections.size;
    const target = this.MAX_PEERS;
    const ratio = connected / target;
    return Math.min(0.95 + ratio * 0.05, 1.0);
  }

  private computeCurvature(): number {
    const connected = this.connections.size;
    const max = this.MAX_PEERS;
    return (connected / max) * 2 - 1;
  }

  private startHeartbeat() {
    this.heartbeatInterval = window.setInterval(() => {
      const message: MeshMessage = {
        type: 'state',
        payload: {
          did: this.localDid,
          timestamp: Date.now(),
        },
      };
      this.broadcast(message);
      this.updateMeshState();
    }, this.HEARTBEAT_MS);
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
    this.verification.clear();
    this.verifySeq.clear();
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}
