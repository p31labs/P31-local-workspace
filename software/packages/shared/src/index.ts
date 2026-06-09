// @p31/shared — System-wide shared modules
// Promoted from bonding/src/genesis/ in WCD-M02

export * from './schema-versions';
export * from './cogpass-consumer-registry';
export * from './events';
export * from './economy';
export * from './telemetry';
export * from './types';
export * from './net';
export * from './ui';
export * from './sovereign';
export * from './rules';
export * from './zui';
export * from './ble';
export * from './theme';
export * from './trust';
export * from './hibernation';

// Re-export shared types to avoid conflicts
export type { ZoneConfig, ZoneEnergy } from './zui/types';
