// Re-exports from @p31/shared — WCD-M02
// Canonical implementation promoted to packages/shared/src/telemetry/telemetryStore.ts
// Zero behavior change. All bonding imports from this path continue to work.
export {
  telemetryAddEvent,
  telemetrySeal,
  telemetryRecoverOrphans,
  telemetryInit,
  telemetryAttachLifecycleHandlers,
  telemetryCleanup,
  telemetryGetBuffer,
  telemetryGetSessionId,
} from '@p31/shared/telemetry';
export type { TelemetryEvent, TelemetryConfig } from '@p31/shared/telemetry';
