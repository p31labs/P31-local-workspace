// ═══════════════════════════════════════════════════════
// @p31/shared — BLE Types
//
// Web Bluetooth types for environmental nudging system.
// ESP32-S3 Totem devices broadcast custom service UUIDs
// with manufacturer data containing zone information.
//
// Based on WCD-SE-SDS specification for Spaceship Earth.
// ═══════════════════════════════════════════════════════

export enum ZoneId {
  WORKSHOP    = 0x01,  // High-energy kinetic
  SOCIAL      = 0x02,  // Communal area
  FOCUS       = 0x03,  // Quiet focus room
  MEDITATION  = 0x04,  // Stillness space
  KITCHEN     = 0x05,  // Shared kitchen
  COMMONS     = 0x06,  // Transition area
}

export enum ZoneEnergy {
  KINETIC   = 'kinetic',
  BALANCED  = 'balanced',
  ORDERED   = 'ordered',
  STILL     = 'still',
}

export type ProximityZone = 'IMMEDIATE' | 'NEAR' | 'APPROACHING' | 'FAR';

export interface BeaconAdvertisement {
  deviceId: string;
  deviceName: string;
  rssi: number;
  txPower: number;
  serviceUUIDs: string[];
  manufacturerData: {
    companyId: number;          // 0x02E5 (Espressif)
    zoneFromId: ZoneId;
    zoneToId: ZoneId;
    energyDelta: number;        // Signed: positive = calming
    flags: {
      hapticEnabled: boolean;
      requiresAck: boolean;
    };
  };
  timestamp: number;
  estimatedDistance: number;
  proximity: ProximityZone;
}

export interface ZoneTransitionEvent {
  id: string;
  timestamp: number;
  userId: string;
  beacon: BeaconAdvertisement;
  fromZone: ZoneConfig;
  toZone: ZoneConfig;
  energyDelta: number;
  direction: 'calming' | 'energizing' | 'neutral';
  acknowledged: boolean;
  dismissedWithoutAck: boolean;
}

export interface ZoneConfig {
  id: string;
  name: string;
  energy: ZoneEnergy;
  rules: string[];
  sovereignResident: string;
  memberCount: number;
  lastActivity: number;
}

export interface BLEScannerConfig {
  serviceUUIDs: string[];
  enableHaptic: boolean;
  proximityThresholds: {
    immediate: number;  // meters
    near: number;       // meters
    approaching: number; // meters
  };
  cooldownMs: number;
  userId?: string;      // Optional user ID for zone transitions
}

export interface BLEScannerState {
  isScanning: boolean;
  lastBeacon: BeaconAdvertisement | null;
  proximity: ProximityZone;
  cooldownUntil: number;
  error: string | null;
}