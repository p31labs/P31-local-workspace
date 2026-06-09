// @p31/sovereign — Sovereign Stack SDK
// NOTE: hardware.ts, chain.ts are future-use (BLE/LoRa integration).
// Not currently imported by any app. Kept for SDK completeness.
export * from './types';
export * from './identity';
export * from './ucan';
export * from './chain';
export {
  type HardwareTransport,
  type HardwareStatus,
  type HapticEffect,
  CMD,
  HAPTIC_EFFECTS,
  encodeCommand,
  decodeCommand,
  encodeHapticCommand,
} from './hardware';
