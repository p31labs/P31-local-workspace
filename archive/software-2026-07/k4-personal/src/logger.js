export const logger = {
  info: (...args) => console.log('[k4-personal:info]', ...args),
  warn: (...args) => console.warn('[k4-personal:warn]', ...args),
  error: (...args) => console.error('[k4-personal:error]', ...args),
  debug: (...args) => console.debug('[k4-personal:debug]', ...args),
};
