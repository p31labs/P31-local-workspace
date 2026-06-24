export const VERSION = '1.0.0' as const;
export function getVersion(): string { return VERSION; }

function validateEnv(env: string | undefined): string {
  const allowed = ['production', 'development', 'test'];
  if (env && !allowed.includes(env)) return 'production';
  return env || 'production';
}

export function healthCheck(): { status: string; version: string; timestamp: string; service: string; env: string } {
  try {
    return { status: 'ok', version: VERSION, timestamp: new Date().toISOString(), service: 'willow', env: validateEnv(process.env.NODE_ENV) };
  } catch (e) {
    return { status: 'error', version: VERSION, timestamp: new Date().toISOString(), service: 'willow', env: 'unknown' };
  }
}
