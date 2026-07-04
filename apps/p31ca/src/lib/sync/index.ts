// src/lib/sync/index.ts
// P31 Multi-Device Sync Module - Public API
// Implements Gap B: PGLite Sync Strategy (Cross-Device Offline-First)

export {
  // Core sync functions
  initSync,
  flushOfflineQueue,
  setupNetworkMonitoring,
  startPeriodicSync,
  getDoc,
  addSyncListener,

  // Types
  NAMESPACES,
  type Namespace,
  type SyncEvent,
} from './p31-sync';

export {
  // PGLite bridge
  initPGLite,
  syncYjsToPGLite,
  getLatestCalciumReading,
  estimateCalciumLevel,

  // Data types
  type BiometricReading,
  type MedicationDose,
  type SpoonEntry,
  type AccommodationLog,
} from './yjs-to-pglite-bridge';

export { SCHEMA, type CaRow, type SpoonRow, type ShiftRow, type EvidenceRow } from './schema';
export { detectConflict, type SyncConflict, type ConflictResolution } from './conflict';
