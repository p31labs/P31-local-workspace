import { VERSION } from './version';

export interface HealthResponse {
  service: string;
  status: string;
  version: string;
  timestamp: string;
}

export function buildHealthResponse(serviceName: string): HealthResponse {
  return {
    service: serviceName,
    status: 'ok',
    version: VERSION,
    timestamp: new Date().toISOString(),
  };
}

export function healthHandler(
  request: Request,
  serviceName: string = 'p31-orchestrator'
): Response {
  try {
    if (request.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const health = buildHealthResponse(serviceName);
    return new Response(JSON.stringify(health), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Health check failed', detail: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
