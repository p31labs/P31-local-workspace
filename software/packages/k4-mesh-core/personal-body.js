/**
 * Bounded JSON parsing and sanitization for k4-personal POST handlers.
 */

export const DEFAULT_MAX_JSON_BYTES = 32 * 1024;
const MAX_METADATA_KEYS = 32;
const MAX_KEY_LEN = 64;
const MAX_STRING_LEN = 2048;

/**
 * @param {Request} request
 * @param {number} maxBytes
 * @returns {Promise<{ ok: true, value: Record<string, unknown> } | { ok: false, status: number, message: string }>}
 */
export async function parseJsonObjectBody(request, maxBytes = DEFAULT_MAX_JSON_BYTES) {
  const cl = request.headers.get('Content-Length');
  if (cl != null && cl !== '' && Number(cl) > maxBytes) {
    return { ok: false, status: 413, message: 'Request body too large' };
  }

  const buf = await request.arrayBuffer();
  if (buf.byteLength > maxBytes) {
    return { ok: false, status: 413, message: 'Request body too large' };
  }
  if (buf.byteLength === 0) {
    return { ok: true, value: {} };
  }

  let value;
  try {
    value = JSON.parse(new TextDecoder().decode(buf));
  } catch {
    return { ok: false, status: 400, message: 'Invalid JSON' };
  }

  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, status: 400, message: 'JSON body must be a single object' };
  }

  return { ok: true, value };
}

/**
 * Shallow metadata object: finite primitives only, bounded keys and string length.
 * @param {unknown} raw
 * @returns {Record<string, string|number|boolean>|undefined}
 */
export function sanitizeMetadata(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  /** @type {Record<string, string|number|boolean>} */
  const out = {};
  let n = 0;
  for (const [k, v] of Object.entries(raw)) {
    if (n >= MAX_METADATA_KEYS) break;
    if (typeof k !== 'string' || k.length === 0 || k.length > MAX_KEY_LEN) continue;
    if (typeof v === 'string') {
      const t = v.length > MAX_STRING_LEN ? v.slice(0, MAX_STRING_LEN) : v;
      out[k] = t;
      n++;
    } else if (typeof v === 'number' && Number.isFinite(v)) {
      out[k] = v;
      n++;
    } else if (typeof v === 'boolean') {
      out[k] = v;
      n++;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

const MAX_STATUS_LEN = 32;

/**
 * Allowed presence status labels (extend by widening this set if product needs).
 * @param {unknown} s
 */
export function sanitizeStatus(s) {
  if (typeof s !== 'string') return 'online';
  const t = s.trim().slice(0, MAX_STATUS_LEN);
  const allowed = new Set(['online', 'offline', 'away', 'busy', 'dnd']);
  if (allowed.has(t)) return t;
  return 'online';
}

const MAX_EMOJI_GLYPHS = 8;

/**
 * @param {unknown} raw
 */
export function sanitizeEmoji(raw) {
  if (raw == null) return '💚';
  const s = String(raw).trim();
  if (!s) return '💚';
  const chars = [...s];
  return chars.slice(0, MAX_EMOJI_GLYPHS).join('') || '💚';
}
