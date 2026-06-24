export const logger = {
  info: (...args) => console.log('[k4-hubs:info]', ...args),
  warn: (...args) => console.warn('[k4-hubs:warn]', ...args),
  error: (...args) => console.error('[k4-hubs:error]', ...args),
  debug: (...args) => console.debug('[k4-hubs:debug]', ...args),
};
