/** Shared HTTP helpers for K4 Workers (JSON + CORS). */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-P31-Token',
};

/**
 * @param {unknown} data
 * @param {number} [status]
 * @param {Record<string, string>} [extraHeaders] merged into response (e.g. X-Request-ID)
 */
export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

/**
 * @param {string} message
 * @param {number} [status]
 * @param {{ code?: string, requestId?: string }} [opts] structured errors when code or requestId set
 */
export function err(message, status = 400, opts = {}) {
  const ts = new Date().toISOString();
  const code = opts.code ?? 'HTTP_ERROR';
  const payload =
    opts.requestId != null || opts.code != null
      ? {
          error: { code, message },
          ...(opts.requestId != null ? { requestId: opts.requestId } : {}),
          timestamp: ts,
        }
      : { error: message, timestamp: ts };
  const xh = opts.requestId != null ? { 'X-Request-ID': opts.requestId } : {};
  return json(payload, status, xh);
}
