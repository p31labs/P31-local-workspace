/**
 * P31 standardized health response shape.
 * Every worker returns this shape at GET /health.
 */

export interface HealthCheck {
  ok: boolean;
  latency_ms?: number;
}

export interface HealthResponse {
  ok: boolean;
  surface: string;
  version: string;
  timestamp: string;
  status: 'operational' | 'degraded' | 'down';
  uptime_ms?: number;
  checks?: Record<string, HealthCheck>;
}

export function health(surface: string, version = '0.0.1', checks: Record<string, HealthCheck> = {}): HealthResponse {
  const allOk = Object.values(checks).every((c) => c.ok);
  return {
    ok: allOk,
    surface,
    version,
    timestamp: new Date().toISOString(),
    status: allOk ? 'operational' : checks.length > 0 ? 'degraded' : 'operational',
    checks,
  };
}
