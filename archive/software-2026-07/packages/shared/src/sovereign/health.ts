/**
 * Health endpoint helper for P31 Sovereign artifacts.
 *
 * Provides a standardized health check response that consumers (Workers,
 * Pages, servers) can wire into their /health endpoints. Satisfies the
 * FRUIT OPS dimension requirement for monitoring and health checks.
 *
 * Usage:
 *   import { createHealthResponse } from '@p31/shared/sovereign';
 *
 *   // In a Cloudflare Worker:
 *   export default { fetch(req) {
 *     if (new URL(req.url).pathname === '/health')
 *       return Response.json(createHealthResponse(VERSION));
 *   }};
 */

export interface HealthDependency {
  status: 'ok' | 'degraded' | 'down';
  latency?: number;
  message?: string;
}

export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  metric?: number;
}

export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  timestamp: string;
  uptime?: number;
  dependencies: Record<string, HealthDependency>;
  checks?: Record<string, HealthCheck>;
}

export interface HealthOptions {
  dependencies?: Record<string, HealthDependency>;
  checks?: Record<string, HealthCheck>;
  startTime?: number;
}

export function createHealthResponse(
  version: string,
  options: HealthOptions = {},
): HealthResponse {
  const { dependencies = {}, checks, startTime } = options;

  const dependencyStatuses = Object.values(dependencies).map((d) => d.status);
  const hasDown = dependencyStatuses.includes('down');
  const hasDegraded = dependencyStatuses.includes('degraded');

  const status: HealthResponse['status'] = hasDown
    ? 'down'
    : hasDegraded
      ? 'degraded'
      : 'ok';

  return {
    status,
    version,
    timestamp: new Date().toISOString(),
    uptime: startTime ? Math.floor((Date.now() - startTime) / 1000) : undefined,
    dependencies,
    ...(checks ? { checks } : {}),
  };
}
