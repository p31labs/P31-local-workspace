import { fetchTetra, fetchHealth } from './tetraClient';
import { mockTelemetry } from './mockTelemetry';
import { mapTopology, type DashboardData } from './mapTopology';

export type TelemetrySource = 'mock' | 'real';

const USE_MOCK = (import.meta.env.VITE_USE_MOCK_TELEMETRY ?? 'true') !== 'false';

export function activeSource(): TelemetrySource {
  return USE_MOCK ? 'mock' : 'real';
}

// Real worker returns faces + health only (no per-vertex metrics); mapTopology
// backfills metrics as undefined so the UI can fall back to "—".
export async function fetchTelemetryFrom(kind: TelemetrySource): Promise<DashboardData> {
  if (kind === 'mock') return mockTelemetry();

  const [tetra, health] = await Promise.allSettled([fetchTetra(), fetchHealth()]);
  const data = mapTopology(
    tetra.status === 'fulfilled' ? tetra.value : null,
    health.status === 'fulfilled' ? health.value : null,
  );
  if (tetra.status === 'rejected' && health.status === 'rejected') {
    throw new Error('worker-unreachable');
  }
  data.stats.gatheredAt = data.stats.gatheredAt ?? new Date().toISOString();
  return data;
}
