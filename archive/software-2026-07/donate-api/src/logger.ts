export const logger = {
  info: (...args: unknown[]) => console.log('[donate-api:info]', ...args),
  warn: (...args: unknown[]) => console.warn('[donate-api:warn]', ...args),
  error: (...args: unknown[]) => console.error('[donate-api:error]', ...args),
  debug: (...args: unknown[]) => console.debug('[donate-api:debug]', ...args),
};
