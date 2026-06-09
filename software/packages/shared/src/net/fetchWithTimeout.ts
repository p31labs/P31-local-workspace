// fetchWithTimeout — AbortController-based fetch with configurable timeout.
// Rejects with DOMException (AbortError) on timeout.

const DEFAULT_TIMEOUT_MS = 10_000;

export function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...init, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}
