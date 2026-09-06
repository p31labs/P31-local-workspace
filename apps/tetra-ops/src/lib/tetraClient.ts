// Relative paths so the Vite dev proxy (see vite.config.ts) forwards to the
// worker without CORS, and production (same p31ca.org zone) is same-origin.
// Override the proxied target with VITE_TETRA_HUB_URL when running `vite dev`.
export interface TetraPayload {
  schema?: string;
  gatheredAt?: string;
  topology?: { kind?: string; vertices?: number; edges?: number };
  faces?: {
    personal?: unknown;
    cage?: unknown;
    hubs?: unknown;
  };
}

export interface HealthPayload {
  schema?: string;
  ok?: boolean;
  upstream?: {
    cage?: { alive?: boolean };
    personal?: { alive?: boolean };
    hubs?: { alive?: boolean };
  };
}

const TIMEOUT_MS = 4000;

async function getJson<T>(path: string): Promise<T> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${path} -> ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

export function fetchTetra(): Promise<TetraPayload> {
  return getJson<TetraPayload>('/api/tetra');
}

export function fetchHealth(): Promise<HealthPayload> {
  return getJson<HealthPayload>('/api/health');
}
