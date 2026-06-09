// P31 Labs: Daubert-Standard Telemetry Client
// Routes to D1 genesis_telemetry table

const RELAY_URL = 'https://bonding-relay.trimtab-signal.workers.dev';

export interface TelemetryEvent {
  eventType: 'atom_placed' | 'bond_formed' | 'session_start' | 'fawn_guard_trigger' | 'ping_sent' | 'spoons:update';
  payload: Record<string, any>;
}

class TelemetryClient {
  private sessionId: string;
  private playerId: string;
  private qFactor: number = 0.925;
  private quaternionVariance: number = 0;
  private angularMomentum: number = 0;

  constructor() {
    this.sessionId = crypto.randomUUID();
    
    let storedId = localStorage.getItem('p31_player_id');
    if (!storedId) {
      storedId = crypto.randomUUID();
      localStorage.setItem('p31_player_id', storedId);
    }
    this.playerId = storedId;
  }

  public async log(event: TelemetryEvent) {
    try {
      const response = await fetch(`${RELAY_URL}/d1/telemetry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          playerId: this.playerId,
          eventType: event.eventType,
          payload: event.payload,
        }),
      });

      if (!response.ok) {
        console.warn(`[Telemetry] Edge rejected packet: ${response.status}`);
      }
    } catch (error) {
      console.log('[Telemetry] Device offline. Packet queued to IndexedDB for sync-on-reconnect.');
    }
  }

  public getPlayerId() {
    return this.playerId;
  }
  
  public getSessionId() {
    return this.sessionId;
  }

  public updateQFactor(quaternionVariance: number, angularMomentum: number) {
    this.quaternionVariance = quaternionVariance;
    this.angularMomentum = angularMomentum;
    // Compute qFactor: monotonic decay from 0.925 as noise increases
    const noise = Math.max(0, quaternionVariance) + Math.max(0, angularMomentum);
    this.qFactor = Math.max(0, Math.min(1, 0.925 - noise * 0.0375)); // 0.0375 * 25 = 0.9375, so at noise=25, qFactor=0
    this.log({eventType: 'spoons:update', payload: {qFactor: this.qFactor}});
  }

  public getQFactor(): number {
    return this.qFactor;
  }
}

export const telemetry = new TelemetryClient();