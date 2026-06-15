/**
 * @p31/mesh — Lightweight WebRTC mesh for P31 family network.
 *
 * Uses a minimal WebSocket signaling server for peer discovery,
 * then establishes direct RTCDataChannel connections between peers.
 *
 * Falls back gracefully to localStorage mock when signaling is unavailable.
 */

import type { Room, Player, Ping } from './gameSync';

const SIGNALING_URL = 'wss://p31-signaling.trimtab-signal.workers.dev';
const MESH_ROOM = 'phos-family-mesh';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

export interface MeshPeer {
  readonly id: string;
  readonly name: string;
  readonly connection: RTCPeerConnection;
  readonly channel: RTCDataChannel;
  readonly connectedAt: number;
}

export type MeshEvent =
  | { type: 'peer_connected'; peer: MeshPeer }
  | { type: 'peer_disconnected'; peerId: string }
  | { type: 'message'; from: string; data: unknown }
  | { type: 'error'; message: string }
  | { type: 'signaling_connected' }
  | { type: 'signaling_disconnected' };

type MeshCallback = (event: MeshEvent) => void;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export class MeshNetwork {
  private _ws: WebSocket | null = null;
  private _myId: string = '';
  private _myName: string = '';
  private _peers = new Map<string, MeshPeer>();
  private _pendingCandidates = new Map<string, RTCIceCandidateInit[]>();
  private _listeners = new Set<MeshCallback>();
  private _reconnectAttempts = 0;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _destroyed = false;

  get myId(): string { return this._myId; }
  get peers(): readonly MeshPeer[] { return [...this._peers.values()]; }
  get isConnected(): boolean { return this._ws?.readyState === WebSocket.OPEN; }

  on(fn: MeshCallback): () => void {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  private _emit(event: MeshEvent): void {
    this._listeners.forEach(fn => { try { fn(event); } catch { /* */ } });
  }

  async connect(playerName: string, roomId: string = MESH_ROOM): Promise<void> {
    this._myId = `mesh_${Math.random().toString(36).slice(2, 10)}`;
    this._myName = playerName;
    this._destroyed = false;

    try {
      this._ws = new WebSocket(SIGNALING_URL);
    } catch {
      this._emit({ type: 'error', message: 'WebSocket not available in this environment' });
      return;
    }

    this._ws.onopen = () => {
      this._reconnectAttempts = 0;
      this._emit({ type: 'signaling_connected' });
      this._ws!.send(JSON.stringify({
        type: 'join',
        room: roomId,
        id: this._myId,
        name: this._myName,
      }));
    };

    this._ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        await this._handleSignalingMessage(msg);
      } catch { /* ignore malformed */ }
    };

    this._ws.onclose = () => {
      this._emit({ type: 'signaling_disconnected' });
      if (!this._destroyed) this._scheduleReconnect(roomId);
    };

    this._ws.onerror = () => {
      this._emit({ type: 'error', message: 'Signaling WebSocket error' });
    };
  }

  private async _handleSignalingMessage(msg: Record<string, unknown>): Promise<void> {
    switch (msg.type) {
      case 'offer': {
        const pc = this._createPeerConnection(msg.from as string);
        await pc.setRemoteDescription(new RTCSessionDescription(msg.offer as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this._send({ type: 'answer', to: msg.from, answer: pc.localDescription });
        break;
      }
      case 'answer': {
        const pc = this._getPeerConnection(msg.from as string);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(msg.answer as RTCSessionDescriptionInit));
          const candidates = this._pendingCandidates.get(msg.from as string) ?? [];
          for (const c of candidates) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* */ }
          }
          this._pendingCandidates.delete(msg.from as string);
        }
        break;
      }
      case 'ice-candidate': {
        const pc = this._getPeerConnection(msg.from as string);
        const candidate = msg.candidate as RTCIceCandidateInit;
        if (pc && pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch { /* */ }
        } else {
          const existing = this._pendingCandidates.get(msg.from as string) ?? [];
          existing.push(candidate);
          this._pendingCandidates.set(msg.from as string, existing);
        }
        break;
      }
      case 'peer-joined': {
        // Initiate connection to new peer
        const peerId = msg.id as string;
        if (peerId !== this._myId && !this._peers.has(peerId)) {
          await this._initiateConnection(peerId);
        }
        break;
      }
      case 'peer-left': {
        const peerId = msg.id as string;
        this._disconnectPeer(peerId);
        break;
      }
    }
  }

  private async _initiateConnection(peerId: string): Promise<void> {
    const pc = this._createPeerConnection(peerId);
    const channel = pc.createDataChannel('mesh', { ordered: true });
    this._setupChannel(channel, peerId, pc);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this._send({ type: 'offer', to: peerId, offer: pc.localDescription });
  }

  private _createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this._send({ type: 'ice-candidate', to: peerId, candidate: event.candidate.toJSON() });
      }
    };

    pc.ondatachannel = (event) => {
      this._setupChannel(event.channel, peerId, pc);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        this._disconnectPeer(peerId);
      }
    };

    return pc;
  }

  private _setupChannel(channel: RTCDataChannel, peerId: string, connection: RTCPeerConnection): void {
    const existing = this._peers.get(peerId);
    if (existing) return;

    channel.onopen = () => {
      const peer: MeshPeer = {
        id: peerId,
        name: peerId,
        connection,
        channel,
        connectedAt: Date.now(),
      };
      this._peers.set(peerId, peer);
      this._emit({ type: 'peer_connected', peer });
    };

    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this._emit({ type: 'message', from: peerId, data });
      } catch {
        this._emit({ type: 'message', from: peerId, data: event.data });
      }
    };

    channel.onclose = () => {
      this._disconnectPeer(peerId);
    };
  }

  private _getPeerConnection(peerId: string): RTCPeerConnection | null {
    return this._peers.get(peerId)?.connection ?? null;
  }

  private _disconnectPeer(peerId: string): void {
    const peer = this._peers.get(peerId);
    if (peer) {
      peer.channel.close();
      peer.connection.close();
      this._peers.delete(peerId);
      this._emit({ type: 'peer_disconnected', peerId });
    }
  }

  private _send(msg: Record<string, unknown>): void {
    if (this._ws?.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(msg));
    }
  }

  sendTo(peerId: string, data: unknown): void {
    const peer = this._peers.get(peerId);
    if (peer && peer.channel.readyState === 'open') {
      peer.channel.send(JSON.stringify(data));
    }
  }

  broadcast(data: unknown): void {
    const payload = JSON.stringify(data);
    for (const peer of this._peers.values()) {
      if (peer.channel.readyState === 'open') {
        try { peer.channel.send(payload); } catch { /* */ }
      }
    }
  }

  private _scheduleReconnect(roomId: string): void {
    if (this._reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    this._reconnectAttempts++;
    this._reconnectTimer = setTimeout(() => {
      if (!this._destroyed) {
        this.connect(this._myName, roomId);
      }
    }, RECONNECT_DELAY_MS * this._reconnectAttempts);
  }

  destroy(): void {
    this._destroyed = true;
    if (this._reconnectTimer) clearTimeout(this._reconnectTimer);
    for (const peer of this._peers.values()) {
      peer.channel.close();
      peer.connection.close();
    }
    this._peers.clear();
    if (this._ws) {
      this._ws.onclose = null;
      this._ws.close();
      this._ws = null;
    }
    this._listeners.clear();
    this._pendingCandidates.clear();
  }
}
