import type { EyeData, WhoAmI } from './types';

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { accept: 'application/json', ...(init?.body ? { 'content-type': 'application/json' } : {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return (await res.json()) as T;
}

export function fetchEye(): Promise<EyeData> {
  return json<EyeData>('/api/eye');
}

export function fetchWhoami(): Promise<WhoAmI> {
  return json<WhoAmI>('/api/whoami').catch(() => ({ authenticated: false }));
}

export async function controlAction(action: 'quarantine' | 'rollback', name: string, reason?: string) {
  return json<{ ok: boolean; message?: string; error?: string }>(`/api/control/${action}`, {
    method: 'POST',
    body: JSON.stringify({ name, reason }),
  });
}

/** Live push via SSE; falls back silently if the stream is unavailable. */
export function openEyeStream(onUpdate: () => void): () => void {
  let es: EventSource | null = null;
  try {
    es = new EventSource('/api/sse');
    es.addEventListener('status', () => onUpdate());
    es.onmessage = () => onUpdate();
    es.onerror = () => {
      /* let polling fallback carry it */
    };
  } catch {
    es = null;
  }
  return () => es?.close();
}
