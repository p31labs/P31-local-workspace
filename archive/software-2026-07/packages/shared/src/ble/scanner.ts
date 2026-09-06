// ═══════════════════════════════════════════════════════
// @p31/shared — BLE Scanner
//
// Web Bluetooth scanner for ESP32-S3 Totem beacons.
// Uses RSSI-based proximity detection with Log-Distance Path Loss Model.
// Requires user gesture to start scanning (experimental flag needed).
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

import { 
  ZoneId, 
  BeaconAdvertisement, 
  ProximityZone, 
  BLEScannerConfig, 
  BLEScannerState,
  ZoneTransitionEvent 
} from './types';

/**
 * BLE Scanner class for environmental nudging.
 * Handles Web Bluetooth scanning and proximity detection.
 */
export class SpaceshipBLEScanner {
  private static readonly VALID_ZONE_IDS = new Set([0x01, 0x02, 0x03, 0x04, 0x05, 0x06]);
  private static readonly MAX_DEVICES = 50;
  
  private config: BLEScannerConfig;
  private state: BLEScannerState;
  private rssiBuffer = new Map<string, number[]>();
  private scan: any = null;
  private advListener: ((event: any) => void) | null = null;
  private bluetoothRef: any = null;
  private transitionCallback?: (event: ZoneTransitionEvent) => void;

  constructor(config: BLEScannerConfig) {
    this.config = config;
    this.state = {
      isScanning: false,
      lastBeacon: null,
      proximity: 'FAR',
      cooldownUntil: 0,
      error: null,
    };
  }

  /**
   * Check if Web Bluetooth is supported and experimental flag is enabled.
   */
  static isSupported(): boolean {
    return 'bluetooth' in navigator &&
           typeof (navigator as any).bluetooth?.requestLEScan === 'function';
  }

  /**
   * Start BLE scanning. Must be called from user gesture handler.
   */
  async startScan(onTransition: (event: ZoneTransitionEvent) => void): Promise<void> {
    if (!SpaceshipBLEScanner.isSupported()) {
      throw new Error('Web Bluetooth not supported or experimental flag not enabled');
    }

    // Guard: clean up any existing listener before registering a new one.
    // Without this, a double-call overwrites this.advListener, leaking the first listener permanently.
    if (this.state.isScanning) {
      await this.stopScan();
    }

    try {
      this.transitionCallback = onTransition;
      this.state.isScanning = true;
      this.state.error = null;

      const bluetooth = (navigator as any).bluetooth;
      this.scan = await bluetooth.requestLEScan({
        filters: this.config.serviceUUIDs.map(uuid => ({ services: [uuid] })),
        keepRepeatedDevices: true,
      });

      this.bluetoothRef = bluetooth;
      this.advListener = (event: any) => this.handleAdv(event);
      bluetooth.addEventListener('advertisementreceived', this.advListener);

    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.state.isScanning = false;
      throw error;
    }
  }

  /**
   * Stop BLE scanning.
   */
  async stopScan(): Promise<void> {
    if (this.scan) {
      await this.scan.stop();
      this.scan = null;
    }
    if (this.bluetoothRef && this.advListener) {
      this.bluetoothRef.removeEventListener('advertisementreceived', this.advListener);
      this.bluetoothRef = null;
      this.advListener = null;
    }
    this.state.isScanning = false;
  }

  /**
   * Handle incoming BLE advertisement.
   */
  private handleAdv(event: any): void {
    if (Date.now() < this.state.cooldownUntil) return;

    const rssi = event.rssi ?? -100;
    const id = event.device.id;
    
    if (!this.rssiBuffer.has(id)) {
      // Cap the number of tracked devices to prevent memory leaks
      if (this.rssiBuffer.size >= SpaceshipBLEScanner.MAX_DEVICES) {
        const oldestId = this.rssiBuffer.keys().next().value!;
        this.rssiBuffer.delete(oldestId);
      }
      this.rssiBuffer.set(id, []);
    }
    
    const buf = this.rssiBuffer.get(id)!;
    buf.push(rssi);
    while (buf.length > 30) buf.shift(); // ~3s at 100ms intervals

    const smoothed = this.trimmedMean(buf, 0.1);
    const manData = this.parseManufacturerData(event.manufacturerData);
    
    if (!manData) return;

    const txPow = manData.txPower ?? -59;
    const dist = Math.pow(10, (txPow - smoothed) / (10 * 2.5));
    const prox = this.calculateProximity(dist);

    const beacon: BeaconAdvertisement = {
      deviceId: id,
      deviceName: event.device?.name ?? 'Totem',
      rssi: smoothed,
      txPower: txPow,
      serviceUUIDs: event.uuids ?? [],
      manufacturerData: manData,
      timestamp: Date.now(),
      estimatedDistance: dist,
      proximity: prox,
    };

    this.state.lastBeacon = beacon;
    this.state.proximity = prox;

    if (prox === 'IMMEDIATE' || prox === 'NEAR') {
      this.state.cooldownUntil = Date.now() + this.config.cooldownMs;
      this.triggerTransition(beacon);
    }
  }

  /**
   * Calculate proximity zone based on distance.
   */
  private calculateProximity(distance: number): ProximityZone {
    const { immediate, near, approaching } = this.config.proximityThresholds;
    
    if (distance <= immediate) return 'IMMEDIATE';
    if (distance <= near) return 'NEAR';
    if (distance <= approaching) return 'APPROACHING';
    return 'FAR';
  }

  /**
   * Trigger zone transition event.
   */
  private triggerTransition(beacon: BeaconAdvertisement): void {
    if (!this.transitionCallback) return;

    const fromZone = this.getZoneConfig(beacon.manufacturerData.zoneFromId);
    const toZone = this.getZoneConfig(beacon.manufacturerData.zoneToId);
    const direction = beacon.manufacturerData.energyDelta > 0 ? 'calming' : 'energizing';

    const event: ZoneTransitionEvent = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      userId: this.config.userId ?? 'SYSTEM',
      beacon,
      fromZone,
      toZone,
      energyDelta: beacon.manufacturerData.energyDelta,
      direction,
      acknowledged: false,
      dismissedWithoutAck: false,
    };

    this.transitionCallback(event);
  }

  /**
   * Get zone configuration from ZoneId.
   */
  private getZoneConfig(zoneId: ZoneId): any {
    const zoneMap: Record<ZoneId, any> = {
      [ZoneId.WORKSHOP]: {
        id: 'workshop',
        name: 'Workshop',
        energy: 'kinetic' as const,
        rules: ['No loud noises after 10PM', 'Clean up after use'],
        sovereignResident: 'SYSTEM',
        memberCount: 0,
        lastActivity: Date.now(),
      },
      [ZoneId.SOCIAL]: {
        id: 'social',
        name: 'Social',
        energy: 'balanced' as const,
        rules: ['Respect quiet hours', 'Keep volume reasonable'],
        sovereignResident: 'SYSTEM',
        memberCount: 0,
        lastActivity: Date.now(),
      },
      [ZoneId.FOCUS]: {
        id: 'focus',
        name: 'Focus',
        energy: 'ordered' as const,
        rules: ['No talking', 'Phones on silent'],
        sovereignResident: 'SYSTEM',
        memberCount: 0,
        lastActivity: Date.now(),
      },
      [ZoneId.MEDITATION]: {
        id: 'meditation',
        name: 'Meditation',
        energy: 'still' as const,
        rules: ['Silence required', 'Remove shoes'],
        sovereignResident: 'SYSTEM',
        memberCount: 0,
        lastActivity: Date.now(),
      },
      [ZoneId.KITCHEN]: {
        id: 'kitchen',
        name: 'Kitchen',
        energy: 'balanced' as const,
        rules: ['Clean as you go', 'No leaving dishes overnight'],
        sovereignResident: 'SYSTEM',
        memberCount: 0,
        lastActivity: Date.now(),
      },
      [ZoneId.COMMONS]: {
        id: 'commons',
        name: 'Commons',
        energy: 'balanced' as const,
        rules: ['Keep walkways clear', 'Respect others'],
        sovereignResident: 'SYSTEM',
        memberCount: 0,
        lastActivity: Date.now(),
      },
    };

    return zoneMap[zoneId] || zoneMap[ZoneId.COMMONS];
  }

  /**
   * Parse manufacturer data from BLE advertisement.
   */
  private parseManufacturerData(data: any): any {
    if (!data) return null;

    try {
      const buffer = data.buffer || data;
      const view = new DataView(buffer);
      
      // Expected format: companyId (2 bytes) + zoneFromId (1 byte) + zoneToId (1 byte) + energyDelta (1 byte) + flags (1 byte)
      if (view.byteLength < 6) return null;

      const companyId = view.getUint16(0, true);
      const zoneFromId = view.getUint8(2);
      const zoneToId = view.getUint8(3);
      const energyDelta = view.getInt8(4);
      const flagsByte = view.getUint8(5);

      // Validate zone IDs to prevent injection attacks
      if (!SpaceshipBLEScanner.VALID_ZONE_IDS.has(zoneFromId) || 
          !SpaceshipBLEScanner.VALID_ZONE_IDS.has(zoneToId)) {
        return null;
      }

      return {
        companyId,
        zoneFromId,
        zoneToId,
        energyDelta,
        flags: {
          hapticEnabled: !!(flagsByte & 0x01),
          requiresAck: !!(flagsByte & 0x02),
        },
      };
    } catch (error) {
      console.warn('Failed to parse manufacturer data:', error);
      return null;
    }
  }

  /**
   * Calculate trimmed mean to reduce RSSI noise.
   */
  private trimmedMean(values: number[], trim: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const n = Math.floor(sorted.length * trim);
    const trimmed = sorted.slice(n, sorted.length - n);
    return trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length;
  }

  /**
   * Get current scanner state.
   */
  getState(): BLEScannerState {
    return { ...this.state };
  }

  /**
   * Send haptic feedback to ESP32 Totem.
   * This would need to be implemented via WebSocket or direct BLE connection.
   */
  async triggerHapticFeedback(beacon: BeaconAdvertisement): Promise<void> {
    if (!this.config.enableHaptic) return;
    
    // TODO: Implement haptic trigger via WebSocket to ESP32
    // This requires the ESP32 to expose a WebSocket server or accept BLE commands
    console.log('Haptic feedback triggered for:', beacon.deviceId);
  }
}

/**
 * Default BLE scanner configuration.
 */
export const defaultBLEConfig: BLEScannerConfig = {
  serviceUUIDs: ['0000feaa-0000-1000-8000-00805f9b34fb'], // Google Eddystone
  enableHaptic: true,
  proximityThresholds: {
    immediate: 0.5,  // 0.5 meters
    near: 2.0,       // 2 meters
    approaching: 5.0, // 5 meters
  },
  cooldownMs: 30_000, // 30 seconds
};