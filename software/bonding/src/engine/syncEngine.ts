// P31 Labs: D1 Multiplayer State Synchronizer
// Replaces legacy KV polling with D1 db.batch() logic

import { telemetry } from './telemetryClient';

const RELAY_URL = 'https://bonding-relay.trimtab-signal.workers.dev';
const SYNC_INTERVAL_MS = 3000;

export class SyncEngine {
  private roomId: string;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private isSyncing: boolean = false;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  public start() {
    if (this.syncInterval) return;
    
    console.log(`[SyncEngine] Connecting to Delta Mesh. Room: ${this.roomId}`);
    telemetry.log({ eventType: 'session_start', payload: { roomId: this.roomId } });

    this.syncInterval = setInterval(() => this.sync(), SYNC_INTERVAL_MS);
    
    this.sync();
  }

  public stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private async sync() {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const response = await fetch(`${RELAY_URL}/d1/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: this.roomId,
          playerId: telemetry.getPlayerId(),
          playerState: {},
          roomState: {}
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.peers) {
          console.log(`[SyncEngine] Reconciled ${data.peers.length} peers`);
        }
      }
    } catch (err) {
      console.warn('[SyncEngine] Mesh sync skipped (offline or throttling).');
    } finally {
      this.isSyncing = false;
    }
  }
}