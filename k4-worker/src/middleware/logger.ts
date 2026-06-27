/**
 * Structured logging middleware with correlation IDs
 * Uses Cloudflare's automatic tracing for spans
 */

export interface Logger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, error?: Error, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
}

export function createLogger(request: Request): Logger {
  const rayId = request.headers.get('cf-ray') || 'unknown';
  const invocationId = crypto.randomUUID();

  return {
    info: (message: string, meta?: Record<string, unknown>) => {
      console.log(JSON.stringify({
        level: 'info',
        message,
        rayId,
        invocationId,
        service: 'k4-cage',
        timestamp: new Date().toISOString(),
        ...meta,
      }));
    },
    error: (message: string, error?: Error, meta?: Record<string, unknown>) => {
      console.error(JSON.stringify({
        level: 'error',
        message,
        rayId,
        invocationId,
        service: 'k4-cage',
        timestamp: new Date().toISOString(),
        error: error?.message,
        stack: error?.stack,
        ...meta,
      }));
    },
    warn: (message: string, meta?: Record<string, unknown>) => {
      console.warn(JSON.stringify({
        level: 'warn',
        message,
        rayId,
        invocationId,
        service: 'k4-cage',
        timestamp: new Date().toISOString(),
        ...meta,
      }));
    },
  };
}
