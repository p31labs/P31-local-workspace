export const VERSION = '0.0.1' as const;
export function getVersion(): string { return VERSION; }

export function healthCheck() {
  try {
    return { status: 'ok' as const, version: VERSION, timestamp: new Date().toISOString(), endpoint: '/health' };
  } catch (e) {
    return { status: 'error' as const, error: String(e) };
  }
}
