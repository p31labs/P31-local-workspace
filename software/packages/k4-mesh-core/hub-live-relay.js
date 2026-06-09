/**
 * Outbound hub ping relay — validates URL, times out, surfaces errors (no silent failures).
 */

const MAX_URL_LEN = 2048;
export const HUB_RELAY_TIMEOUT_MS = 8000;

/**
 * @param {unknown} raw
 * @returns {{ ok: true, href: string } | { ok: false, reason: string }}
 */
export function validateRelayUrl(raw) {
  const s = String(raw ?? '').trim();
  if (!s) return { ok: false, reason: 'empty' };
  if (s.length > MAX_URL_LEN) return { ok: false, reason: 'url_too_long' };
  let u;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }
  if (u.protocol !== 'https:') return { ok: false, reason: 'https_only' };
  const host = u.hostname;
  if (!host || host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return { ok: false, reason: 'host_not_allowed' };
  }
  return { ok: true, href: u.href };
}

/**
 * @param {(level: 'warn' | 'error', code: string, detail?: Record<string, unknown>) => void} [emit]
 */
export async function dispatchHubPingRelay(relayUrl, secret, payload, emit) {
  const v = validateRelayUrl(relayUrl);
  if (!v.ok) {
    emit?.('warn', 'relay_url_invalid', { reason: v.reason });
    return { ok: false, error: v.reason };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), HUB_RELAY_TIMEOUT_MS);
  try {
    const res = await fetch(v.href, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { 'X-P31-Relay-Secret': String(secret) } : {}),
      },
      body: JSON.stringify(payload),
    });
    clearTimeout(timer);
    if (!res.ok) {
      const code = `http_${res.status}`;
      emit?.('warn', 'relay_upstream_error', { status: res.status });
      return { ok: false, error: code, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    clearTimeout(timer);
    const name = /** @type {{ name?: string }} */ (e).name;
    const err = name === 'AbortError' ? 'timeout' : /** @type {Error} */ (e).message || 'fetch_failed';
    emit?.('error', 'relay_fetch_failed', { name: name || 'Error', detail: String(err) });
    return { ok: false, error: String(err) };
  }
}
