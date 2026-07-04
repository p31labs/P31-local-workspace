import { VERSION, getVersion } from '../version';

export function healthCheck() {
  try {
    return {
      status: 'ok' as const,
      version: VERSION,
      timestamp: new Date().toISOString(),
      endpoint: '/health',
    };
  } catch (e) {
    return {
      status: 'error' as const,
      error: String(e),
    };
  }
}

export { getVersion };
